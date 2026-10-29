# APAAR-Vault Architecture & System Design

**Smart India Hackathon Problem Statement ID:** 26263  
**Organization:** All India Council for Technical Education (AICTE) — Regulation Bureau  
**Theme:** Smart Automation  
**Platform:** APAAR-Vault: AI-Powered Academic Identity & Student Verification Platform  

---

## 1. Executive Summary

APAAR-Vault is a centralized student-data management and regulatory compliance platform engineered for AICTE-approved institutions and the AICTE Regulation Bureau. It enables approved technical institutions to onboard student records, monitor admissions against sanctioned intake capacities, identify cross-institutional and within-institution duplicate enrolments, and provide tamper-evident third-party academic verification.

---

## 2. System Architecture Overview

```
                                  +------------------------------------+
                                  |        Next.js App Router          |
                                  |    (React 19 / TypeScript /        |
                                  |     Tailwind CSS / Recharts)       |
                                  +-----------------+------------------+
                                                    |  REST / HTTPS
                                                    v
                                  +------------------------------------+
                                  |         FastAPI Gateway            |
                                  |   (Python 3.12 / Pydantic v2)      |
                                  +-----------------+------------------+
                                                    |
             +--------------------+-----------------+--------------------+
             |                    |                 |                    |
             v                    v                 v                    v
    +-----------------+  +----------------+ +----------------+ +----------------+
    |  Auth & RBAC    |  |  Validation &  | | Bulk Data Hub  | |  Verification  |
    |  JWT / Argon2/  |  |  Duplicate     | |  Pandas/Open-  | |  QR Generator  |
    |  Role Enforcer  |  |  Detection     | |  pyxl Pipeline | |  Token Signer  |
    +-----------------+  +----------------+ +----------------+ +----------------+
             |                    |                 |                    |
             +--------------------+-----------------+--------------------+
                                  |
                                  v
                  +-------------------------------+
                  |       SQLAlchemy 2.0 ORM      |
                  +---------------+---------------+
                                  |
                                  v
                  +-------------------------------+
                  |       PostgreSQL / SQLite     |
                  |     (Relational DB Engine)    |
                  +-------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Authentication & Role-Based Access Control (RBAC)
- Multi-tier role permissions:
  1. `SUPER_ADMIN`: Platform configuration, global oversight.
  2. `AICTE_ADMIN`: National regulatory monitoring, intake alerts, cross-institutional duplicate review.
  3. `INSTITUTION_ADMIN`: Institution profile, department/course management, intake declaration, bulk uploads.
  4. `DEPT_COORDINATOR`: Departmental student data verification.
  5. `DATA_ENTRY`: Bulk spreadsheet uploads and error correction.
  6. `STUDENT`: Self-service portal to view academic status and credentials.
  7. `EXTERNAL_VERIFIER`: Background checking agency or employer credential validation.
- Server-side authorization check (`verify_institution_access`) enforces complete multi-tenant tenant isolation, preventing Insecure Direct Object Reference (IDOR) attacks across institutions.

### 3.2 Bulk Data Ingestion Engine
- Supports `.csv` and `.xlsx` formats up to 15MB.
- Multi-stage pipeline:
  1. Header schema validation.
  2. Mandatory field completeness.
  3. Format validation (APAAR, dates, integer years).
  4. Course code existence check within the uploading institution.
  5. In-file duplicate registration and APAAR detection.
  6. Database-level collision checks.
  7. Transactional record persistence with row-level error reporting.

### 3.3 APAAR Identity Validation Service
- 4-stage pipeline:
  - **Stage 1 (Format Check):** Validates 12-digit standard and demonstration format (`SIM-APAAR-YYYY-XXXXXX`).
  - **Stage 2 (Consistency):** Flags inconsistencies across institutional submissions.
  - **Stage 3 (Verification Adapter):** Clearly distinguishes between simulated hackathon mode and official gateway connection.
  - **Stage 4 (Status Assignment):** `NOT_CHECKED`, `FORMAT_VALID`, `VERIFIED`, `INVALID`, `PENDING`, `SERVICE_UNAVAILABLE`, `MANUAL_REVIEW_REQUIRED`.

### 3.4 Duplicate Detection Engine
- Detects three major classes of duplicates:
  1. Within-institution duplicate registration numbers.
  2. Same-institution conflicting APAAR identifiers.
  3. Cross-institution concurrent enrolments for the same academic year.
- Human-in-the-loop triage: Flagged records generate `DuplicateAlert` items with severity (`CRITICAL`, `HIGH`, `MEDIUM`) requiring authorized resolution.

### 3.5 Intake & Admission Capacity Monitor
- Compares actual institutional enrolment counts with approved capacity.
- Automatically calculates:
  $$\text{Excess Seats} = \max(0, \text{Actual Enrolment} - \text{Approved Intake})$$
- Generates intake mismatch warnings and anomaly alerts for regulatory investigation.

### 3.6 Academic Verification & QR Code Tokenization
- Issues cryptographically random verification tokens (`APAAR-VRF-YYYY-...`).
- Generates QR codes pointing to the public verification endpoint.
- **Privacy Guarantee:** QR codes encode ONLY the verification endpoint reference URL; raw APAAR IDs, student passwords, and private tokens are never stored inside QR codes or query strings.
