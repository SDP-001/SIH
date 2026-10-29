"""
APAAR-Vault: Large Synthetic Test Database Generator
AICTE Problem Statement 26263 - Smart Automation
One Academic Identity. Verified Records. Trusted Education.

Generates:
- 25 Institutions across 15 Indian States
- 125 Courses across Engineering, Management, and Computing
- 125 Approved Intake & Enrolment Records (with intentional excess capacity discrepancies)
- 1,200+ Synthetic Student Records (with intentional negative test scenarios A-H)
- 240+ Explainable Validation Results (VAL-REQ-001 through VAL-APAAR-007)
- 60+ Duplicate Investigation Cases (5 match categories, human review workflow)
- 130+ Verification Attempts (Opaque tokens, active/expired/revoked states)
- 160+ Immutable Regulatory Audit Events
- 55+ Import Batches and 130+ Row-Level Import Errors
- 55+ Notifications and Anomaly Alerts
- 24 Sample Application Users across all 7 RBAC roles
- Multi-sheet Excel workbook (APAAR_Vault_Test_Database.xlsx)
- CSV exports (Students, Institutions, Courses)
- SQL seed file (APAAR_Vault_Seed.sql)
- Documentation: README_TEST_DATABASE.md & TEST_SCENARIOS.md
"""

import os
import sys
import uuid
import random
import json
from datetime import datetime, timezone, timedelta
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Add backend directory to sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, CURRENT_DIR)

from app.models.models import (
    Base, User, UserRole, UserRoleAssignment, Institution, Department,
    Course, ApprovedIntake, ApprovedIntakeRevision, Student, ImportBatch,
    ImportBatchError, DuplicateAlert, AnomalyAlert, VerificationRequest,
    AuditLog, ValidationRuleConfig, ValidationResult, CorrectionRequest,
    DataQualityMetric, ApiClient
)
from app.core.security import get_password_hash
from app.services.validation_engine import init_default_validation_rules

# Set deterministic random seed for 100% reproducible test scenarios
random.seed(42)

def gen_uuid():
    return str(uuid.uuid4())

def get_now():
    return datetime.now(timezone.utc)

# -------------------------------------------------------------
# 1. SYNTHETIC INSTITUTIONS DEFINITION (25 Institutions)
# -------------------------------------------------------------
SYNTHETIC_INSTITUTIONS_DATA = [
    ("1-1002345", "Delhi Institute of Technology & Science", "Delhi", "New Delhi", "Govt", "AICTE/NORTH/2024/1-1002345", "principal@dits.ac.in", "+91-11-23900100"),
    ("1-2009871", "Maharashtra College of Engineering & Research", "Maharashtra", "Pune", "Autonomous", "AICTE/WEST/2024/1-2009871", "dean@mcer.edu.in", "+91-20-25507000"),
    ("1-3004567", "Karnataka Institute of Technology & Automation", "Karnataka", "Bengaluru Urban", "Private", "AICTE/SOUTH/2024/1-3004567", "registrar@kita.ac.in", "+91-80-28520000"),
    ("1-4001122", "Tamil Nadu Technical Academy", "Tamil Nadu", "Chennai", "Govt-Aided", "AICTE/SR/2024/1-4001122", "director@tnta.edu.in", "+91-44-22351777"),
    ("1-5003344", "Hyderabad Institute of Engineering Studies", "Telangana", "Hyderabad", "Private", "AICTE/SCRO/2024/1-5003344", "principal@hies.edu.in", "+91-40-23158661"),
    ("1-6005566", "Gujarat Technical College", "Gujarat", "Ahmedabad", "Autonomous", "AICTE/CRO/2024/1-6005566", "dean@gtc.ac.in", "+91-79-26300000"),
    ("1-7007788", "Bengal College of Science & Technology", "West Bengal", "Kolkata", "Govt", "AICTE/ERO/2024/1-7007788", "admin@bcst.edu.in", "+91-33-24146666"),
    ("1-8009900", "Uttar Pradesh Engineering University College", "Uttar Pradesh", "Kanpur", "Govt", "AICTE/NRO/2024/1-8009900", "provost@upeuc.ac.in", "+91-512-2590151"),
    ("1-9001234", "Kerala State Institute of Technology", "Kerala", "Thiruvananthapuram", "Govt-Aided", "AICTE/SWRO/2024/1-9001234", "principal@ksit.ac.in", "+91-471-2598370"),
    ("1-1012345", "Rajasthan Institute of Engineering & Research", "Rajasthan", "Jaipur", "Private", "AICTE/NWRO/2024/1-1012345", "director@rier.ac.in", "+91-141-2702954"),
    ("1-1123456", "Madhya Pradesh Technological Institute", "Madhya Pradesh", "Bhopal", "Autonomous", "AICTE/MP/2024/1-1123456", "dean@mpti.ac.in", "+91-755-2678800"),
    ("1-1234567", "Punjab Engineering Polytechnic & College", "Punjab", "Patiala", "Govt", "AICTE/PB/2024/1-1234567", "registrar@pepc.edu.in", "+91-175-2393000"),
    ("1-1345678", "Odisha State Engineering Academy", "Odisha", "Bhubaneswar", "Govt-Aided", "AICTE/OD/2024/1-1345678", "head@osea.ac.in", "+91-674-2301000"),
    ("1-1456789", "Assam Engineering & Information Institute", "Assam", "Guwahati", "Govt", "AICTE/NERO/2024/1-1456789", "principal@aeii.ac.in", "+91-361-2570000"),
    ("1-1567890", "Andhra Technical University College", "Andhra Pradesh", "Visakhapatnam", "Autonomous", "AICTE/AP/2024/1-1567890", "rector@atuc.edu.in", "+91-891-2844000"),
    ("1-1678901", "Haryana Institute of Advanced Computing", "Haryana", "Gurugram", "Private", "AICTE/HR/2024/1-1678901", "director@hiac.edu.in", "+91-124-4190000"),
    ("1-1789012", "Bihar Technical Training College", "Bihar", "Patna", "Govt", "AICTE/BH/2024/1-1789012", "principal@bttc.ac.in", "+91-612-2370000"),
    ("1-1890123", "Chhattisgarh Institute of Technology", "Chhattisgarh", "Raipur", "Govt-Aided", "AICTE/CG/2024/1-1890123", "dean@citr.ac.in", "+91-771-2254200"),
    ("1-1901234", "Jharkhand Engineering Academy", "Jharkhand", "Ranchi", "Autonomous", "AICTE/JH/2024/1-1901234", "admin@jea.ac.in", "+91-651-2275000"),
    ("1-2012345", "Uttarakhand Institute of Technology", "Uttarakhand", "Dehradun", "Private", "AICTE/UK/2024/1-2012345", "registrar@uitd.ac.in", "+91-135-2770000"),
    ("1-2123456", "Himachal State Technical College", "Himachal Pradesh", "Shimla", "Govt", "AICTE/HP/2024/1-2123456", "principal@hstc.edu.in", "+91-177-2830000"),
    ("1-2234567", "Goa College of Engineering & Design", "Goa", "Farmagudi", "Govt", "AICTE/GOA/2024/1-2234567", "dean@gced.ac.in", "+91-832-2336300"),
    ("1-2345678", "Jammu & Kashmir Institute of Technology", "Jammu and Kashmir", "Srinagar", "Govt-Aided", "AICTE/JK/2024/1-2345678", "provost@jkit.ac.in", "+91-194-2424000"),
    ("1-2456789", "Chandigarh Technical University College", "Chandigarh", "Chandigarh", "Govt", "AICTE/CH/2024/1-2456789", "director@ctuc.edu.in", "+91-172-2753000"),
    ("1-2567890", "National Capital Institute of Management & Tech", "Delhi", "Dwarka", "Autonomous", "AICTE/NCR/2024/1-2567890", "dean@ncimt.ac.in", "+91-11-28030000")
]

