# APAAR-Vault: AI-Powered Academic Identity & Regulatory Verification Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Smart India Hackathon Problem Statement 26263**  
> **Organization:** All India Council for Technical Education (AICTE) — Regulation Bureau  
> **Theme:** Smart Automation  
> **Tagline:** *One Academic Identity. Verified Records. Trusted Education.*

---

## 🌟 Executive Summary

**APAAR-Vault** is a rule-compliant, privacy-first regulatory platform engineered for the **AICTE Regulation Bureau**. It establishes a centralized, tamper-evident system for managing, monitoring, and verifying student-level admissions across approved technical institutions across India.

The platform provides end-to-end automation across the student lifecycle:
**Institutional Submission → Deterministic Validation → Intelligent Duplicate Detection → Smart Admission Monitoring → Authorized Review → Privacy-Preserving Academic Verification → Regulatory Analytics.**

---

## 🛡️ 15 Non-Negotiable Regulatory Rules Compliance Matrix

| # | Non-Negotiable Rule | Implementation in APAAR-Vault |
|---|---|---|
| **1** | Do not automatically reject students based only on duplicate records | 5-stage human triage workflow (`NEW`, `UNDER_REVIEW`, `CONFIRMED_DUPLICATE`, `NOT_A_DUPLICATE`, `RESOLVED`). Consequential actions require authorized determination. |
| **2** | Do not declare fraud based only on an AI-generated anomaly | AI/ML outputs (Isolation Forest & statistical Z-scores) are explicitly advisory anomaly recommendations requiring human inquiry. |
| **3** | Do not claim APAAR ID is genuine based only on its format | Format validation is separated from official verification status; format matches are marked `FORMAT_VALID`, not verified. |
| **4** | Do not claim official verification without authorized response | Public verification displays the explicit label: *"Demonstration Mode — Official APAAR Verification Not Connected"*. |
| **5** | Do not automatically declare regulatory violations without applying rules | Configurable validation engine executes versioned deterministic rules (`VAL-REQ-001` through `VAL-APAAR-007`) with complete explanations. |
| **6** | Do not expose complete student records to unauthorized users | Strict role-based access control (RBAC) and data minimization; PII is scoped to permitted user roles. |
| **7** | Do not put raw APAAR identifiers in QR codes, URLs, or logs | QR matrices and URLs contain only high-entropy cryptographic token references (`APAAR-VRF-...`). APAAR IDs are masked (`SIM-APAAR-****-984210`). |
| **8** | Do not allow an institution to access another's restricted data | Backend tenant isolation via `verify_institution_access()`. Returns `403 Forbidden` on unauthorized cross-tenant queries. |
| **9** | Do not overwrite historical approved-intake records | `ApprovedIntakeRevision` table records immutable audit trails of all intake adjustments with previous/new seats, approval order ref, and reason. |
| **10** | Do not treat missing data as proof of misconduct | Missing data generates explainable validation warnings and correction requests, never punitive actions. |
| **11** | Do not allow AI to independently make consequential decisions | AI outputs provide explainability scores, contributing factors, and suggested actions, preserving human oversight. |
| **12** | Do not use real student data in demonstration mode | All demonstration institutions, courses, and student records are 100% synthetic and clearly labeled. |
| **13** | Do not fabricate API connectivity or model accuracy | All simulated verification responses and ML metrics are explicitly tagged with demonstration notices. |
| **14** | Do not add unrelated features | Every innovation directly addresses Problem Statement 26263 requirements. |
| **15** | Apply authentication, audit logging, and encryption | Bcrypt password hashing, JWT authentication, granular audit ledger, and cryptographic verification seals. |

---

## 💡 The 8 Core Innovations

### 1. Intelligent Duplicate Detection
Identifies repeated student records across 5 distinct regulatory scenarios:
- **Batch Upload Duplicates:** Multiple occurrences within a single CSV/XLSX file.
- **Intra-Institutional Conflicts:** Duplicate registration numbers within the same institution.
- **Cross-Institutional Enrolments:** Concurrently enrolled across multiple institutions under the same identity.
- **Exact APAAR Conflicts:** Conflicting demographic claims on the same APAAR identifier.
- **Repeated Submissions:** Duplicate submissions of an already active student record.

