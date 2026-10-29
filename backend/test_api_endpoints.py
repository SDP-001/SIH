import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    # Ensure fresh demo seed before API tests
    from app.core.database import SessionLocal
    from app.services.seed_service import seed_database
    from app.models.models import ApprovedIntake
    db = SessionLocal()
    seed_database(db)
    # Ensure MCER has excess intake (60 approved, 74 actual)
    mcer_intake = db.query(ApprovedIntake).filter(ApprovedIntake.actual_enrolment == 74).first()
    if mcer_intake:
        mcer_intake.approved_intake = 60
        db.commit()
    db.close()

    print("Testing 1: Health Check...")
    r = client.get("/api/v1/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health_data = r.json()
    assert health_data["status"] == "ONLINE"
    assert health_data["database"] == "HEALTHY"
    print("Health Check PASSED!")

    print("Testing 2: AICTE Admin Login...")
    r = client.post("/api/v1/auth/login", json={
        "email": "aicte.admin@aicte.gov.in",
        "password": "Aicte@12345"
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    aicte_auth = r.json()
    assert "access_token" in aicte_auth
    assert "AICTE_ADMIN" in aicte_auth["roles"]
    aicte_token = aicte_auth["access_token"]
    aicte_headers = {"Authorization": f"Bearer {aicte_token}"}
    print("AICTE Admin Login PASSED!")

    print("Testing 3: Institution Admin Login...")
    r = client.post("/api/v1/auth/login", json={
        "email": "principal@dits.ac.in",
        "password": "Inst@12345"
    })
    assert r.status_code == 200, f"Login failed: {r.text}"
    inst_auth = r.json()
    inst_token = inst_auth["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}
    print("Institution Admin Login PASSED!")

    print("Testing 4: List Institutions...")
    r = client.get("/api/v1/institutions", headers=aicte_headers)
    assert r.status_code == 200
    institutions = r.json()
    assert len(institutions) >= 3
    print(f"List Institutions PASSED! Found {len(institutions)} institutions.")

    print("Testing 5: Cross-Institution Security Check (RBAC & Isolation)...")
    dits_inst = next(i for i in institutions if "Delhi Institute" in i["name"])
    dits_inst_id = dits_inst["id"]
    mcer_inst = next(i for i in institutions if "Maharashtra College" in i["name"])
    mcer_inst_id = mcer_inst["id"]
    
    # Institution 1 user attempts to access Institution 2 data
    r = client.get(f"/api/v1/institutions/{mcer_inst_id}", headers=inst_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden for cross-institution access, got: {r.status_code}"
    print("Cross-institution access barrier PASSED (403 Forbidden received as required)!")

    print("Testing 6: AICTE Dashboard Metrics...")
    r = client.get("/api/v1/dashboard/aicte", headers=aicte_headers)
    assert r.status_code == 200, f"Dashboard failed: {r.text}"
    metrics = r.json()
    assert metrics["total_institutions"] >= 3
    assert metrics["total_reported_students"] >= 4
    assert metrics["institutions_with_excess_intake"] >= 1
    assert metrics["open_duplicate_alerts"] >= 1
    print("AICTE Dashboard Metrics PASSED!")

    print("Testing 7: Intake Discrepancy Alerts...")
    r = client.get("/api/v1/intake/alerts", headers=aicte_headers)
    assert r.status_code == 200
    alerts = r.json()
    assert len(alerts) >= 1
    assert alerts[0]["excess_seats"] > 0
    print(f"Intake Discrepancy Alerts PASSED! Flagged {len(alerts)} excess enrolment courses.")

    print("Testing 8: Verification Flow & Public Credential Check...")
    # Find student Rahul Sharma who is VALID
    r = client.get("/api/v1/students?search=Rahul", headers=aicte_headers)
    assert r.status_code == 200
    students = r.json()
    assert len(students) >= 1
    rahul = students[0]

    # Create verification token for Rahul
    r = client.post("/api/v1/verification/request", json={
        "student_id": rahul["id"],
        "purpose": "Academic Verification for Hackathon Demo"
    }, headers=aicte_headers)
    assert r.status_code == 200
    ver_data = r.json()
    code = ver_data["verification_code"]
    assert ver_data["qr_code_base64"] is not None
    print(f"Generated Verification Code: {code}")

    # Public verification check (unauthenticated verifier)
    r = client.get(f"/api/v1/verification/verify/{code}")
    assert r.status_code == 200
    pub_ver = r.json()
    assert pub_ver["student_name"] == rahul["student_name"]
    assert pub_ver["status"] == "VERIFIED", f"Expected VERIFIED, got {pub_ver['status']}"
    assert pub_ver["demo_mode"] == True
    print("Public Academic Verification for Valid Student PASSED (VERIFIED)!")

    # Now verify student with warning (Ananya Sen) gets REVIEW_REQUIRED
    r = client.get("/api/v1/students?search=Ananya", headers=aicte_headers)
    ananya = next((s for s in r.json() if s.get("data_validation_status") == "WARNING"), r.json()[0])
    r = client.post("/api/v1/verification/request", json={
        "student_id": ananya["id"],
        "purpose": "Academic Verification for Duplicate Student"
    }, headers=aicte_headers)
    assert r.status_code == 200
    ver_ananya = r.json()
    assert ver_ananya["status"] == "REVIEW_REQUIRED"
    print("Verification for Duplicate/Flagged Student correctly flagged as REVIEW_REQUIRED!")

    print("Testing 9: Token Revocation Workflow...")
    r = client.post(f"/api/v1/verification/{code}/revoke", json={
        "reason": "Student transferred to external autonomous institution"
    }, headers=aicte_headers)
    assert r.status_code == 200
    # Verify public endpoint now reflects REVOKED
    r = client.get(f"/api/v1/verification/verify/{code}")
    assert r.status_code == 200
    rev_data = r.json()
    assert rev_data["status"] == "REVOKED", f"Expected REVOKED status, got {rev_data['status']}"
    print("Token Revocation test PASSED! Token successfully marked as REVOKED.")

    print("Testing 10: AICTE Officer Assistant API (Innovation 6)...")
    r = client.post("/api/v1/assistant/query", json={
        "question": "Which institutions have unresolved intake discrepancies?"
    }, headers=aicte_headers)
    assert r.status_code == 200
    assistant_res = r.json()
    assert assistant_res["structured_intent"] == "INTAKE_DISCREPANCY_INSPECTION"
    assert "summary_answer" in assistant_res
    assert len(assistant_res["supporting_data"]) >= 1
    print("AICTE Officer Assistant API test PASSED!")

    print("Testing 11: Transparent Data Quality Index API (Innovation 7)...")
    r = client.get(f"/api/v1/data-quality/{dits_inst_id}", headers=aicte_headers)
    assert r.status_code == 200
    dqi_res = r.json()
    assert "overall_dqi_score" in dqi_res
    assert "component_scores" in dqi_res
    assert dqi_res["overall_dqi_score"] > 50
    print(f"Data Quality Index API test PASSED! DQI: {dqi_res['overall_dqi_score']} ({dqi_res['rating_tier']})")

    print("Testing 12: Validation Rules & Results API (Innovation 3)...")
    r = client.get("/api/v1/validation/rules", headers=aicte_headers)
    assert r.status_code == 200
    rules = r.json()
    assert len(rules) >= 5
    print(f"Validation Rules API test PASSED! Retrieved {len(rules)} configurable rules.")

    print("Testing 13: Regulatory Reports Generator API (Innovation 8)...")
    r = client.get("/api/v1/reports/types", headers=aicte_headers)
    assert r.status_code == 200
    types = r.json()
    assert len(types) >= 8
    # Test JSON generation
    r = client.get("/api/v1/reports/generate?report_type=institution_enrolment", headers=aicte_headers)
    assert r.status_code == 200
    rep_gen = r.json()
    assert rep_gen["total_records"] >= 1
    # Test CSV export
    r = client.get("/api/v1/reports/export/csv?report_type=institution_enrolment", headers=aicte_headers)
    assert r.status_code == 200
    assert "text/csv" in r.headers["content-type"]
    print("Regulatory Reports Generator API test PASSED (JSON & CSV verified)!")

    print("Testing 14: Correction Request Workflow...")
    r = client.post(f"/api/v1/corrections/?institution_id={dits_inst_id}", json={
        "student_id": rahul["id"],
        "field_name": "phone",
        "requested_value": "+91-9876599999",
        "justification": "Student updated mobile contact number with registrar"
    }, headers=inst_headers)
    assert r.status_code == 200
    corr = r.json()
    assert corr["status"] == "PENDING"
    corr_id = corr["id"]

    # AICTE admin resolves the correction
    r = client.post(f"/api/v1/corrections/{corr_id}/resolve", json={
        "status": "APPROVED",
        "review_notes": "Verified against institutional registrar memo."
    }, headers=aicte_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "APPROVED"
    print("Correction Request Workflow test PASSED!")

    print("Testing 15: Audit Trail Logs API...")
    r = client.get("/api/v1/audit/", headers=aicte_headers)
    assert r.status_code == 200
    logs = r.json()
    assert len(logs) >= 5
    print(f"Audit Trail Logs API test PASSED! Found {len(logs)} audited system actions.")

    print("ALL API ENDPOINT INTEGRATION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    test_api()

