# APAAR-Vault Test Scenarios & QA Validation Guide

**AICTE Problem Statement ID:** 26263  
**Platform:** APAAR-Vault (AICTE-Approved Student Data Management & Verification System)  
**Database:** Synthetic Test Environment (`apaar_vault.db`)  
**Security & Compliance:** 100% Synthetic Placeholders (`DEMO-APAAR-...`). Strictly zero real PII or real APAAR numbers.

---

## Overview

This document details the intentional test scenarios embedded into the APAAR-Vault synthetic database. Each test case is reproducible, verified against SQLite foreign keys, and maps directly to specific dashboard charts, investigation queues, and compliance alerts.

| Scenario ID | Category | Description | Count | Expected System Behaviour |
| :--- | :--- | :--- | :--- | :--- |
| **SC-A** | Identifier Missing | Students enrolled without APAAR ID | 60 | Flagged as `CRITICAL` or `WARNING` in Data Quality audit |
| **SC-B** | Internal Duplicate | Same-institution duplicate candidate pairs | 35 pairs | Flagged with `Confidence: 0.96` in Duplicate Investigation Queue |
| **SC-C** | Cross-Institution | Same APAAR ID claimed by 2 distinct colleges | 25 pairs | Trigger `CROSS_INSTITUTION_ENROLMENT` AICTE Escalation Alert |
| **SC-D** | Invalid Format | Checksum / character length violation | 40 | Quarantined with `INVALID` verification status |
| **SC-E** | Intake Violation | Approved intake exceeded by actual admissions | 5 courses | `CAPACITY_OVER_ALLOCATION` Critical Alert in Enrolment Monitor |
| **SC-F** | File Import Errors | Dirty CSV batch rows (missing fields, bad types) | 133 errors | Quarantined in Import Batch Error log without blocking batch |
| **SC-G** | Clean Baseline | Validated records with official format compliance | 1,000+ | Render green `VERIFIED` / `FORMAT_VALID` status cards |
| **SC-H** | Gateway Downtime | Mock API connection timeouts & rate limits | 15 attempts | Handled gracefully with `SERVICE_UNAVAILABLE` retry queues |

---

## Detailed Test Scenarios

### Scenario A: Missing APAAR Identifier
* **Problem Statement Rule:** Institutions must facilitate 100% APAAR adoption under the National Education Policy (NEP 2020). Students without an APAAR ID cannot be verified against the DigiLocker academic repository.
* **Test Dataset Target:** Exactly 60 students in `students` table have `apaar_id = NULL` and `verification_status = 'NOT_CHECKED'`.
* **Example Student IDs:**
  - `INST-0000000001` (COEP Tech): `STU-0000000001`
  - `INST-0000000002` (VJTI Mumbai): `STU-0000000051`
* **Validation Engine Output:**
  ```sql
  SELECT id, first_name, last_name, institution_id, course_id, verification_status 
  FROM students 
  WHERE apaar_id IS NULL;
  -- Returns 60 rows
  ```
* **Dashboard Expectation:**
  - Appears in **Data Quality → Validation Issues** under Rule Code `VAL-MANDATORY-APAAR-01` with severity `WARNING`.
  - Resolution button "Notify Student / Request APAAR Generation" is enabled.

---

### Scenario B: Same-Institution Duplicate Candidate
* **Problem Statement Rule:** An institution must not enrol the same student under two different institutional roll numbers or multiple degree streams concurrently.
* **Test Dataset Target:** 35 duplicate candidate pairs within the same institution sharing identical synthetic identifiers or matching full name + date of birth + father's name.
* **Example Pair:**
  - Student 1: `STU-0000000010` (COEP Tech, CS)
  - Student 2: `STU-0000000011` (COEP Tech, IT)
  - Synthetic APAAR: `DEMO-APAAR-100010`
* **Duplicate Queue Query:**
  ```sql
  SELECT case_id, student_1_id, student_2_id, match_type, confidence_score, status 
  FROM duplicate_cases 
  WHERE match_type = 'EXACT_IDENTIFIER_MATCH' AND status = 'OPEN';
  -- Returns 35 pairs with confidence_score = 0.96 - 0.99
  ```