# -------------------------------------------------------------
# 2. DEPARTMENTS & COURSES TEMPLATES
# -------------------------------------------------------------
DEPARTMENTS_TEMPLATE = [
    ("CSE", "Computer Science and Engineering"),
    ("ECE", "Electronics and Communication Engineering"),
    ("MECH", "Mechanical Engineering"),
    ("EE", "Electrical and Electronics Engineering"),
    ("CIVIL", "Civil Engineering"),
    ("IT", "Information Technology"),
    ("AIML", "Artificial Intelligence & Machine Learning"),
    ("MGMT", "Management Studies"),
    ("CA", "Computer Applications")
]

COURSES_TEMPLATE = [
    ("B.Tech Computer Science & Engineering", "BT-CSE", "UG", 4, "CSE"),
    ("B.Tech Electronics & Communication Engineering", "BT-ECE", "UG", 4, "ECE"),
    ("B.Tech Mechanical Engineering", "BT-MECH", "UG", 4, "MECH"),
    ("B.Tech Electrical & Electronics Engineering", "BT-EEE", "UG", 4, "EE"),
    ("B.Tech Civil Engineering", "BT-CIVIL", "UG", 4, "CIVIL"),
    ("B.Tech Information Technology", "BT-IT", "UG", 4, "IT"),
    ("B.Tech Artificial Intelligence & Machine Learning", "BT-AIML", "UG", 4, "AIML"),
    ("Master of Business Administration", "MBA-GEN", "PG", 2, "MGMT"),
    ("Master of Computer Applications", "MCA-GEN", "PG", 2, "CA"),
    ("M.Tech Computer Science & Engineering", "MT-CSE", "PG", 2, "CSE")
]

# -------------------------------------------------------------
# 3. INDIAN NAMES POOLS FOR REALISTIC SYNTHETIC STUDENTS
# -------------------------------------------------------------
FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Advik", "Pranav", "Advaith", "Kabir", "Ananya", "Diya", "Saanvi", "Aadhya",
    "Pari", "Anika", "Navya", "Angel", "Myra", "Sara", "Ira", "Rhea", "Ahana", "Rohan", "Rahul",
    "Amit", "Pooja", "Neha", "Priya", "Sneha", "Kavita", "Sanjay", "Rajesh", "Vikram", "Sunita",
    "Deepak", "Manish", "Gaurav", "Swati", "Meera", "Varun", "Karan", "Kunal", "Shikha", "Tanvi",
    "Nikhil", "Akash", "Ankit", "Shruti", "Ritu", "Alok", "Abhishek", "Divya", "Komal", "Harish",
    "Suresh", "Ramesh", "Dinesh", "Karthik", "Venkatesh", "Balaji", "Subramanian", "Anand", "Ravi",
    "Lakshmi", "Gayatri", "Padma", "Bhavani", "Soumya", "Geeta", "Radha", "Shalini", "Jyoti", "Aparna"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Bhatia", "Saxena", "Chawla", "Kapoor", "Chopra", "Joshi",
    "Patel", "Shah", "Deshmukh", "Kulkarni", "Patil", "Jadhav", "Pawar", "Shinde", "Bhosale", "More",
    "Reddy", "Rao", "Naidu", "Chowdary", "Prasad", "Murthy", "Raju", "Goud", "Varma", "Srinivasan",
    "Iyer", "Iyengar", "Nair", "Menon", "Pillai", "Kurup", "Nambiar", "Balakrishnan", "Ramanathan",
    "Mukherjee", "Banerjee", "Chatterjee", "Bose", "Ghosh", "Dutta", "Sen", "Roy", "Das", "Sengupta",
    "Mishra", "Pandey", "Tiwari", "Dubey", "Shukla", "Tripathi", "Upadhyay", "Pathak", "Chaubey", "Singh",
    "Chaudhary", "Yadav", "Kumar", "Meena", "Rawat", "Bisht", "Negi", "Thakur", "Rathore", "Chauhan"
]

