# APAAR-Vault Security, Privacy & Compliance Architecture

## 1. Security Architecture Principles

### 1.1 Strict Role-Based Access Control (RBAC)
- All privileged endpoints enforce role validation at the API controller dependency level using `RoleChecker(["ROLE_NAME"])`.
- Frontend UI route protection is backed by unconditional server-side token decoding and verification.

### 1.2 Tenant & Cross-Institution Data Isolation
- An Institution Administrator cannot access or modify student records, course intake, or batches belonging to another institution.
- Every API endpoint that receives an `institution_id` parameter or accesses an institution-linked entity executes `verify_institution_access(institution_id, current_user, db)`.
- If an institution user attempts to access an unauthorized institution's resource via URL manipulation or parameter tampering, a `403 Forbidden` error is returned and the incident is recorded in `audit_logs`.

### 1.3 Cryptographic Standards & Password Security
- Passwords are salted and hashed using modern bcrypt cryptographic standards.
- Session tokens use JSON Web Tokens (JWT) signed using HMAC-SHA256 with 120-minute expirations.
- Verification tokens use high-entropy random identifiers (`APAAR-VRF-YYYY-<hex-hash>`).

---

## 2. Privacy & Data Protection Compliance

### 2.1 APAAR Identifier Protection
- **Masking:** Full APAAR IDs are masked in general-purpose administrative dashboards (`SIM-APAAR-****-984210`).
- **No Sensitive Identifiers in URLs:** Student lookups use internal random UUIDs (`/api/v1/students/{student_id}`), never raw APAAR IDs or national identity numbers.
- **Log Sanitation:** Backend request logs and audit logs are stripped of raw identity numbers.

### 2.2 Secure Verification & QR Code Architecture
- QR codes generated for academic credential verification contain only the HTTPS URL referencing the cryptographically signed verification token:
  `http://localhost:3000/verify/APAAR-VRF-2026-09115B4280`
- **Zero Sensitive Data in QR:** QR codes NEVER contain raw APAAR IDs, passwords, API tokens, or unprotected private student data.
- Rate-limiting prevents automated enumeration of verification tokens.

### 2.3 Demonstration Mode Safeguards
- To prevent simulated data from being mistaken for official government credentials during hackathon evaluation, all synthetic institutions, courses, and credentials carry an explicit `is_simulated=True` or `demo_mode=True` flag.
- Verification outputs carry a prominent notice:
  *"Demonstration Mode — Simulated Academic Record for SIH Evaluation."*

---

## 3. Audit Logging
Every security-relevant operation creates an immutable entry in the `audit_logs` table:
- User logins and logout events.
- Student creation and profile modifications.
- Approved intake adjustments.
- Bulk batch uploads.
- Resolution of duplicate enrolment alerts.
- Issuance and scanning of academic verification tokens.