* **Expected UI Action:**
  - Duplicate Case Detail drawer displays side-by-side field comparison.
  - Reviewer can assign status `UNDER_REVIEW`, `MERGE_CONFIRMED`, or `FALSE_POSITIVE` without deleting student history.

---

### Scenario C: Cross-Institution Duplicate Candidates (AICTE Dual Enrolment Alert)
* **Problem Statement Rule:** A student cannot maintain simultaneous full-time regular enrolments in two distinct AICTE-approved institutions located across different states.
* **Test Dataset Target:** 25 pairs of students enrolled in separate institutions sharing the same synthetic APAAR ID.
* **Example Pair:**
  - Student 1: `STU-0000000065` at `INST-0000000002` (VJTI Mumbai, Maharashtra)
  - Student 2: `STU-0000000115` at `INST-0000000003` (College of Engineering Guindy, Tamil Nadu)
  - Synthetic Identifier: `DEMO-APAAR-900001`
* **Investigation Workflow Query:**
  ```sql
  SELECT s1.id AS student_a, s1.institution_id AS inst_a, 
         s2.id AS student_b, s2.institution_id AS inst_b, 
         s1.apaar_id 
  FROM students s1
  JOIN students s2 ON s1.apaar_id = s2.apaar_id AND s1.institution_id != s2.institution_id
  LIMIT 5;
  ```
* **Dashboard Expectation:**
  - Rendered with high visual hierarchy on the **AICTE Super Admin Anomaly Detection Dashboard**.
  - Triggers an automated notification to both institutional registrars.

---

### Scenario D: Invalid Identifier Format & Checksum Errors
* **Problem Statement Rule:** Real APAAR IDs follow a 12-digit standard format. In this synthetic test database, any identifier violating regex `^(DEMO|SIM)-APAAR-\d{6}$` must be rejected at data ingress.
* **Test Dataset Target:** 40 records with intentionally corrupted formats such as `INVALID-CHARS-XYZ`, `SHORT-123`, or `DEMO-APAAR-TOOLONG-99999999`.
* **Example Student:**
  - Student ID: `STU-0000000002`
  - Synthetic APAAR: `INVALID-CHARS-XYZ`
  - Verification Status: `INVALID`
* **Expected UI Action:**
  - Row shows red badge `INVALID FORMAT` in student directory.
  - Verification API returns HTTP 422 Unprocessable Entity with error message: `"Invalid synthetic APAAR format checksum"`.

---

### Scenario E: Approved Intake Violations (Capacity Over-Allocation)
* **Problem Statement Rule:** AICTE approval sets a strict cap on sanctioned student intake per course per academic year. Enrolments exceeding approved intake constitute a regulatory violation unless covered under approved supernumerary quotas (NRI/OCI/PMSSS).
* **Test Dataset Target:** Exactly 5 engineering programmes configured with reported actual enrolments exceeding approved intake:
  1. **Maharashtra College of Engineering & Research (MCER)**: B.Tech Mechanical Engineering (Approved: 120, Actual: 134, **+14 Excess**)
  2. **Gujarat Institute of Technology (GIT)**: B.Tech Computer Engineering (Approved: 180, Actual: 195, **+15 Excess**)
  3. **Tamil Nadu Engineering College (TNEC)**: B.Tech Artificial Intelligence (Approved: 60, Actual: 68, **+8 Excess**)
  4. **Rajasthan Institute of Engineering & Research (RIER)**: B.Tech Civil Engineering (Approved: 90, Actual: 101, **+11 Excess**)
  5. **UP Engineering University College (UPEUC)**: B.Tech Electronics & Comm. (Approved: 120, Actual: 126, **+6 Excess**)
* **SQL Verification Query:**
  ```sql
  SELECT i.name AS institution, c.course_name, ai.approved_intake, 
         COUNT(s.id) AS enrolled_students, 
         (COUNT(s.id) - ai.approved_intake) AS seat_deficit
  FROM approved_intakes ai
  JOIN courses c ON ai.course_id = c.id
  JOIN institutions i ON c.institution_id = i.id
  LEFT JOIN students s ON s.course_id = c.id AND s.academic_year = ai.academic_year
  GROUP BY ai.id
  HAVING COUNT(s.id) > ai.approved_intake;
  ```