### 2. Smart Admission Monitoring (Rule 9 Preserved)
Compares actual reported enrolments against AICTE-sanctioned intake quotas:
- **Discrepancy Calculation:** `Enrolled - Sanctioned Base Intake = Potential Discrepancy`.
- **Supernumerary Seat Accounting:** Differentiates Tuition Fee Waiver (TFW 5%), Economically Weaker Section (EWS 10%), PMSSS, and PIO seats.
- **Immutable Revision History (Rule 9):** Sanctioned intake revisions are logged in `approved_intake_revisions` with AICTE Approval Order Reference, previous vs. new intake, and justification.

### 3. Explainable Validation Engine
Deterministic validation of institutional submissions against configurable regulatory rules:
- `VAL-REQ-001` (v1.0): Mandatory Field Completeness Check.
- `VAL-FMT-002` (v1.0): Field Format & Regex Syntax Validation.
- `VAL-INST-003` (v1.0): Institution & Course Entity Resolution.
- `VAL-INTAKE-004` (v1.0): Admission vs. Sanctioned Intake Capacity Check.
- `VAL-AY-005` (v1.0): Academic Year Consistency Verification.
- `VAL-DUP-006` (v1.0): Cross-Record Duplicate Enrolment Check.
- `VAL-APAAR-007` (v1.0): APAAR Identifier Format & Checksum Verification.
Every validation output includes Rule ID, Rule Version, Affected Record, Severity, Inputs, Explanation, and Corrective Action.

### 4. AI-Assisted Anomaly Detection
Detects systemic irregularities using statistical baselines and scikit-learn's `IsolationForest`:
- Enrolment surge spikes (>30% year-over-year deviation).
- High validation error concentration clusters.
- Elevated duplicate alert frequencies.
- Explains contributing anomaly factors and maintains an officer feedback loop (`CONFIRMED`, `DISMISSED`).

### 5. Privacy-Preserving Academic Verification
Secure verification without exposing raw student PII:
- **High-Entropy Tokens:** `APAAR-VRF-YYYY-XXXXXXXXXX`.
- **Tripartite Status Classification (Section 8):**
  1. *Token Validity:* `CRYPTOGRAPHICALLY_ACTIVE`, `EXPIRED`, or `REVOKED`.
  2. *Academic Claim:* `VERIFIED_INSTITUTIONAL_RECORD` vs. `REVIEW_REQUIRED_DISCREPANCIES`.
  3. *Official APAAR Status:* `"Demonstration Mode — Official APAAR Verification Not Connected"`.
- **Credential Revocation:** Authorized officers can immediately revoke compromised or withdrawn credentials with timestamped justification.

### 6. AICTE Officer Assistant
Conversational intelligence assistant executing structured SQL queries without hallucinations:
- **Intake Discrepancy Queries:** *"Which institutions have unresolved intake discrepancies?"*
- **Pending Verification Inquiries:** *"How many records are awaiting verification?"*
- **Error Clustering:** *"Which courses have the most validation errors?"*
- **Enrolment Trends:** *"Show enrolment trends for the selected academic year."*
- **Duplicate Summaries:** *"Summarize unresolved duplicate alerts."*
Provides complete data lineage, underlying SQL parameters, and direct navigation links.

### 7. Institution Data-Quality Index (DQI)
Transparent, mathematical data quality indicator computed across 6 weighted dimensions:
$$\text{DQI} = (w_1 \cdot \text{Completeness}) + (w_2 \cdot \text{Error Freedom}) + (w_3 \cdot \text{Uniqueness}) + (w_4 \cdot \text{Verification Rate}) + (w_5 \cdot \text{Correction Rate}) + (w_6 \cdot \text{Freshness})$$
- Default Weights: Completeness (20%), Error Freedom (25%), Uniqueness (20%), Verification (15%), Corrections (10%), Freshness (10%).
- *Non-punitive guarantee:* Transparently labeled as an advisory diagnostic tool, not an official punitive rating.

### 8. Regulatory Report Generator
Automated regulatory export service supporting 8 compliance schemas:
- Institution-Wise Enrolment Breakdown.
- Course-Wise Intake vs. Enrolment Compliance.
- Sanctioned Intake Discrepancy Summary.
- APAAR Identifier Verification Status.
- Cross-Institution Duplicate Alert Register.
- Institution Data Quality & Anomaly Report.
- Pending Institutional Correction Requests.
- Comprehensive Regulatory Audit Ledger.
Supports CSV streaming, formatted XLSX workbooks, and printable executive summaries with audit trail logging.

