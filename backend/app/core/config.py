import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "APAAR-Vault"
    PROJECT_FULL_NAME: str = "AI-Powered Academic Identity & Student Verification Platform"
    PROBLEM_STATEMENT_ID: str = "26263"
    ORGANIZATION: str = "AICTE - Regulation Bureau"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "sqlite:///./apaar_vault.db"

    # JWT Security
    SECRET_KEY: str = "apaar-vault-hackathon-secure-secret-key-32chars-min-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Demonstration Mode
    DEMO_MODE: bool = True

    # Frontend URL & Server Ports
    FRONTEND_URL: str = "http://localhost:3001"
    BACKEND_PORT: int = 8080
    FRONTEND_PORT: int = 3001

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ]

    # External APIs (Configurable / Mocked for Demo)
    APAAR_API_BASE_URL: str = "https://api.mock-apaar.gov.in/v1"
    APAAR_API_KEY: str = "mock-demonstration-key"
    AICTE_API_BASE_URL: str = "https://api.mock-aicte.gov.in/v1"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