* **Dashboard Expectation:**
  - Bar gauge turns crimson (`#EF4444`) on **Institutional Intake Monitoring** widget.
  - Automated `INTAKE_BREACH_CRITICAL` ticket generated in Compliance Inbox.

---

### Scenario F: File Import Errors & Quarantine Resilience
* **Problem Statement Rule:** When bulk-uploading CSV/Excel student registers, errors on individual rows must NOT crash the entire batch. Valid rows must be imported while invalid rows are logged for correction.
* **Test Dataset Target:**
  - 55 Import Batches in `import_batches` table.
  - 133 Detailed Error Logs in `import_batch_errors` table referencing specific row numbers and field names (`student_id`, `admission_year`, `date_of_birth`, `course_id`).
* **Query to Inspect Error Breakdown:**
  ```sql
  SELECT error_code, COUNT(*) AS occurrences 
  FROM import_batch_errors 
  GROUP BY error_code 
  ORDER BY occurrences DESC;
  ```
* **Dashboard Expectation:**
  - **Batch Ingestion Hub** displays donut chart: *84% Imported, 11% Quarantined, 5% Warnings*.
  - User can download quarantined error report as CSV with suggestions.

---

### Scenario G: Clean Baseline Valid Records
* **Problem Statement Rule:** Real production environments feature a high proportion of valid student enrolments. Dashboards must demonstrate standard operational flow.
* **Test Dataset Target:** Over 1,000 valid student records with complete fields, correct institution foreign keys, and legitimate demo verification statuses (`VERIFIED` or `FORMAT_VALID`).
* **Metrics:**
  - Total Enrolments: 1,200
  - Clean Records: > 85%
  - Average Data Completeness Score: 96.4%

---

### Scenario H: External Gateway Simulation & Outages
* **Problem Statement Rule:** In production, DigiLocker or APAAR verification APIs may experience transient outages, HTTP 503 service unavailable, or rate limiting.
* **Test Dataset Target:** 15 verification attempts logged with `result_status = 'SERVICE_UNAVAILABLE'` and `is_official_verification = 0`.
* **Example Verification Log:**
  - ID: `VER-0000000003`
  - Mode: `MOCK_SANDBOX`
  - Error Code: `GATEWAY_TIMEOUT_504`
  - Diagnostic: `"Synthetic mock sandbox timeout simulation - please retry."`
* **UI Resilience Expectation:**
  - Individual student card displays amber status badge `SERVICE TIMEOUT (Retry in 30s)`.
  - Batch verification worker implements exponential backoff.

---

## Acceptance Testing Checklist

Run this command in your PowerShell terminal to verify that all 8 scenarios execute successfully against the database:

```powershell
python backend/test_api_endpoints.py
```

| Check Item | Validation Command | Acceptance Criteria | Result |
| :--- | :--- | :--- | :--- |
| **Record Counts** | `python seed_database.py --verify` | $\ge 25$ Inst, $\ge 125$ Courses, $\ge 1,200$ Students | **PASSED** |
| **Foreign Key Integrity** | `PRAGMA foreign_key_check;` in SQLite | 0 violations returned | **PASSED** |
| **Scenario A Check** | `SELECT COUNT(*) FROM students WHERE apaar_id IS NULL;` | Exactly 60 records | **PASSED** |
| **Scenario B Check** | `SELECT COUNT(*) FROM duplicate_cases WHERE match_type = 'EXACT_IDENTIFIER_MATCH';` | 35 cases | **PASSED** |
| **Scenario C Check** | `SELECT COUNT(*) FROM duplicate_cases WHERE match_type = 'CROSS_INSTITUTION_ENROLMENT';` | 25 cases | **PASSED** |
| **Scenario E Check** | Intake query with `HAVING actual > approved` | Exactly 5 courses identified | **PASSED** |
| **Seed Repeatability** | Re-run `python seed_database.py` | Idempotent, zero duplicate primary keys | **PASSED** |

---
*Generated for AICTE Problem Statement ID 26263 Demonstration Environment.*
