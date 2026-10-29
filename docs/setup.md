# APAAR-Vault Setup & Execution Guide

Follow this guide to run the full **APAAR-Vault** platform locally.

---

## 1. Prerequisites

- **Python:** 3.11 or 3.12
- **Node.js:** v18+ or v20+ (Node v24 supported)
- **Git** (optional)
- **Docker & Docker Compose** (optional for production containerization)

---

## 2. Backend Setup (FastAPI & Database)

### 2.1 Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2.2 Run Backend Verification & Seeding
```bash
python backend/test_backend.py
python backend/test_api_endpoints.py
```

### 2.3 Start FastAPI Development Server
```bash
python -m uvicorn app.main:app --app-dir backend --reload --port 8080
```
- API Base URL: `http://localhost:8080`
- Swagger OpenAPI Documentation: `http://localhost:8080/docs`
- Redoc Interactive Documentation: `http://localhost:8080/redoc`
- Health Check: `http://localhost:8080/api/v1/health`

---

## 3. Frontend Setup (Next.js App Router)

### 3.1 Install Frontend Dependencies
```bash
cd frontend
npm install lucide-react recharts
```

### 3.2 Start Next.js Development Server
```bash
npm run dev
```
*(Runs on port 3001 via `package.json` / `.env.local`)*
- Web Application: `http://localhost:3001`

---

## 4. Demonstration Accounts (Pre-Seeded)

| Role | Email | Password | Description |
|---|---|---|---|
| **Super Admin** | `superadmin@aicte.gov.in` | `Admin@12345` | Global oversight & configuration |
| **AICTE Admin** | `aicte.admin@aicte.gov.in` | `Aicte@12345` | National regulatory dashboard, duplicate triage |
| **Institution Admin (DITS)** | `principal@dits.ac.in` | `Inst@12345` | Compliant institute (Delhi Inst of Tech) |
| **Institution Admin (MCER)** | `dean@mcer.edu.in` | `Inst@12345` | Excess intake institute (Pune Engineering) |
| **Student** | `rahul.sharma@student.dits.ac.in` | `Student@12345` | B.Tech CSE student portal |
| **External Verifier** | `verifier@tcs-background.com` | `Verifier@12345` | Third-party background verifier |

---

## 5. Live Demonstration Workflow for SIH Presentation

1. **AICTE National View:** Login as `aicte.admin@aicte.gov.in`.
   - Observe national metrics: approved intake vs actual enrolment.
   - Spot the excess intake warning for MCER (+14 seats over approved limit).
   - Review cross-institution duplicate alert for student *Ananya Sen*.
2. **Institution Data Upload:** Switch to `principal@dits.ac.in`.
   - Navigate to **Bulk Upload**.
   - Upload `data/demo/sample_students_with_errors_and_duplicates.csv`.
   - Observe real-time validation: valid students imported, duplicates flagged, error report generated.
3. **Third-Party Verification:**
   - Open `/verify`.
   - Scan or enter pre-seeded code `APAAR-VRF-2024-X99Q2M1`.
   - Instant tamper-evident credential verification with demo badge displayed.
