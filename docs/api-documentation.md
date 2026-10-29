# APAAR-Vault API Architecture & Integration Specification

**Base URL:** `http://localhost:8000/api/v1`  
**OpenAPI Specification:** `http://localhost:8000/docs`  
**Authentication Scheme:** Bearer Token (JSON Web Token — RFC 7519)

---

## 1. Authentication & Session Endpoints

### 1.1 `POST /auth/login`
Authenticates a user and issues a scoped JWT.
- **Request Body:**
  ```json
  {
    "email": "aicte.admin@aicte.gov.in",
    "password": "Aicte@12345"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user_id": "9a38f3ec-...",
    "email": "aicte.admin@aicte.gov.in",
    "full_name": "Prof. Meenakshi Sundaram (AICTE Regulator)",
    "roles": ["AICTE_ADMIN"],
    "institution_id": null
  }
  ```

### 1.2 `GET /auth/me`
Fetches current authenticated user profile and roles.

### 1.3 `POST /auth/seed-demo`
Seeds mock institutions, intakes, students, and duplicate records for hackathon evaluation.

---

## 2. Institutional Management Endpoints

### 2.1 `GET /institutions`
Lists institutions. Filterable by `state`, `institution_type`, and `search`.
- Role constraint: Institution administrators only receive their own institutional record.

### 2.2 `POST /institutions`
Registers a new institution (AICTE and Super Admin only).

### 2.3 `GET /institutions/{id}/departments` & `POST /institutions/{id}/departments`
Manages institutional departments (e.g., Computer Science, Mechanical).

### 2.4 `GET /institutions/{id}/courses` & `POST /institutions/{id}/courses`
Manages approved degree programs and courses.

---

## 3. Approved Intake & Capacity Monitoring

### 3.1 `GET /intake`
Retrieves sanctioned intake records alongside actual enrolment counts and capacity indicators (`BELOW_CAPACITY`, `NEAR_CAPACITY`, `AT_CAPACITY`, `EXCESS_ENROLMENT`).

### 3.2 `POST /intake`
Configures or updates approved intake for a course and academic year.

### 3.3 `GET /intake/alerts`
Returns institutional courses exceeding sanctioned intake limits.
- **Response snippet:**
  ```json
  [
    {
      "institution_name": "Maharashtra College of Engineering & Research",
      "course_name": "B.Tech Computer Science (Data Science)",
      "academic_year": "2024-2025",
      "approved_intake": 60,
      "actual_enrolment": 74,
      "excess_seats": 14,
      "excess_percentage": 23.3,
      "severity": "CRITICAL"
    }
  ]
  ```

---

## 4. Student Management & Validation

### 4.1 `GET /students`
Lists student records with masked APAAR identifiers, validation statuses, and search filters.

### 4.2 `POST /students`
Creates an individual student record, running real-time duplicate detection against all institutional records.

### 4.3 `POST /students/{id}/verify-apaar`
Executes APAAR verification handshake via adapter service.

---

## 5. Bulk Data Import Engine

### 5.1 `GET /imports/template?file_format=csv`
Downloads standardized CSV or XLSX template.

### 5.2 `POST /imports/upload`
Uploads spreadsheet file (`multipart/form-data`) with real-time transactional validation, duplicate collision detection, and row-level error reporting.

### 5.3 `GET /imports/{batch_id}/errors`
Fetches row-level validation errors and warnings for a batch.

---

## 6. Regulatory Verification & Alerts

### 6.1 `GET /validation/duplicates`
Lists flagged duplicate enrolments across institutions.

### 6.2 `POST /validation/duplicates/{alert_id}/resolve`
Authorizes administrative resolution (`CONFIRMED_DUPLICATE`, `NOT_A_DUPLICATE`, `RESOLVED`).

### 6.3 `POST /verification/request`
Issues a signed verification code and QR code for an authenticated student.

### 6.4 `GET /verification/verify/{verification_code}`
Public academic verification endpoint for third-party verifiers and employers.
