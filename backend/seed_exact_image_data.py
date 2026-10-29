"""
APAAR-Vault: Exact Image Reference Data Seeder
Generates:
- Exactly 12 Institutions
- Exactly 8,432 Total Student Records
  - 6,892 Verified Records
  - 1,340 Pending Verification Records
  - 186 Data Validation Issues
  - 14 Other Records
- Exactly 42 Duplicate Alert Cases
- The 5 Recent Student Records from Reference Design:
  1. Ananya R (420192831234, Masked: 42XXXX1234, Verified, 2h ago)
  2. Rahul S (420192835678, Masked: 42XXXX5678, Pending, 3h ago)
  3. Priya K (420192839012, Masked: 42XXXX9012, Verified, 5h ago)
  4. Vikash M (420192833456, Masked: 42XXXX3456, Error, 6h ago)
  5. Sneha L (420192837890, Masked: 42XXXX7890, Verified, 8h ago)
- 7 RBAC Roles & System Users
- Course Intakes & Audit Logs
"""

import os
import sys
import uuid
import random
import shutil
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Setup paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(BACKEND_DIR)
sys.path.insert(0, BACKEND_DIR)

from app.models.models import (
    Base, User, UserRole, UserRoleAssignment, Institution, Department,
    Course, ApprovedIntake, ApprovedIntakeRevision, Student, ImportBatch,
    ImportBatchError, DuplicateAlert, AnomalyAlert, VerificationRequest,
    AuditLog, ValidationRuleConfig, ValidationResult, CorrectionRequest,
    DataQualityMetric, ApiClient
)
from app.core.security import get_password_hash
from app.services.validation_engine import init_default_validation_rules

random.seed(42)

def gen_uuid():
    return str(uuid.uuid4())

def get_now():
    return datetime.now(timezone.utc)

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir", "Ritvik", "Darsh",
    "Aanya", "Diya", "Saanvi", "Ananya", "Fatima", "Isha", "Aadhya", "Pari", "Chiara", "Myra",
    "Prisha", "Riya", "Anvi", "Navya", "Avani", "Meera", "Sara", "Kavya", "Ahana", "Zara",
    "Vikram", "Rohan", "Siddharth", "Karan", "Nikhil", "Gaurav", "Amit", "Rahul", "Varun", "Abhishek",
    "Pooja", "Neha", "Priya", "Sneha", "Shreya", "Anjali", "Swati", "Divya", "Tanvi", "Simran",
    "Ravi", "Suresh", "Manoj", "Deepak", "Rajesh", "Sanjay", "Alok", "Sunil", "Anil", "Prakash"
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

# EXACTLY 12 INSTITUTIONS (matching reference image: Total Institutions: 12)
INSTITUTIONS_12 = [
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
]

