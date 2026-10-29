# APAAR-Vault: Synthetic Test Database Documentation

[![AICTE Problem Statement](https://img.shields.io/badge/AICTE%20PS-26263-blue.svg)](https://www.aicte-india.org/)
[![Synthetic Dataset](https://img.shields.io/badge/Dataset-100%25%20Synthetic-green.svg)](README_TEST_DATABASE.md)
[![Total Records](https://img.shields.io/badge/Student%20Records-1%2C200+-orange.svg)](APAAR_Vault_Students.csv)
[![Institutions](https://img.shields.io/badge/Institutions-25%20Pan--India-purple.svg)](APAAR_Vault_Institutions.csv)

> **Official Problem Statement ID:** 26263  
> **Organization:** All India Council for Technical Education (AICTE) — Regulation Bureau  
> **Platform:** APAAR-Vault (*One Academic Identity. Verified Records. Trusted Education.*)  
> **Purpose:** Realistic synthetic dataset for local development, UI stress-testing, dashboard analytics, validation engine testing, and Smart India Hackathon jury demonstrations.

---

## 📊 1. Synthetic Dataset Metrics & Coverage

| Entity / Dimension | Generated Count | Requirement Threshold | Coverage & Schema Status |
|---|---|---|---|
| **Institutions** | **25** | $\ge 20$ | 15 Indian states (Delhi, MH, KA, TN, TS, GJ, WB, UP, KL, RJ, MP, PB, OD, AP, AS). |
| **Academic Courses** | **125** | $\ge 100$ | B.Tech (CSE, ECE, MECH, EEE, CIVIL, IT, AIML), MBA, MCA, M.Tech across 25 campuses. |
| **Enrolment Snapshots** | **125** | $\ge 100$ | Course-wise approved intake quotas (30, 60, 120, 180) vs. actual enrolled students. |
| **Student Records** | **1,200** | $\ge 1,000$ | Realistic names, diverse categories (General, OBC, SC, ST, EWS, TFW, NRI, OCI, Foreign). |
| **Validation Issues** | **240** | $\ge 200$ | Rules `VAL-REQ-001` through `VAL-APAAR-007` with severities `INFO`, `WARNING`, `ERROR`, `CRITICAL`. |
| **Duplicate Cases** | **60** | $\ge 50$ | 5 regulatory categories: same-institution, cross-institution, exact APAAR, intra-upload, repeated. |
| **Verification Attempts** | **130** | $\ge 100$ | Cryptographically opaque tokens (`APAAR-VRF-...`), verified, expired, and revoked states. |
| **Audit Ledger Events** | **160** | $\ge 100$ | Immutable regulatory audit trails (`LOGIN`, `UPLOAD_BATCH`, `INTAKE_REVISED`, `TOKEN_REVOKED`). |
| **Import Batches** | **55** | $\ge 50$ | Synthetic filenames, file sizes, total, valid, warning, and quarantined row counts. |
| **Import Batch Errors** | **133** | $\ge 100$ | Row-level errors (`MISSING_FIELD`, `INVALID_FORMAT`, `DUPLICATE_REG_NUM`, `INTAKE_OVERFLOW`). |
| **Notifications & Anomalies**| **55** | $\ge 50$ | Enrolment surge alerts, intake mismatch flags, high error rates, historical deviations. |
| **Application Users** | **24** | $\ge 20$ | All 7 roles seeded with secure Bcrypt password hashes for interactive login testing. |

---

## 🛡️ 2. APAAR Privacy & Synthetic Safety Guarantees

1. **No Real PII or Government Identifiers:** All student names, emails, roll numbers, and phone numbers are deterministically generated synthetic placeholders.
2. **Synthetic Identifier Format:** Identifiers use explicit synthetic prefixes:
   - `DEMO-APAAR-2024-XXXXXX`
   - `DEMO-APAAR-DUP-XXX`
   - `SIM-APAAR-2024-XXXXXX`
3. **No Claim of Genuine Verification:** In compliance with **Non-Negotiable Rules 3, 4, and 12**, format checks are marked `FORMAT_VALID`, not verified. Verification screens display: *"Demonstration Mode — Official APAAR Verification Not Connected"*.
4. **Data Minimization:** QR codes and public verification URLs encode **zero raw APAAR IDs or personal identifiers**, containing strictly opaque reference tokens.

---

## 🚀 3. How to Seed or Reset the Test Database

### Option A: Using the Python Seeder Script (Recommended)
```bash
# From workspace root
python seed_database.py

# Or directly within backend directory
cd backend
python generate_large_test_database.py
```

### Option B: Using SQLite / PostgreSQL SQL Script
```bash
# SQLite
sqlite3 backend/apaar_vault.db < APAAR_Vault_Seed.sql

# PostgreSQL (if configured)
psql -U postgres -d apaar_vault -f APAAR_Vault_Seed.sql
```

### Option C: Using Application REST API / Web UI
1. Navigate to the web application at [http://localhost:3000](http://localhost:3000).
2. Click **Reset Demo Data** in the top navigation bar.
3. Or invoke the backend endpoint:
```bash
curl -X POST http://localhost:8000/api/v1/auth/seed-demo
```

---

## 📂 4. Deliverable Files Overview

| File Name | Format | Description |
|---|---|---|
| [`APAAR_Vault_Test_Database.xlsx`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/APAAR_Vault_Test_Database.xlsx) | Excel (`.xlsx`) | Multi-sheet workbook with 12 distinct tabs (`Institutions`, `Courses`, `Students`, `Validation_Issues`, `Duplicate_Cases`, `Enrolment_Snapshots`, `Verification_Attempts`, `Audit_Logs`, `Import_Batches`, `Import_Errors`, `Users`, `Notifications`). |
| [`APAAR_Vault_Students.csv`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/APAAR_Vault_Students.csv) | CSV | 1,200 synthetic student records with standard APAAR-Vault schema headers for bulk ingestion testing. |
| [`APAAR_Vault_Institutions.csv`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/APAAR_Vault_Institutions.csv) | CSV | 25 approved technical institutions across 15 states with demo approval references. |
| [`APAAR_Vault_Courses.csv`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/APAAR_Vault_Courses.csv) | CSV | 125 academic courses and branch codes mapped to institutions. |
| [`APAAR_Vault_Seed.sql`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/APAAR_Vault_Seed.sql) | SQL | Standard SQL transactional insert script for quick database migrations. |
| [`TEST_SCENARIOS.md`](file:///c:/Users/SDP/OneDrive/Desktop/SIH%202.0/TEST_SCENARIOS.md) | Markdown | Detailed documentation of Scenarios A through H with exact verification steps. |

---

## 👥 5. Test Accounts & Personas

| Role | Email | Password | Scope & Testing Scenario |
|---|---|---|---|
| **Super Administrator** | `superadmin@aicte.gov.in` | `Admin@12345` | Global system administration, validation rule editor, full audit ledger access. |
| **AICTE Administrator** | `aicte.admin@aicte.gov.in` | `Aicte@12345` | National regulatory dashboard, excess intake triage, AI officer assistant. |
| **Regional Officer (West)** | `aicte.west@aicte.gov.in` | `Aicte@12345` | Western region regulatory monitoring (Maharashtra, Goa, Gujarat). |
| **Regional Officer (South)** | `aicte.south@aicte.gov.in` | `Aicte@12345` | Southern region regulatory monitoring (Karnataka, Tamil Nadu, Kerala). |
| **Institution Admin (Compliant)** | `principal@dits.ac.in` | `Inst@12345` | Delhi Institute of Tech (DITS) — student registry, bulk upload. |
| **Institution Admin (Excess Intake)** | `dean@mcer.edu.in` | `Inst@12345` | Maharashtra College (MCER) — has **14 excess seats** for review. |
| **Department Coordinator** | `cse.hod@dits.ac.in` | `Coord@12345` | CSE Department student records and validation review. |
| **Data Entry Operator** | `operator@dits.ac.in` | `Operator@12345` | Student record onboarding and CSV/XLSX submission. |
| **Student** | `rahul.sharma@student.dits.ac.in` | `Student@12345` | Personal academic credential portal & QR code generation. |
| **External Verifier** | `verifier@tcs-background.com` | `Verifier@12345` | Public cryptographic credential validation portal. |

---

## ⚠️ 6. Known Limitations
- **Demonstration Mode Only:** This dataset is designed exclusively for hackathon evaluation and development testing. It must never be deployed in a live government production setting without connecting authorized National Single Sign-On (DigiLocker / MeriPehchaan) and official APAAR verification gateways.
- **SQLite Concurrency:** SQLite is configured for local single-node development (`check_same_thread=False`). For enterprise multi-region deployment, use the provided PostgreSQL schema via `DATABASE_URL`.
