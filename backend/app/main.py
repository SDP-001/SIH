from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base, get_db, SessionLocal
from app.api.v1 import (
    auth, institutions, intake, students,
    imports, validation, verification, dashboard, reports,
    assistant, data_quality, corrections, audit
)
from app.services.seed_service import seed_database
from app.services.validation_engine import init_default_validation_rules
from app.models.models import User

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed if database is fresh
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Fresh database detected. Seeding initial demonstration data...")
            seed_database(db)
            print("Demonstration data seeded successfully.")
        init_default_validation_rules(db)
    except Exception as e:
        print(f"Error during startup seeding: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "**AI-Powered Academic Identity & Student Verification Platform (APAAR-Vault)**\n\n"
        "Smart India Hackathon Problem Statement 26263 — AICTE Regulation Bureau.\n\n"
        "*One Academic Identity. Verified Records. Trusted Education.*"
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration - supports Vercel, Render, local dev and custom domains
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/v1/health", tags=["System Health"])
@app.get("/api/v1/health/", tags=["System Health"], include_in_schema=False)
def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connectivity
        db.execute(Base.metadata.tables["roles"].select().limit(1))
        db_status = "HEALTHY"
    except Exception as e:
        db_status = f"UNHEALTHY: {str(e)}"

    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "demonstration_mode": settings.DEMO_MODE,
        "problem_statement": settings.PROBLEM_STATEMENT_ID,
        "organization": settings.ORGANIZATION
    }

def register_dual_slash_routes(router):
    """
    Ensures every route in the router responds to both trailing slash and non-trailing slash
    paths directly, eliminating 307 Temporary Redirects which cause HTTP clients to drop
    Authorization headers.
    """
    existing_paths = {(route.path, tuple(sorted(route.methods))) for route in router.routes if isinstance(route, APIRoute)}
    new_routes = []
    for route in router.routes:
        if isinstance(route, APIRoute):
            if route.path.endswith("/") and len(route.path) > 1:
                alt = route.path.rstrip("/")
            elif not route.path.endswith("/"):
                alt = route.path + "/"
            else:
                alt = None
            if alt and (alt, tuple(sorted(route.methods))) not in existing_paths:
                new_routes.append(
                    APIRoute(
                        path=alt,
                        endpoint=route.endpoint,
                        response_model=route.response_model,
                        methods=list(route.methods),
                        include_in_schema=False,
                        dependencies=route.dependencies
                    )
                )
                existing_paths.add((alt, tuple(sorted(route.methods))))
    router.routes.extend(new_routes)

# Register API routers with dual-slash support
api_routers = [
    auth.router, institutions.router, intake.router, students.router,
    imports.router, validation.router, verification.router, dashboard.router,
    reports.router, assistant.router, data_quality.router, corrections.router,
    audit.router
]

for router in api_routers:
    register_dual_slash_routes(router)
    app.include_router(router, prefix=settings.API_V1_STR)