def seed_exact_data(db_path: str):
    print(f"\n=======================================================")
    print(f"SEEDING EXACT REFERENCE IMAGE DATA TO: {db_path}")
    print(f"=======================================================")
    
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    
    # Drop and recreate schema cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        # 1. Validation Rules
        print("[1/8] Initializing default validation rules...")
        init_default_validation_rules(db)
        
        # 2. Roles
        print("[2/8] Creating 7 RBAC roles...")
        roles_data = [
            ("SUPER_ADMIN", "Full platform administration, audit logs, and configuration"),
            ("AICTE_ADMIN", "National regulatory oversight, intake discrepancies, and AI assistant"),
            ("INSTITUTION_ADMIN", "Institutional administrator, student onboarding, and local intake"),
            ("DEPT_COORDINATOR", "Department-level student validation and course review"),
            ("DATA_ENTRY", "Institutional data entry operator for bulk uploads"),
            ("STUDENT", "Student portal access, personal credential view, and QR generation"),
            ("EXTERNAL_VERIFIER", "Authorized third-party background verifier")
        ]
        role_map = {}
        for r_name, r_desc in roles_data:
            r = UserRole(id=gen_uuid(), name=r_name, description=r_desc)
            db.add(r)
            db.flush()
            role_map[r_name] = r
            
        # 3. Exactly 12 Institutions
        print("[3/8] Seeding exactly 12 AICTE approved technical institutions...")
        institutions = []
        for code, name, state, dist, itype, aicte_ref, email, phone in INSTITUTIONS_12:
            inst = Institution(
                id=gen_uuid(),
                institution_code=code,
                name=name,
                aicte_approval_ref=aicte_ref,
                institution_type=itype,
                state=state,
                district=dist,
                address=f"AICTE Campus, {dist}, {state} - India",
                contact_email=email,
                contact_phone=phone,
                status="APPROVED",
                is_simulated=True
            )
            db.add(inst)
            db.flush()
            institutions.append(inst)
            
        # 4. Users across roles
        print("[4/8] Seeding system users...")
        users_seed = [
            ("aicte.admin@aicte.gov.in", "Dr. Priya Sharma", "Aicte@12345", "AICTE_ADMIN", None),
            ("superadmin@aicte.gov.in", "System Administrator", "Admin@12345", "SUPER_ADMIN", None),
            ("principal@dits.ac.in", "Dr. Arvind Mehta", "Inst@12345", "INSTITUTION_ADMIN", institutions[0].id),
            ("dean@mcer.edu.in", "Dr. Rajesh Kulkarni", "Inst@12345", "INSTITUTION_ADMIN", institutions[1].id),
            ("cse.hod@dits.ac.in", "Prof. Sunita Rao", "Coord@12345", "DEPT_COORDINATOR", institutions[0].id),
            ("operator@dits.ac.in", "Amit Verma", "Operator@12345", "DATA_ENTRY", institutions[0].id),
            ("rahul.sharma@student.dits.ac.in", "Rahul Sharma", "Student@12345", "STUDENT", institutions[0].id),
            ("verifier@tcs-background.com", "TCS Background Desk", "Verifier@12345", "EXTERNAL_VERIFIER", None)
        ]
        for email, fullname, pwd, rname, inst_id in users_seed:
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
            db.add(UserRoleAssignment(id=gen_uuid(), user_id=u.id, role_id=role_map[rname].id))
            
        # 5. Departments, Courses & Approved Intakes
        print("[5/8] Seeding departments, courses and approved intakes across 12 institutions...")
        courses_list = []
        course_configs = [
            ("CSE", "B.Tech Computer Science and Engineering", 180, 172),
            ("ECE", "B.Tech Electronics and Communication", 120, 115),
            ("IT", "B.Tech Information Technology", 120, 118),
            ("MECH", "B.Tech Mechanical Engineering", 90, 85),
            ("EE", "B.Tech Electrical and Electronics", 60, 58),
            ("AIML", "B.Tech Artificial Intelligence and Data Science", 60, 60),
        ]
        
        for inst in institutions:
            dept_cse = Department(id=gen_uuid(), institution_id=inst.id, name="Computer Science & Engineering", code="CSE")
            dept_ece = Department(id=gen_uuid(), institution_id=inst.id, name="Electronics & Communication", code="ECE")
            dept_mech = Department(id=gen_uuid(), institution_id=inst.id, name="Mechanical Engineering", code="MECH")
            db.add_all([dept_cse, dept_ece, dept_mech])
            db.flush()
            
            for code, name, app_intake, act_enrol in course_configs:
                d = dept_cse if code in ["CSE", "IT", "AIML"] else (dept_ece if code in ["ECE", "EE"] else dept_mech)
                crs = Course(
                    id=gen_uuid(),
                    institution_id=inst.id,
                    department_id=d.id,
                    course_name=name,
                    course_code=f"{inst.institution_code[-4:]}-{code}",
                    degree_level="UNDERGRADUATE",
                    duration_years=4
                )
                db.add(crs)
                db.flush()
                courses_list.append(crs)
                
                # Configure MCER excess intake for demonstration (60 approved, 74 actual enrolment -> 14 excess seats)
                current_app_intake = app_intake
                current_act_enrol = act_enrol
                if inst.institution_code == "1-2009871" and code == "AIML":
                    current_app_intake = 60
                    current_act_enrol = 74

                intake = ApprovedIntake(
                    id=gen_uuid(),
                    institution_id=inst.id,
                    course_id=crs.id,
                    academic_year="2024-2025",
                    approved_intake=current_app_intake,
                    actual_enrolment=current_act_enrol,
                    supernumerary_quota=int(current_app_intake * 0.15),
                    supernumerary_enrolled=random.randint(5, 12),
                    approval_order_ref=f"AICTE-EOA-2024-{inst.institution_code[-4:]}",
                    effective_date=get_now() - timedelta(days=180)
                )
                db.add(intake)
        db.flush()

        # 6. EXACT STUDENT RECORDS: Target = 8,432 Total Records
        # - 6,892 Verified
        # - 1,340 Pending
        # - 186 Data Validation Issues
        # - 14 Format Valid / Other
        print("[6/8] Generating exactly 8,432 student records matching reference dashboard...")
        
        # A. The 5 specific recent student records from reference image
        now = get_now()
        recent_5 = [
            {
                "name": "Ananya R",
                "apaar": "420192831234",
                "status": "VERIFIED",
                "val_status": "VALID",
                "hours_ago": 2,
                "inst": institutions[0], # DITS
                "course": courses_list[0]
            },
            {
                "name": "Rahul S",
                "apaar": "420192835678",
                "status": "PENDING",
                "val_status": "VALID",
                "hours_ago": 3,
                "inst": institutions[0],
                "course": courses_list[1]
            },
            {
                "name": "Priya K",
                "apaar": "420192839012",
                "status": "VERIFIED",
                "val_status": "VALID",
                "hours_ago": 5,
                "inst": institutions[2], # KITA
                "course": courses_list[2]
            },
            {
                "name": "Vikash M",
                "apaar": "420192833456",
                "status": "INVALID",
                "val_status": "ERROR",
                "hours_ago": 6,
                "inst": institutions[1], # MCER
                "course": courses_list[3]
            },
            {
                "name": "Sneha L",
                "apaar": "420192837890",
                "status": "VERIFIED",
                "val_status": "VALID",
                "hours_ago": 8,
                "inst": institutions[3], # TNTA
                "course": courses_list[4]
            }
        ]
        
        students_batch = []
        for s in recent_5:
            st = Student(
                id=gen_uuid(),
                institution_id=s["inst"].id,
                course_id=s["course"].id,
                student_name=s["name"],
                institution_reg_num=f"{s['inst'].institution_code[-4:]}-2024-{random.randint(1000, 9999)}",
                apaar_id=s["apaar"],
                email=f"{s['name'].lower().replace(' ', '')}@example.edu.in",
                phone=f"+91-98{random.randint(10000000, 99999999)}",
                date_of_birth="2005-06-15",
                gender="Female" if "a" in s["name"][-1] else "Male",
                academic_year="2024-2025",
                admission_year=2024,
                admission_status="ACTIVE",
                admission_category="GENERAL",
                is_supernumerary=False,
                apaar_status=s["status"],
                apaar_verified_at=(now - timedelta(hours=s["hours_ago"])) if s["status"] == "VERIFIED" else None,
                apaar_verification_ref=f"VERIF-REF-{random.randint(10000, 99999)}" if s["status"] == "VERIFIED" else None,
                data_validation_status=s["val_status"],
                created_at=now - timedelta(hours=s["hours_ago"]),
                updated_at=now - timedelta(hours=s["hours_ago"])
            )
            students_batch.append(st)

        # Exact targets:
        # Verified: 6,892 (already have 3 -> 6,889 more)
        # Pending: 1,340 (already have 1 -> 1,339 more)
        # Validation Issues: 186 (already have 1 -> 185 more)
        # Other Invalid / Non-pending: 14 (14 more)
        # Total = 5 + 6889 + 1339 + 185 + 14 = 8,432!
        
        categories = ["GENERAL", "OBC", "SC", "ST", "EWS", "TFW"]
        cat_weights = [0.45, 0.25, 0.15, 0.08, 0.05, 0.02]
        
        target_counts = [
            ("VERIFIED", "VALID", 6889),
            ("PENDING", "VALID", 1339),
            ("INVALID", "WARNING", 35),
            ("INVALID", "ERROR", 150),
            ("INVALID", "VALID", 14)
        ]
        
        reg_counter = 100
        for apaar_st, val_st, count in target_counts:
            for j in range(count):
                reg_counter += 1
                c = courses_list[reg_counter % len(courses_list)]
                inst = next(i for i in institutions if i.id == c.institution_id)
                fname = random.choice(FIRST_NAMES)
                lname = random.choice(LAST_NAMES)
                sname = f"{fname} {lname}"
                if val_st == "WARNING" and j == 0:
                    sname = "Ananya Sen"
                
                # Standard 12-digit numeric APAAR starting with 42
                apaar_num = f"42{random.randint(1000000000, 9999999999)}"
                if val_st in ["ERROR", "WARNING"]:
                    apaar_num = f"42{random.randint(1000, 9999)}" # short invalid
                
                cat = random.choices(categories, weights=cat_weights, k=1)[0]
                days_ago = random.randint(1, 180)
                
                st = Student(
                    id=gen_uuid(),
                    institution_id=inst.id,
                    course_id=c.id,
                    student_name=sname,
                    institution_reg_num=f"{inst.institution_code[-4:]}-2024-{reg_counter:05d}",
                    apaar_id=apaar_num if apaar_st != "NOT_CHECKED" else None,
                    email=f"{fname.lower()}.{lname.lower()}{reg_counter % 1000}@{inst.contact_email.split('@')[-1]}",
                    phone=f"+91-9{random.randint(100000000, 999999999)}",
                    date_of_birth="2005-04-12",
                    gender=random.choice(["Male", "Female"]),
                    academic_year="2024-2025",
                    admission_year=2024,
                    admission_status="ACTIVE",
                    admission_category=cat,
                    is_supernumerary=(cat in ["EWS", "TFW"]),
                    apaar_status=apaar_st,
                    apaar_verified_at=(now - timedelta(days=days_ago)) if apaar_st == "VERIFIED" else None,
                    apaar_verification_ref=f"VERIF-REF-{random.randint(10000, 99999)}" if apaar_st == "VERIFIED" else None,
                    data_validation_status=val_st,
                    created_at=now - timedelta(days=days_ago),
                    updated_at=now - timedelta(days=days_ago)
                )
                students_batch.append(st)
                
                # Bulk add in chunks of 1000
                if len(students_batch) >= 1000:
                    db.add_all(students_batch)
                    db.flush()
                    students_batch = []
                    
        if students_batch:
            db.add_all(students_batch)
            db.flush()

        # 7. EXACTLY 42 DUPLICATE ALERT CASES (matching reference image: Duplicate Cases: 42)
        print("[7/8] Generating exactly 42 Duplicate Investigation Cases...")
        # Get sample students for duplicate pairs
        sample_students = db.query(Student).filter(Student.apaar_id.isnot(None)).limit(84).all()
        for idx in range(42):
            s_a = sample_students[idx * 2] if len(sample_students) > idx * 2 else sample_students[0]
            s_b = sample_students[idx * 2 + 1] if len(sample_students) > idx * 2 + 1 else sample_students[1]
            
            dup = DuplicateAlert(
                id=gen_uuid(),
                student_id=s_a.id,
                matched_student_id=s_b.id,
                institution_a_id=s_a.institution_id,
                institution_b_id=s_b.institution_id,
                match_category=random.choice(["EXACT_APAAR", "SAME_IDENTITY_DIFF_INSTITUTION", "HIGH_NAME_PHONE_MATCH"]),
                severity=random.choice(["CRITICAL", "HIGH", "MEDIUM"]),
                reason=f"Candidate identified across institutions with identical demographic identifiers",
                apaar_masked=f"42XXXX{random.randint(1000, 9999)}",
                status=random.choice(["NEW", "UNDER_REVIEW"]),
                created_at=now - timedelta(days=random.randint(1, 30))
            )
            db.add(dup)
        db.flush()
        
        # 8. Explainable Validation Results for 186 issues
        print("[8/8] Generating explainable validation results for 186 issues...")
        err_students = db.query(Student).filter(Student.data_validation_status.in_(["ERROR", "WARNING"])).all()
        rule = db.query(ValidationRuleConfig).first()
        for es in err_students:
            vr = ValidationResult(
                id=gen_uuid(),
                student_id=es.id,
                institution_id=es.institution_id,
                rule_id=rule.rule_id if rule else "VAL-APAAR-001",
                rule_version="1.0.0",
                affected_record_reference=f"Student Record {es.institution_reg_num}",
                severity="ERROR",
                result="FAIL",
                human_explanation=f"Student {es.student_name} APAAR ID format failed length verification check (expected 12-digit numeric)",
                suggested_action="Prompt student for authentic 12-digit APAAR/ABC card documentation",
                created_at=now - timedelta(days=random.randint(1, 20))
            )
            db.add(vr)
            
        # Commit all changes
        db.commit()
        
        # Verify exact counts
        total_inst = db.query(Institution).count()
        total_std = db.query(Student).count()
        verif_std = db.query(Student).filter(Student.apaar_status == "VERIFIED").count()
        pend_std = db.query(Student).filter(Student.apaar_status.in_(["NOT_CHECKED", "PENDING", "FORMAT_VALID"])).count()
        val_issues = db.query(Student).filter(Student.data_validation_status.in_(["WARNING", "ERROR"])).count()
        dup_cases = db.query(DuplicateAlert).filter(DuplicateAlert.status.in_(["NEW", "UNDER_REVIEW"])).count()
        
        print(f"\n=======================================================")
        print(f"DATABASE VERIFICATION SUMMARY FOR: {db_path}")
        print(f"Total Institutions:         {total_inst} (Expected: 12)")
        print(f"Total Student Records:      {total_std} (Expected: 8,432)")
        print(f"Verified Records:           {verif_std} (Expected: 6,892)")
        print(f"Pending Verification:       {pend_std} (Expected: 1,340)")
        print(f"Data Validation Issues:     {val_issues} (Expected: 186)")
        print(f"Duplicate Cases:            {dup_cases} (Expected: 42)")
        print(f"=======================================================\n")
        
    finally:
        db.close()

if __name__ == "__main__":
    db_file_backend = os.path.join(BACKEND_DIR, "apaar_vault.db")
    db_file_root = os.path.join(PARENT_DIR, "apaar_vault.db")
    
    seed_exact_data(db_file_backend)
    
    # Copy to root as well so both locations stay 100% in sync
    shutil.copy2(db_file_backend, db_file_root)
    print(f"Synced {db_file_backend} -> {db_file_root}")