---

## 👥 7 User Roles & Demonstration Credentials

Pre-seeded for instant demonstration without configuration:

| Role | Email | Password | Scope & Permissions |
|---|---|---|---|
| **Super Administrator** | `superadmin@aicte.gov.in` | `Admin@12345` | Global system control, rule configuration, audit ledger access. |
| **AICTE Administrator** | `aicte.admin@aicte.gov.in` | `Aicte@12345` | National regulatory dashboard, excess intake triage, AI officer assistant. |
| **Institution Admin (Compliant)** | `principal@dits.ac.in` | `Inst@12345` | Delhi Institute of Tech (DITS) — student registry, bulk upload. |
| **Institution Admin (Excess Intake)** | `dean@mcer.edu.in` | `Inst@12345` | Maharashtra College (MCER) — has 14 excess seats demo for inspection. |
| **Department Coordinator** | `cse.hod@dits.ac.in` | `Coord@12345` | CSE Department student records and validation review. |
| **Data Entry Operator** | `operator@dits.ac.in` | `Operator@12345` | Student record onboarding and CSV/XLSX submission. |
| **Student** | `rahul.sharma@student.dits.ac.in` | `Student@12345` | Personal academic record portal and verification token generation. |
| **External Verifier** | `verifier@tcs-background.com` | `Verifier@12345` | Public cryptographic credential validation portal. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ (tested on Node.js 20+)

### 2. Backend Setup
```bash
# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run the backend test suites
python test_backend.py          # 12 Unit & Innovation service tests
python test_api_endpoints.py    # 15 Integration & API tests

# Start the FastAPI server (configured on port 8080)
python -m uvicorn app.main:app --reload --port 8080
```
- Interactive Swagger API Documentation: [http://localhost:8080/docs](http://localhost:8080/docs)
- Health Check: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if needed)
npm install

# Validate Next.js production build
npm run build

# Start Next.js development server (configured on port 3001)
npm run dev
```
- Application Web Portal: [http://localhost:3001](http://localhost:3001)

---

## 📂 Project Structure

```
SIH 2.0/
├── frontend/                     # Next.js 16 App Router Web Application
│   ├── app/                      # App router pages (dashboard, verify/[code])
│   ├── components/               # React components for all 8 innovations
│   │   ├── AicteAssistantView.tsx        # Innovation 6: AICTE AI Officer Assistant
│   │   ├── IntakeMonitoringView.tsx      # Innovation 2 & Rule 9: Intake & Revision History
│   │   ├── DataQualityView.tsx           # Innovation 3 & 7: DQI & Explainable Rules
│   │   ├── DuplicateInvestigationView.tsx# Innovation 1: 5-Match Duplicate Triage
│   │   ├── RegulatoryReportsView.tsx     # Innovation 8: Regulatory Report Generator
│   │   ├── PublicVerificationView.tsx    # Innovation 5: Tripartite Verification Portal
│   │   ├── AuditLogView.tsx              # Regulatory Audit Ledger
│   │   ├── CorrectionRequestsView.tsx    # Correction Requests Workflow
│   │   ├── BulkUploadView.tsx            # CSV/XLSX Bulk Ingestion
│   │   ├── StudentDirectoryView.tsx      # Institutional Student Registry
│   │   ├── StudentPortalView.tsx         # Student Credential Portal
│   │   └── Navbar.tsx                    # 7-Role Switcher & SIH Banner
│   └── lib/api.ts                # TypeScript REST client
├── backend/                      # FastAPI Application
│   ├── app/
│   │   ├── api/v1/               # 13 REST API routers (intake, validation, reports, etc.)
│   │   ├── core/                 # Auth, RBAC, tenant isolation, DB session
│   │   ├── models/models.py      # SQLAlchemy 2.0 normalized models
│   │   ├── schemas/schemas.py    # Pydantic v2 schemas
│   │   └── services/             # Validation engine, DQI, Anomaly, Reports, Assistant
│   ├── test_backend.py           # Comprehensive unit & service test suite (12 tests)
│   └── test_api_endpoints.py     # End-to-end API integration test suite (15 tests)
├── data/                         # Synthetic demo data & templates
├── docs/                         # Architecture & security specifications
└── README.md                     # Regulatory documentation & user guide
```