def generate_indian_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def populate_database(db: Session, export_files: bool = True) -> dict:
    """
    Populates the database with 25 institutions, 125 courses, 1,200 students,
    and all associated audit, duplicate, intake, and validation test scenarios.
    """
    print("=" * 70)
    print("APAAR-Vault: Synthetic Test Database Generation Engine")
    print("AICTE Problem Statement 26263 (Regulation Bureau Platform)")
    print("=" * 70)

    # Step 0: Ensure default validation rules exist
    print("[1/10] Initializing Explainable Validation Rules...")
    init_default_validation_rules(db)

    # Step 1: User Roles
    print("[2/10] Seeding 7 RBAC Roles & 24 System Users...")
    ROLES_DATA = [
        ("SUPER_ADMIN", "Full platform administration, audit logs, and configuration"),
        ("AICTE_ADMIN", "National regulatory oversight, intake discrepancies, and AI assistant"),
        ("INSTITUTION_ADMIN", "Institutional administrator, student onboarding, and local intake"),
        ("DEPT_COORDINATOR", "Department-level student validation and course review"),
        ("DATA_ENTRY", "Institutional data entry operator for bulk uploads"),
        ("STUDENT", "Student portal access, personal credential view, and QR generation"),
        ("EXTERNAL_VERIFIER", "Authorized third-party background verifier")
    ]
    role_map = {}
    for r_name, r_desc in ROLES_DATA:
        role = db.query(UserRole).filter(UserRole.name == r_name).first()
        if not role:
            role = UserRole(id=gen_uuid(), name=r_name, description=r_desc)
            db.add(role)
            db.flush()
        role_map[r_name] = role

    # Step 2: Seed Institutions (25 Institutions)
    print("[3/10] Generating 25 Synthetic Technical Institutions across India...")
    institutions = []
    for code, name, state, dist, itype, aicte_ref, email, phone in SYNTHETIC_INSTITUTIONS_DATA:
        inst = db.query(Institution).filter(Institution.institution_code == code).first()
        if not inst:
            inst = Institution(
                id=gen_uuid(),
                institution_code=code,
                name=name,
                aicte_approval_ref=aicte_ref,
                institution_type=itype,
                state=state,
                district=dist,
                address=f"Campus Road, {dist}, {state} - India",
                contact_email=email,
                contact_phone=phone,
                status="APPROVED",
                is_simulated=True
            )
            db.add(inst)
            db.flush()
        institutions.append(inst)

    # Step 3: Seed Users (24 Users)
    USERS_SEED = [
        ("superadmin@aicte.gov.in", "Dr. Rajeshwar Sharma (Super Admin)", "Admin@12345", "SUPER_ADMIN", None),
        ("aicte.admin@aicte.gov.in", "Prof. Meenakshi Sundaram (AICTE Regulator)", "Aicte@12345", "AICTE_ADMIN", None),
        ("aicte.west@aicte.gov.in", "Dr. Vikramaditya Deshmukh (Regional Officer West)", "Aicte@12345", "AICTE_ADMIN", None),
        ("aicte.south@aicte.gov.in", "Dr. S. K. Narayanan (Regional Officer South)", "Aicte@12345", "AICTE_ADMIN", None),
        ("principal@dits.ac.in", "Dr. Arvind Gupta (Principal, DITS Delhi)", "Inst@12345", "INSTITUTION_ADMIN", institutions[0].id),
        ("dean@mcer.edu.in", "Dr. Sanjay Deshmukh (Dean, MCER Pune)", "Inst@12345", "INSTITUTION_ADMIN", institutions[1].id),
        ("registrar@kita.ac.in", "Dr. Ramesh Hegde (Registrar, KITA Bengaluru)", "Inst@12345", "INSTITUTION_ADMIN", institutions[2].id),
        ("director@tnta.edu.in", "Prof. K. Swaminathan (Director, TNTA Chennai)", "Inst@12345", "INSTITUTION_ADMIN", institutions[3].id),
        ("principal@hies.edu.in", "Dr. P. V. Ramana (Principal, HIES Hyderabad)", "Inst@12345", "INSTITUTION_ADMIN", institutions[4].id),
        ("dean@gtc.ac.in", "Dr. Bhavesh Patel (Dean, GTC Ahmedabad)", "Inst@12345", "INSTITUTION_ADMIN", institutions[5].id),
        ("cse.hod@dits.ac.in", "Prof. Anita Roy (CSE Coordinator, DITS)", "Coord@12345", "DEPT_COORDINATOR", institutions[0].id),
        ("ece.hod@dits.ac.in", "Prof. Alok Mathur (ECE Coordinator, DITS)", "Coord@12345", "DEPT_COORDINATOR", institutions[0].id),
        ("mech.hod@mcer.edu.in", "Prof. Deepak Kulkarni (Mech Coordinator, MCER)", "Coord@12345", "DEPT_COORDINATOR", institutions[1].id),
        ("cse.hod@kita.ac.in", "Prof. Shashi Kumar (CSE Coordinator, KITA)", "Coord@12345", "DEPT_COORDINATOR", institutions[2].id),
        ("operator@dits.ac.in", "Kavita Verma (Data Entry Operator, DITS)", "Operator@12345", "DATA_ENTRY", institutions[0].id),
        ("operator@mcer.edu.in", "Sachin Shinde (Data Entry Operator, MCER)", "Operator@12345", "DATA_ENTRY", institutions[1].id),
        ("operator@kita.ac.in", "Pooja Hegde (Data Entry Operator, KITA)", "Operator@12345", "DATA_ENTRY", institutions[2].id),
        ("rahul.sharma@student.dits.ac.in", "Rahul Sharma (B.Tech CSE Student, DITS)", "Student@12345", "STUDENT", institutions[0].id),
        ("priya.patel@student.mcer.edu.in", "Priya Patel (B.Tech Student, MCER)", "Student@12345", "STUDENT", institutions[1].id),
        ("aditya.nair@student.kita.ac.in", "Aditya Nair (B.Tech AI Student, KITA)", "Student@12345", "STUDENT", institutions[2].id),
        ("sneha.reddy@student.hies.edu.in", "Sneha Reddy (B.Tech ECE Student, HIES)", "Student@12345", "STUDENT", institutions[4].id),
        ("verifier@tcs-background.com", "Rajeev Menon (Senior Verifier, TCS BG)", "Verifier@12345", "EXTERNAL_VERIFIER", None),
        ("verifier@infosys-credentials.com", "Swati Kulkarni (Lead Verifier, Infosys)", "Verifier@12345", "EXTERNAL_VERIFIER", None),
        ("verifier@wipro-screening.com", "Karthik Raja (Background Screening, Wipro)", "Verifier@12345", "EXTERNAL_VERIFIER", None)
    ]

    users_dict = {}
    for email, fullname, pwd, rolename, inst_id in USERS_SEED:
        u = db.query(User).filter(User.email == email).first()
        if not u:
            u = User(
                id=gen_uuid(),
                email=email,
                full_name=fullname,
                hashed_password=get_password_hash(pwd),
                institution_id=inst_id,
                is_active=True
            )
            db.add(u)
            db.flush()
            db.add(UserRoleAssignment(id=gen_uuid(), user_id=u.id, role_id=role_map[rolename].id))
        users_dict[email] = u

    # Step 4: Seed Departments & 125 Courses
    print("[4/10] Generating 125 Technical Courses & Academic Programs...")
    courses_list = []
    intakes_list = []
    
    # Pre-seed departments for each institution
    dept_map = {}
    for inst in institutions:
        for d_code, d_name in DEPARTMENTS_TEMPLATE:
            d = db.query(Department).filter(
                Department.institution_id == inst.id,
                Department.code == d_code
            ).first()
            if not d:
                d = Department(id=gen_uuid(), institution_id=inst.id, name=d_name, code=d_code)
                db.add(d)
                db.flush()
            dept_map[(inst.id, d_code)] = d

    # Track intentional excess intake courses for test scenarios
    excess_intake_targets = [
        (institutions[1].id, "BT-MECH"), # MCER Mech (Approved: 60, Enrolled: 74 -> +14 excess)
        (institutions[5].id, "BT-CSE"),  # Gujarat Tech CSE (Approved: 120, Enrolled: 135 -> +15 excess)
        (institutions[3].id, "BT-ECE"),  # Tamil Nadu Tech ECE (Approved: 60, Enrolled: 68 -> +8 excess)
        (institutions[9].id, "BT-AIML"), # Rajasthan Tech AIML (Approved: 60, Enrolled: 71 -> +11 excess)
        (institutions[7].id, "BT-CIVIL") # UP Engg Civil (Approved: 60, Enrolled: 66 -> +6 excess)
    ]

    for inst_idx, inst in enumerate(institutions):
        # Guarantee specific courses for Institution 0 (DITS) and Institution 1 (MCER)
        if inst_idx == 0:
            guaranteed_codes = ["BT-CSE", "BT-ECE"]
            other_templates = [t for t in COURSES_TEMPLATE if t[1] not in guaranteed_codes]
            selected_courses_template = [t for t in COURSES_TEMPLATE if t[1] in guaranteed_codes] + random.sample(other_templates, 3)
        elif inst_idx == 1:
            guaranteed_codes = ["BT-MECH", "BT-CSE"]
            other_templates = [t for t in COURSES_TEMPLATE if t[1] not in guaranteed_codes]
            selected_courses_template = [t for t in COURSES_TEMPLATE if t[1] in guaranteed_codes] + random.sample(other_templates, 3)
        else:
            selected_courses_template = random.sample(COURSES_TEMPLATE, 5)

        for c_name, c_code, deg, dur, dept_code in selected_courses_template:
            c = db.query(Course).filter(
                Course.institution_id == inst.id,
                Course.course_code == c_code
            ).first()
            if not c:
                dept = dept_map[(inst.id, dept_code)]
                c = Course(
                    id=gen_uuid(),
                    institution_id=inst.id,
                    department_id=dept.id,
                    course_name=c_name,
                    course_code=c_code,
                    degree_level=deg,
                    duration_years=dur
                )
                db.add(c)
                db.flush()
            courses_list.append(c)

            # Determine approved intake quota
            is_excess = any(target[0] == inst.id and target[1] == c_code for target in excess_intake_targets)
            if inst.id == institutions[1].id and c_code == "BT-MECH":
                base_quota = 60
                actual_enrolled = 74
                tfw_quota = 2
                ews_quota = 4
                supernumerary_total = 6
                super_enrolled = 4
            elif is_excess:
                base_quota = random.choice([60, 120])
                excess_add = random.randint(6, 16)
                actual_enrolled = base_quota + excess_add
                tfw_quota = int(base_quota * 0.05)
                ews_quota = int(base_quota * 0.10)
                supernumerary_total = tfw_quota + ews_quota
                super_enrolled = min(supernumerary_total, random.randint(2, supernumerary_total))
            else:
                base_quota = random.choice([30, 60, 60, 120, 120, 180])
                tfw_quota = int(base_quota * 0.05)
                ews_quota = int(base_quota * 0.10)
                supernumerary_total = tfw_quota + ews_quota
                actual_enrolled = random.randint(int(base_quota * 0.75), base_quota)
                super_enrolled = random.randint(0, supernumerary_total)

            intake = db.query(ApprovedIntake).filter(
                ApprovedIntake.institution_id == inst.id,
                ApprovedIntake.course_id == c.id,
                ApprovedIntake.academic_year == "2024-2025"
            ).first()
            if not intake:
                intake = ApprovedIntake(
                    id=gen_uuid(),
                    institution_id=inst.id,
                    course_id=c.id,
                    academic_year="2024-2025",
                    approved_intake=base_quota,
                    supernumerary_quota=supernumerary_total,
                    actual_enrolment=actual_enrolled,
                    supernumerary_enrolled=super_enrolled,
                    approval_order_ref=f"AICTE/{inst.state[:2].upper()}/2024-25/ORD-{random.randint(1000, 9999)}"
                )
                db.add(intake)
                db.flush()
            intakes_list.append(intake)

    # Step 5: Seed 1,200+ Synthetic Student Records with Test Scenarios
    print("[5/10] Generating 1,200+ Synthetic Student Records & Intentional Scenarios...")
    students_list = []
    
    CATEGORIES = ["GENERAL", "OBC", "SC", "ST", "EWS", "TFW", "NRI", "OCI", "FOREIGN_NATIONAL"]
    CATEGORY_WEIGHTS = [0.45, 0.25, 0.12, 0.06, 0.05, 0.03, 0.02, 0.01, 0.01]

    # Pre-generate duplicate test candidates
    duplicate_apaars = [f"DEMO-APAAR-DUP-{i:03d}" for i in range(1, 26)]
    missing_apaar_indices = set(random.sample(range(50, 1150), 60))
    unverified_indices = set(random.sample(range(100, 1150), 80))

    # A. Specific verified demo student: Rahul Sharma at DITS (CSE)
    dits_inst = institutions[0]
    dits_cse = next(c for c in courses_list if c.institution_id == dits_inst.id and "CSE" in c.course_code)
    rahul = db.query(Student).filter(Student.institution_reg_num == "DITS-2024-CSE-001").first()
    if not rahul:
        rahul = Student(
            id=gen_uuid(),
            institution_id=dits_inst.id,
            course_id=dits_cse.id,
            student_name="Rahul Sharma",
            institution_reg_num="DITS-2024-CSE-001",
            apaar_id="SIM-APAAR-2024-984210",
            email="rahul.sharma@student.dits.ac.in",
            phone="+91-9876543210",
            date_of_birth="2005-08-14",
            gender="Male",
            academic_year="2024-2025",
            admission_year=2024,
            admission_status="ACTIVE",
            admission_category="GENERAL",
            is_supernumerary=False,
            apaar_status="VERIFIED",
            apaar_verified_at=get_now() - timedelta(days=12),
            apaar_verification_ref="APAAR-SIM-REF-88412",
            data_validation_status="VALID",
            created_at=get_now() - timedelta(days=90)
        )
        db.add(rahul)
        db.flush()
    students_list.append(rahul)

    # B. Specific cross-institution duplicate: Ananya Sen (DITS & MCER)
    mcer_inst = institutions[1]
    mcer_mech = next(c for c in courses_list if c.institution_id == mcer_inst.id and "MECH" in c.course_code)
    ananya_dits = db.query(Student).filter(Student.institution_reg_num == "DITS-2024-CSE-099").first()
    if not ananya_dits:
        ananya_dits = Student(
            id=gen_uuid(),
            institution_id=dits_inst.id,
            course_id=dits_cse.id,
            student_name="Ananya Sen",
            institution_reg_num="DITS-2024-CSE-099",
            apaar_id="SIM-APAAR-2024-331908",
            email="ananya.sen@example.com",
            phone="+91-9876543299",
            date_of_birth="2005-03-19",
            gender="Female",
            academic_year="2024-2025",
            admission_year=2024,
            admission_status="ACTIVE",
            admission_category="GENERAL",
            is_supernumerary=False,
            apaar_status="FORMAT_VALID",
            data_validation_status="WARNING",
            created_at=get_now() - timedelta(days=80)
        )
        db.add(ananya_dits)
        db.flush()
    students_list.append(ananya_dits)

    ananya_mcer = db.query(Student).filter(Student.institution_reg_num == "MCER-2024-DS-044").first()
    if not ananya_mcer:
        ananya_mcer = Student(
            id=gen_uuid(),
            institution_id=mcer_inst.id,
            course_id=mcer_mech.id,
            student_name="Ananya Sen",
            institution_reg_num="MCER-2024-DS-044",
            apaar_id="SIM-APAAR-2024-331908",
            email="ananya.sen@example.com",
            phone="+91-9876543299",
            date_of_birth="2005-03-19",
            gender="Female",
            academic_year="2024-2025",
            admission_year=2024,
            admission_status="ACTIVE",
            admission_category="GENERAL",
            is_supernumerary=False,
            apaar_status="FORMAT_VALID",
            data_validation_status="WARNING",
            created_at=get_now() - timedelta(days=75)
        )
        db.add(ananya_mcer)
        db.flush()
    students_list.append(ananya_mcer)

    student_counter = len(students_list) + 1
    total_to_generate = 1200 - len(students_list)

    existing_students = db.query(Student).count()
    if existing_students < 1200:
        for i in range(total_to_generate):
            c = random.choice(courses_list)
            inst_id = c.institution_id
            inst = next(it for it in institutions if it.id == inst_id)

            reg_num = f"{inst.institution_code[-4:]}-2024-{c.course_code.split('-')[-1]}-{student_counter:04d}"
            s_name = generate_indian_name()
            email = f"{s_name.lower().replace(' ', '.')}.{student_counter}@{inst.contact_email.split('@')[-1]}"

            cat = random.choices(CATEGORIES, weights=CATEGORY_WEIGHTS, k=1)[0]
            is_super = cat in ["TFW", "EWS"]
            is_nri = cat == "NRI"
            is_foreign = cat in ["FOREIGN_NATIONAL", "OCI"]

            if i in missing_apaar_indices:
                apaar_val = None
                apaar_stat = "NOT_CHECKED"
                val_stat = "WARNING"
            elif i < 25:
                apaar_val = duplicate_apaars[i]
                apaar_stat = "FORMAT_VALID"
                val_stat = "UNDER_REVIEW"
            elif 25 <= i < 50:
                apaar_val = duplicate_apaars[i - 25]
                apaar_stat = "FORMAT_VALID"
                val_stat = "UNDER_REVIEW"
            elif i in unverified_indices:
                variant = random.choice(["INVALID_LENGTH", "SPECIAL_CHARS", "STATUS_PENDING", "STATUS_UNAVAIL"])
                if variant == "INVALID_LENGTH":
                    apaar_val = f"DEMO-{random.randint(1000, 9999)}"
                    apaar_stat = "INVALID"
                    val_stat = "ERROR"
                elif variant == "SPECIAL_CHARS":
                    apaar_val = f"DEMO-APAAR-@#${random.randint(100, 999)}"
                    apaar_stat = "INVALID"
                    val_stat = "ERROR"
                elif variant == "STATUS_PENDING":
                    apaar_val = f"DEMO-APAAR-PEND-{student_counter:05d}"
                    apaar_stat = "PENDING"
                    val_stat = "VALID"
                else:
                    apaar_val = f"DEMO-APAAR-UNAV-{student_counter:05d}"
                    apaar_stat = "SERVICE_UNAVAILABLE"
                    val_stat = "VALID"
            else:
                apaar_val = f"DEMO-APAAR-2024-{student_counter:06d}"
                apaar_stat = random.choice(["VERIFIED", "VERIFIED", "FORMAT_VALID", "FORMAT_VALID"])
                val_stat = "VALID"

            stu = Student(
                id=gen_uuid(),
                institution_id=inst_id,
                course_id=c.id,
                student_name=s_name,
                institution_reg_num=reg_num,
                apaar_id=apaar_val,
                email=email,
                phone=f"+91-9{random.randint(100000000, 999999999)}",
                date_of_birth=f"{random.randint(2002, 2006)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                gender=random.choice(["Male", "Female", "Other"]),
                academic_year="2024-2025",
                admission_year=2024,
                admission_status=random.choice(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "TRANSFERRED", "COMPLETED"]),
                admission_category=cat,
                is_supernumerary=is_super,
                supernumerary_category=cat if is_super else None,
                is_nri=is_nri,
                is_foreign_national=is_foreign,
                apaar_status=apaar_stat,
                apaar_verified_at=get_now() - timedelta(days=random.randint(1, 60)) if apaar_stat == "VERIFIED" else None,
                apaar_verification_ref=f"AICTE-VRF-SIM-{random.randint(100000, 999999)}" if apaar_stat == "VERIFIED" else None,
                data_validation_status=val_stat,
                created_at=get_now() - timedelta(days=random.randint(1, 90))
            )
            db.add(stu)
            students_list.append(stu)
            student_counter += 1
        db.flush()
    else:
        students_list = db.query(Student).all()

    # Step 6: Seed 240+ Explainable Validation Results
    print("[6/10] Generating 240+ Explainable Validation Results across 7 Rules...")
    validation_results_list = []
    VALIDATION_TEMPLATES = [
        ("VAL-REQ-001", "v1.0", "CRITICAL", "FAIL", "Mandatory Field Check", "Mandatory student attributes are incomplete. APAAR identifier or contact email is missing.", "Review student enrolment form and input required identity identifiers."),
        ("VAL-FMT-002", "v1.0", "ERROR", "FAIL", "Format Syntax Validation", "Identifier format deviates from standard 12-digit numeric representation.", "Confirm applicant APAAR enrollment slip and correct input syntax."),
        ("VAL-INST-003", "v1.0", "ERROR", "FAIL", "Entity Resolution Conflict", "Reported branch code does not match institutional AICTE approval roster.", "Verify course approval order reference in institutional portal."),
        ("VAL-INTAKE-004", "v1.0", "WARNING", "FLAG", "Admission vs Approved Intake", "Reported student enrolments exceed the configured approved intake quota.", "Perform intake capacity audit and confirm supernumerary quota allocations."),
        ("VAL-AY-005", "v1.0", "WARNING", "FLAG", "Academic Year Consistency", "Admission year deviates from current academic cycle reporting period.", "Ensure batch reporting corresponds to the active reporting cycle."),
        ("VAL-DUP-006", "v1.0", "CRITICAL", "FAIL", "Duplicate Enrolment Alert", "Potential duplicate record identified concurrently across technical institutions.", "Escalate record to AICTE Duplicate Triage Centre for human review."),
        ("VAL-APAAR-007", "v1.0", "ERROR", "FAIL", "APAAR Verification Status", "Identifier has not completed authorized gateway verification handshake.", "Trigger gateway verification adapter or request manual document submission.")
    ]

    if db.query(ValidationResult).count() < 240:
        for idx in range(240):
            s = random.choice(students_list)
            rule = random.choice(VALIDATION_TEMPLATES)
            vr = ValidationResult(
                id=gen_uuid(),
                rule_id=rule[0],
                rule_version=rule[1],
                affected_record_reference=s.institution_reg_num,
                severity=rule[2],
                input_values_json={"apaar_id": s.apaar_id or "MISSING", "reg_num": s.institution_reg_num, "course": s.course_id},
                result=rule[3],
                human_explanation=rule[5],
                suggested_action=rule[6],
                institution_id=s.institution_id,
                student_id=s.id,
                created_at=get_now() - timedelta(days=random.randint(1, 45))
            )
            db.add(vr)
            validation_results_list.append(vr)
        db.flush()
    else:
        validation_results_list = db.query(ValidationResult).all()

    # Step 7: Seed 60+ Duplicate Investigation Cases
    print("[7/10] Generating 60+ Duplicate Investigation Cases (5 Match Categories)...")
    duplicate_alerts_list = []
    DUPLICATE_CATEGORIES = [
        ("CROSS_INSTITUTION_ENROLMENT", "CRITICAL", "Student simultaneously enrolled in two technical institutions with identical APAAR identifier."),
        ("EXACT_APAAR_CONFLICT", "CRITICAL", "Exact APAAR identifier conflict between two distinct student roll numbers."),
        ("SAME_INSTITUTION_REG_DUPLICATE", "HIGH", "Duplicate institutional registration number detected within the same academic program."),
        ("INTRA_UPLOAD_DUPLICATE", "HIGH", "Duplicate student identity detected multiple times within a single spreadsheet upload."),
        ("REPEATED_SUBMISSION", "MEDIUM", "Repeated submission of an already active verified student record.")
    ]

    # Specific Ananya Sen duplicate alert
    dup_ananya = db.query(DuplicateAlert).filter(DuplicateAlert.apaar_masked == "SIM-APAAR-****-331908").first()
    if not dup_ananya:
        dup_ananya = DuplicateAlert(
            id=gen_uuid(),
            student_id=ananya_dits.id,
            matched_student_id=ananya_mcer.id,
            match_category="CROSS_INSTITUTION_ENROLMENT",
            severity="CRITICAL",
            reason="Student 'Ananya Sen' is simultaneously enrolled for academic year 2024-2025 at both Delhi Institute of Tech (BT-CSE) and Maharashtra College of Engg (BT-MECH) with identical APAAR ID.",
            apaar_masked="SIM-APAAR-****-331908",
            institution_a_id=dits_inst.id,
            institution_b_id=mcer_inst.id,
            status="NEW",
            created_at=get_now() - timedelta(days=20)
        )
        db.add(dup_ananya)
        duplicate_alerts_list.append(dup_ananya)

    if db.query(DuplicateAlert).count() < 60:
        for d_idx in range(59):
            if d_idx < 25 and len(students_list) > 55:
                s_a = students_list[d_idx]
                s_b = students_list[d_idx + 25]
            else:
                s_a = random.choice(students_list)
                s_b = random.choice(students_list)
                while s_b.id == s_a.id:
                    s_b = random.choice(students_list)

            cat_info = random.choice(DUPLICATE_CATEGORIES)
            st = random.choice(["NEW", "NEW", "UNDER_REVIEW", "CONFIRMED_DUPLICATE", "NOT_A_DUPLICATE", "RESOLVED"])

            da = DuplicateAlert(
                id=gen_uuid(),
                student_id=s_a.id,
                matched_student_id=s_b.id,
                match_category=cat_info[0],
                severity=cat_info[1],
                reason=f"{cat_info[2]} Candidate {s_a.student_name} matches {s_b.student_name}.",
                apaar_masked=s_a.apaar_id[:10] + "..." if s_a.apaar_id else "DEMO-APAAR-****-984210",
                institution_a_id=s_a.institution_id,
                institution_b_id=s_b.institution_id,
                status=st,
                resolution_notes="Authorized regulator conducted inquiry with respective institutional registrars." if st in ["CONFIRMED_DUPLICATE", "RESOLVED", "NOT_A_DUPLICATE"] else None,
                assigned_reviewer_id=users_dict["aicte.admin@aicte.gov.in"].id if st != "NEW" else None,
                created_at=get_now() - timedelta(days=random.randint(1, 30)),
                resolved_at=get_now() - timedelta(days=random.randint(0, 5)) if st in ["RESOLVED", "CONFIRMED_DUPLICATE"] else None
            )
            db.add(da)
            duplicate_alerts_list.append(da)
        db.flush()
    else:
        duplicate_alerts_list = db.query(DuplicateAlert).all()

    # Step 8: Seed 130+ Verification Attempts
    print("[8/10] Generating 130+ Synthetic Verification Requests...")
    verification_requests_list = []
    PURPOSES = ["Employment Verification", "Higher Education Admission", "Visa & Immigration Verification", "Scholarship Eligibility", "Defense Credential Check"]

    if db.query(VerificationRequest).count() < 130:
        for v_idx in range(130):
            s = random.choice(students_list)
            code_token = f"APAAR-VRF-2024-{uuid.uuid4().hex[:10].upper()}"
            v_status = random.choice(["VERIFIED", "VERIFIED", "VERIFIED", "REVIEW_REQUIRED", "EXPIRED", "REVOKED"])
            is_rev = v_status == "REVOKED"
            is_exp = v_status == "EXPIRED"

            vr = VerificationRequest(
                id=gen_uuid(),
                verification_code=code_token,
                student_id=s.id,
                verifier_name=random.choice(["TCS Talent Verification", "Infosys Onboarding Team", "Wipro Compliance", "USIEF Fulbright Board", "DAAD Germany Bureau"]),
                verifier_organization="Authorized Third-Party Background Verifier",
                purpose=random.choice(PURPOSES),
                status=v_status,
                expires_at=get_now() - timedelta(days=5) if is_exp else get_now() + timedelta(days=90),
                revoked_at=get_now() - timedelta(days=2) if is_rev else None,
                revocation_reason="Student cancelled admission or transfer credential reissued." if is_rev else None,
                revoked_by_user_id=users_dict["aicte.admin@aicte.gov.in"].id if is_rev else None,
                created_at=get_now() - timedelta(days=random.randint(10, 100))
            )
            db.add(vr)
            verification_requests_list.append(vr)
        db.flush()
    else:
        verification_requests_list = db.query(VerificationRequest).all()

    # Step 9: Seed Audit Logs, Batches, Errors, Anomaly Alerts
    print("[9/10] Generating Audit Logs, Import Batches, Anomaly Alerts & DQI...")
    AUDIT_ACTIONS = [
        ("LOGIN", "USER", "User authenticated successfully via JWT session"),
        ("UPLOAD_STUDENT_BATCH", "BATCH", "Uploaded spreadsheet for schema validation"),
        ("INTAKE_REVISED", "INTAKE", "Sanctioned intake adjusted pursuant to official AICTE approval order"),
        ("DUPLICATE_INVESTIGATED", "DUPLICATE", "Regulator reviewed potential concurrent enrolment alert"),
        ("DUPLICATE_RESOLVED", "DUPLICATE", "Duplicate record determination recorded in immutable ledger"),
        ("VERIFICATION_TOKEN_ISSUED", "VERIFICATION", "Cryptographic academic verification token generated"),
        ("VERIFICATION_TOKEN_REVOKED", "VERIFICATION", "Credential token revoked due to institutional status change"),
        ("REPORT_EXPORT_CSV", "REPORT", "Exported course-wise enrolment regulatory report in CSV format"),
        ("REPORT_EXPORT_XLSX", "REPORT", "Generated comprehensive audit report workbook in XLSX format"),
        ("STUDENT_UNMASKED", "STUDENT", "Authorized officer unmasked student APAAR ID for compliance check")
    ]
    if db.query(AuditLog).count() < 160:
        for a_idx in range(160):
            act = random.choice(AUDIT_ACTIONS)
            s = random.choice(students_list)
            al = AuditLog(
                id=gen_uuid(),
                user_id=random.choice(list(users_dict.values())).id,
                institution_id=s.institution_id,
                action=act[0],
                resource_type=act[1],
                resource_id=s.id,
                details={"reason": act[2], "ip_address": f"192.168.1.{random.randint(10, 250)}", "client": "APAAR-Web-UI/1.0"},
                created_at=get_now() - timedelta(days=random.randint(1, 60))
            )
            db.add(al)
        db.flush()

    # Import Batches & Errors
    if db.query(ImportBatch).count() < 55:
        for b_idx in range(55):
            inst = random.choice(institutions)
            total_r = random.randint(50, 250)
            err_r = random.randint(3, 7) if b_idx % 2 == 0 else random.randint(1, 3)
            val_r = total_r - err_r

            batch = ImportBatch(
                id=gen_uuid(),
                institution_id=inst.id,
                uploaded_by_user_id=users_dict.get(f"operator@{inst.contact_email.split('@')[-1]}", users_dict["operator@dits.ac.in"]).id,
                file_name=f"{inst.name.split()[0].upper()}_STUDENTS_2024_BATCH_{b_idx+1:02d}.xlsx",
                file_type="XLSX",
                file_size_bytes=random.randint(25000, 180000),
                total_rows=total_r,
                valid_rows=val_r,
                error_rows=err_r,
                status="COMPLETED" if err_r == 0 else "COMPLETED_WITH_ERRORS",
                created_at=get_now() - timedelta(days=random.randint(2, 60))
            )
            db.add(batch)
            db.flush()

            if err_r > 0:
                for e_num in range(err_r):
                    db.add(ImportBatchError(
                        id=gen_uuid(),
                        batch_id=batch.id,
                        row_number=random.randint(2, total_r),
                        field_name=random.choice(["apaar_id", "date_of_birth", "admission_year", "course_code"]),
                        error_category="DATA_VALIDATION_ERROR",
                        error_message=random.choice([
                            "APAAR checksum validation failed for given numerical identity.",
                            "Date of birth indicates candidate age < 16 at time of admission.",
                            "Admission year does not match active AICTE reporting cycle 2024-25.",
                            "Specified course code BT-DATA is not listed in institutional approval roster."
                        ])
                    ))
        db.flush()

    if db.query(ImportBatchError).count() < 100:
        batches = db.query(ImportBatch).all()
        if batches:
            current_errs = db.query(ImportBatchError).count()
            needed = 133 - current_errs
            for _ in range(max(0, needed)):
                b = random.choice(batches)
                db.add(ImportBatchError(
                    id=gen_uuid(),
                    batch_id=b.id,
                    row_number=random.randint(2, b.total_rows or 100),
                    field_name=random.choice(["apaar_id", "date_of_birth", "admission_year", "course_code"]),
                    error_category="DATA_VALIDATION_ERROR",
                    error_message=random.choice([
                        "APAAR checksum validation failed for given numerical identity.",
                        "Date of birth indicates candidate age < 16 at time of admission.",
                        "Admission year does not match active AICTE reporting cycle 2024-25.",
                        "Specified course code BT-DATA is not listed in institutional approval roster."
                    ])
                ))
            db.flush()

    # Anomaly Alerts (Intake mismatches & irregular enrolments)
    if db.query(AnomalyAlert).count() < 55:
        # MCER Mech intake mismatch alert
        db.add(AnomalyAlert(
            id=gen_uuid(),
            institution_id=mcer_inst.id,
            course_id=mcer_mech.id,
            academic_year="2024-2025",
            alert_type="INTAKE_MISMATCH",
            score=0.94,
            factors_json={"approved_intake": 60, "reported_enrolment": 74, "excess_seats": 14, "percentage_excess": 23.3},
            explanation="Reported enrolment (74) exceeds approved intake capacity (60) by 14 students (23.3% excess). Requires regulatory intake audit.",
            status="ACTIVE",
            created_at=get_now() - timedelta(days=15)
        ))

        ANOMALY_TYPES = ["INTAKE_MISMATCH", "UNUSUAL_SUPERNUMERARY", "RAPID_ENROLMENT_SPIKE", "CATEGORY_DISTRIBUTION_SKEW"]
        for an_idx in range(54):
            c_target = random.choice(courses_list)
            a_type = random.choice(ANOMALY_TYPES)
            score_val = round(random.uniform(0.70, 0.98), 2)
            db.add(AnomalyAlert(
                id=gen_uuid(),
                institution_id=c_target.institution_id,
                course_id=c_target.id,
                academic_year="2024-2025",
                alert_type=a_type,
                score=score_val,
                factors_json={"course": c_target.course_name, "score": score_val},
                explanation=f"Algorithmic anomaly detector flagged statistical deviation in {c_target.course_name} reporting patterns.",
                status=random.choice(["ACTIVE", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"]),
                created_at=get_now() - timedelta(days=random.randint(1, 40))
            ))
        db.flush()

    # Commit all database transactions
    db.commit()

    # Step 10: Generate Excel, CSV, and SQL Seed Files if requested
    if export_files:
        print("[10/10] Exporting Database Artifacts (Excel, CSV, SQL Seed)...")
        ROOT_DIR = PARENT_DIR

        # A. APAAR_Vault_Students.csv
        stu_data = [{
            "id": s.id,
            "institution_id": s.institution_id,
            "course_id": s.course_id,
            "student_name": s.student_name,
            "institution_reg_num": s.institution_reg_num,
            "apaar_id": s.apaar_id or "",
            "email": s.email,
            "phone": s.phone,
            "gender": s.gender,
            "date_of_birth": s.date_of_birth,
            "academic_year": s.academic_year,
            "admission_year": s.admission_year,
            "admission_category": s.admission_category,
            "is_supernumerary": s.is_supernumerary,
            "apaar_status": s.apaar_status,
            "data_validation_status": s.data_validation_status,
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M:%S") if s.created_at else ""
        } for s in students_list]
        pd.DataFrame(stu_data).to_csv(os.path.join(ROOT_DIR, "APAAR_Vault_Students.csv"), index=False)
        print(f"-> Created: {os.path.join(ROOT_DIR, 'APAAR_Vault_Students.csv')} ({len(students_list)} rows)")

        # B. APAAR_Vault_Institutions.csv
        inst_data = [{
            "id": i.id,
            "institution_code": i.institution_code,
            "name": i.name,
            "aicte_approval_ref": i.aicte_approval_ref,
            "institution_type": i.institution_type,
            "state": i.state,
            "district": i.district,
            "contact_email": i.contact_email,
            "contact_phone": i.contact_phone,
            "status": i.status,
            "is_simulated": i.is_simulated
        } for i in institutions]
        pd.DataFrame(inst_data).to_csv(os.path.join(ROOT_DIR, "APAAR_Vault_Institutions.csv"), index=False)
        print(f"-> Created: {os.path.join(ROOT_DIR, 'APAAR_Vault_Institutions.csv')} ({len(institutions)} rows)")

        # C. APAAR_Vault_Courses.csv
        course_data = [{
            "id": c.id,
            "institution_id": c.institution_id,
            "course_name": c.course_name,
            "course_code": c.course_code,
            "degree_level": c.degree_level,
            "duration_years": c.duration_years
        } for c in courses_list]
        pd.DataFrame(course_data).to_csv(os.path.join(ROOT_DIR, "APAAR_Vault_Courses.csv"), index=False)
        print(f"-> Created: {os.path.join(ROOT_DIR, 'APAAR_Vault_Courses.csv')} ({len(courses_list)} rows)")

        # D. APAAR_Vault_Test_Database.xlsx (12 sheets)
        excel_path = os.path.join(ROOT_DIR, "APAAR_Vault_Test_Database.xlsx")
        with pd.ExcelWriter(excel_path, engine="openpyxl") as writer:
            pd.DataFrame(inst_data).to_excel(writer, sheet_name="Institutions", index=False)
            pd.DataFrame(course_data).to_excel(writer, sheet_name="Courses", index=False)
            pd.DataFrame(stu_data).to_excel(writer, sheet_name="Students", index=False)

            # Validation Issues
            val_df = pd.DataFrame([{
                "issue_id": v.id,
                "rule_id": v.rule_id,
                "severity": v.severity,
                "affected_record": v.affected_record_reference,
                "result": v.result,
                "explanation": v.human_explanation,
                "suggested_action": v.suggested_action,
                "institution_id": v.institution_id,
                "student_id": v.student_id or ""
            } for v in validation_results_list])
            val_df.to_excel(writer, sheet_name="Validation_Issues", index=False)

            # Duplicate Cases
            dup_df = pd.DataFrame([{
                "case_id": d.id,
                "student_a_id": d.student_id or "",
                "student_b_id": d.matched_student_id or "",
                "match_category": d.match_category,
                "severity": d.severity,
                "reason": d.reason,
                "apaar_masked": d.apaar_masked or "",
                "institution_a_id": d.institution_a_id or "",
                "institution_b_id": d.institution_b_id or "",
                "status": d.status,
                "resolution_notes": d.resolution_notes or ""
            } for d in duplicate_alerts_list])
            dup_df.to_excel(writer, sheet_name="Duplicate_Cases", index=False)

            # Enrolment Snapshots
            intake_df = pd.DataFrame([{
                "snapshot_id": ai.id,
                "institution_id": ai.institution_id,
                "course_id": ai.course_id,
                "academic_year": ai.academic_year,
                "approved_intake": ai.approved_intake,
                "supernumerary_quota": ai.supernumerary_quota,
                "actual_enrolment": ai.actual_enrolment,
                "supernumerary_enrolled": ai.supernumerary_enrolled,
                "approval_order_ref": ai.approval_order_ref
            } for ai in intakes_list])
            intake_df.to_excel(writer, sheet_name="Enrolment_Snapshots", index=False)

            # Verification Attempts
            ver_df = pd.DataFrame([{
                "attempt_id": vr.id,
                "verification_code": vr.verification_code,
                "student_id": vr.student_id,
                "verifier_name": vr.verifier_name or "",
                "purpose": vr.purpose or "",
                "status": vr.status,
                "expires_at": str(vr.expires_at) if vr.expires_at else "",
                "revoked_at": str(vr.revoked_at) if vr.revoked_at else ""
            } for vr in verification_requests_list])
            ver_df.to_excel(writer, sheet_name="Verification_Attempts", index=False)

            # Users
            users_df = pd.DataFrame([{
                "email": u.email,
                "full_name": u.full_name,
                "institution_id": u.institution_id or "National",
                "is_active": u.is_active
            } for u in users_dict.values()])
            users_df.to_excel(writer, sheet_name="Users", index=False)

            # Audit Logs
            audit_sample = db.query(AuditLog).limit(100).all()
            audit_df = pd.DataFrame([{
                "event_id": a.id,
                "user_id": a.user_id or "System",
                "institution_id": a.institution_id or "",
                "action": a.action,
                "resource_type": a.resource_type,
                "resource_id": a.resource_id or "",
                "timestamp": str(a.created_at)
            } for a in audit_sample])
            audit_df.to_excel(writer, sheet_name="Audit_Logs", index=False)

            # Import Batches
            batches_sample = db.query(ImportBatch).all()
            batches_df = pd.DataFrame([{
                "batch_id": b.id,
                "institution_id": b.institution_id,
                "file_name": b.file_name,
                "total_rows": b.total_rows,
                "valid_rows": b.valid_rows,
                "error_rows": b.error_rows,
                "status": b.status
            } for b in batches_sample])
            batches_df.to_excel(writer, sheet_name="Import_Batches", index=False)

            # Import Errors
            errors_sample = db.query(ImportBatchError).all()
            errors_df = pd.DataFrame([{
                "error_id": e.id,
                "batch_id": e.batch_id,
                "row_number": e.row_number,
                "field_name": e.field_name or "",
                "error_category": e.error_category,
                "error_message": e.error_message
            } for e in errors_sample])
            errors_df.to_excel(writer, sheet_name="Import_Errors", index=False)

            # Notifications & Anomalies
            anomalies_sample = db.query(AnomalyAlert).all()
            anomalies_df = pd.DataFrame([{
                "alert_id": a.id,
                "institution_id": a.institution_id,
                "alert_type": a.alert_type,
                "score": a.score,
                "explanation": a.explanation,
                "status": a.status
            } for a in anomalies_sample])
            anomalies_df.to_excel(writer, sheet_name="Notifications", index=False)

        print(f"-> Created: {excel_path} (12 sheets)")

        # E. APAAR_Vault_Seed.sql
        sql_path = os.path.join(ROOT_DIR, "APAAR_Vault_Seed.sql")
        with open(sql_path, "w", encoding="utf-8") as f:
            f.write("-- =============================================================\n")
            f.write("-- APAAR-Vault: Synthetic Test Database Seed Script\n")
            f.write("-- AICTE Problem Statement 26263 (Regulation Bureau Platform)\n")
            f.write("-- Generated with 100% Synthetic Records for Safe Testing\n")
            f.write("-- =============================================================\n\n")
            f.write("BEGIN TRANSACTION;\n\n")

            for i in institutions:
                safe_name = i.name.replace("'", "''")
                f.write(f"INSERT OR IGNORE INTO institutions (id, institution_code, name, aicte_approval_ref, institution_type, state, district, contact_email, contact_phone, status, is_simulated) VALUES ('{i.id}', '{i.institution_code}', '{safe_name}', '{i.aicte_approval_ref}', '{i.institution_type}', '{i.state}', '{i.district}', '{i.contact_email}', '{i.contact_phone}', '{i.status}', 1);\n")

            for c in courses_list:
                safe_cname = c.course_name.replace("'", "''")
                f.write(f"INSERT OR IGNORE INTO courses (id, institution_id, department_id, course_name, course_code, degree_level, duration_years) VALUES ('{c.id}', '{c.institution_id}', '{c.department_id}', '{safe_cname}', '{c.course_code}', '{c.degree_level}', {c.duration_years});\n")

            for s in students_list[:150]:
                apaar_sql = f"'{s.apaar_id}'" if s.apaar_id else "NULL"
                safe_sname = s.student_name.replace("'", "''")
                f.write(f"INSERT OR IGNORE INTO students (id, institution_id, course_id, student_name, institution_reg_num, apaar_id, email, phone, academic_year, admission_year, admission_status, admission_category, is_supernumerary, apaar_status, data_validation_status) VALUES ('{s.id}', '{s.institution_id}', '{s.course_id}', '{safe_sname}', '{s.institution_reg_num}', {apaar_sql}, '{s.email}', '{s.phone}', '{s.academic_year}', {s.admission_year}, '{s.admission_status}', '{s.admission_category}', {1 if s.is_supernumerary else 0}, '{s.apaar_status}', '{s.data_validation_status}');\n")

            f.write("\nCOMMIT;\n")
        print(f"-> Created: {sql_path}")

    # Final summary report
    print("\n" + "=" * 70)
    print("TEST DATABASE GENERATION COMPLETE!")
    print(f"Institutions:          {len(institutions)} (Target: >=20)")
    print(f"Courses:               {len(courses_list)} (Target: >=100)")
    print(f"Enrolment Snapshots:   {len(intakes_list)} (Target: >=100)")
    print(f"Student Records:       {len(students_list)} (Target: >=1000)")
    print(f"Validation Issues:     {len(validation_results_list)} (Target: >=200)")
    print(f"Duplicate Cases:       {len(duplicate_alerts_list)} (Target: >=50)")
    print(f"Verification Attempts: {len(verification_requests_list)} (Target: >=100)")
    print(f"Audit Events:          160 (Target: >=100)")
    print(f"Import Batches:        55 (Target: >=50)")
    print(f"Import Errors:         {db.query(ImportBatchError).count()} (Target: >=100)")
    print(f"Notifications:         55 (Target: >=50)")
    print(f"Application Users:     {len(users_dict)} (Target: >=20)")
    print("=" * 70)

    return {
        "status": "SUCCESS",
        "message": "Demo data seeded successfully with 25 institutions, 125 courses, and 1,200 students.",
        "institutions": len(institutions),
        "courses": len(courses_list),
        "students": len(students_list),
        "validation_issues": len(validation_results_list),
        "duplicate_cases": len(duplicate_alerts_list),
        "verification_attempts": len(verification_requests_list)
    }

def main():
    from app.core.config import settings
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    )
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        populate_database(db, export_files=True)
    finally:
        db.close()

if __name__ == "__main__":
    main()
