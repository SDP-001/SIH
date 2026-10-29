import os
from PIL import Image, ImageDraw, ImageFont

def get_font(name, size):
    font_path = os.path.join(r"C:\Windows\Fonts", name)
    try:
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def create_dashboard_screenshot():
    w, h = 1200, 680
    img = Image.new("RGB", (w, h), "#0B1120")
    draw = ImageDraw.Draw(img)

    f_title = get_font("segoeuib.ttf", 22)
    f_sub = get_font("segoeui.ttf", 13)
    f_bold = get_font("segoeuib.ttf", 14)
    f_regular = get_font("segoeui.ttf", 12)
    f_small = get_font("segoeui.ttf", 10)
    f_stat_num = get_font("segoeuib.ttf", 28)

    # 1. Browser Title Bar
    draw.rectangle([(0, 0), (w, 36)], fill="#1E293B")
    # Window buttons
    draw.ellipse([(14, 12), (24, 22)], fill="#EF4444")
    draw.ellipse([(32, 12), (42, 22)], fill="#F59E0B")
    draw.ellipse([(50, 12), (60, 22)], fill="#10B981")
    # URL Pill
    draw.rounded_rectangle([(180, 6), (w - 180, 30)], radius=6, fill="#0F172A", outline="#334155")
    draw.text((200, 9), "https://apaar-vault.aicte.gov.in/dashboard/aicte  (AICTE Regulatory Command Center)", fill="#94A3B8", font=f_small)

    # 2. Top Header Navigation
    draw.rectangle([(0, 36), (w, 96)], fill="#0F172A", outline="#1E293B")
    draw.text((24, 46), "APAAR-VAULT", fill="#38BDF8", font=f_title)
    draw.text((24, 74), "AICTE Regulation Bureau \u2014 One Academic Identity. Verified Records.", fill="#94A3B8", font=f_small)

    # Nav Tabs
    tabs = ["Overview", "Institutions (12)", "Students (1,248)", "Intake Monitoring", "Validation Engine", "Audit Logs"]
    tx = 360
    for i, t in enumerate(tabs):
        active = (i == 0)
        t_bg = "#1E293B" if active else None
        if t_bg:
            draw.rounded_rectangle([(tx - 10, 52), (tx + len(t) * 7 + 10, 80)], radius=4, fill=t_bg, outline="#38BDF8")
        draw.text((tx, 58), t, fill="#FFFFFF" if active else "#94A3B8", font=f_regular)
        tx += len(t) * 7 + 36

    # Role Badge
    draw.rounded_rectangle([(w - 180, 50), (w - 24, 82)], radius=6, fill="#1E3A8A", outline="#3B82F6")
    draw.text((w - 165, 58), "\U0001F6E1 Super Admin", fill="#93C5FD", font=f_bold)

    # 3. 4 Stat / KPI Cards
    card_y = 112
    card_h = 100
    card_w = (w - 48 - 36) // 4
    stats = [
        ("Total Institutions", "12", "All Accredited Campuses", "#3B82F6", "#1E3A8A"),
        ("Active Enrolments", "1,248", "94.2% APAAR Validated", "#10B981", "#064E3B"),
        ("Discrepancy Alerts", "3", "Immediate Review Required", "#EF4444", "#7F1D1D"),
        ("Data Quality Index", "98.6%", "High Regulatory Integrity", "#8B5CF6", "#4C1D95")
    ]
    for i, (title, num, sub, accent, bg) in enumerate(stats):
        cx = 24 + i * (card_w + 12)
        draw.rounded_rectangle([(cx, card_y), (cx + card_w, card_y + card_h)], radius=8, fill="#1E293B", outline=accent, width=1)
        draw.text((cx + 16, card_y + 12), title, fill="#94A3B8", font=f_small)
        draw.text((cx + 16, card_y + 32), num, fill=accent, font=f_stat_num)
        draw.text((cx + 16, card_y + 74), sub, fill="#CBD5E1", font=f_small)

    # 4. Main Section: Left = Intake Monitoring Table (w=680), Right = Alerts & Validation (w=440)
    # Left Box
    ly = 226
    lh = 430
    lw = 700
    draw.rounded_rectangle([(24, ly), (24 + lw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((40, ly + 16), "AICTE Approved Intake vs. Actual Enrolment Monitoring", fill="#F8FAFC", font=f_bold)
    draw.text((40, ly + 36), "Live automated monitoring of student capacity quotas across approved departments", fill="#94A3B8", font=f_small)

    # Table Header
    ty = ly + 64
    draw.rectangle([(36, ty), (24 + lw - 12, ty + 30)], fill="#0F172A")
    draw.text((48, ty + 8), "Institution Name", fill="#94A3B8", font=f_small)
    draw.text((310, ty + 8), "Course", fill="#94A3B8", font=f_small)
    draw.text((430, ty + 8), "Approved", fill="#94A3B8", font=f_small)
    draw.text((500, ty + 8), "Enrolled", fill="#94A3B8", font=f_small)
    draw.text((570, ty + 8), "Compliance Status", fill="#94A3B8", font=f_small)

    rows = [
        ("Delhi Institute of Tech. & Science", "B.Tech CSE", "120", "128", "OVER_CAPACITY", "#EF4444", "#7F1D1D"),
        ("Maharashtra College of Eng. & Research", "B.Tech ECE", "60", "58", "AT_CAPACITY", "#10B981", "#064E3B"),
        ("Bangalore Academy of Technology", "B.Tech IT", "90", "75", "NEAR_CAPACITY", "#F59E0B", "#78350F"),
        ("Pune Technical Institute", "B.Tech MECH", "120", "88", "BELOW_CAPACITY", "#3B82F6", "#1E3A8A"),
        ("Chennai Institute of Engineering", "B.Tech AI&DS", "60", "64", "EXCESS_ADMISSION", "#EF4444", "#7F1D1D"),
        ("Hyderabad Institute of Tech", "B.Tech CIVIL", "60", "42", "BELOW_CAPACITY", "#3B82F6", "#1E3A8A"),
        ("Kolkata Engineering College", "B.Tech CSE", "180", "179", "AT_CAPACITY", "#10B981", "#064E3B")
    ]
    ry = ty + 36
    for inst, crs, apprv, enr, st, st_color, st_bg in rows:
        draw.text((48, ry + 6), inst[:32], fill="#F8FAFC", font=f_small)
        draw.text((310, ry + 6), crs, fill="#CBD5E1", font=f_small)
        draw.text((440, ry + 6), apprv, fill="#F8FAFC", font=f_small)
        draw.text((510, ry + 6), enr, fill="#F8FAFC", font=f_bold)
        # Badge
        draw.rounded_rectangle([(565, ry + 3), (24 + lw - 20, ry + 25)], radius=4, fill=st_bg, outline=st_color)
        draw.text((575, ry + 6), st, fill=st_color, font=f_small)
        ry += 38

    # Right Box: Dual-Enrolment & Anomaly Alerts
    rx = 24 + lw + 16
    rw = w - rx - 24
    draw.rounded_rectangle([(rx, ly), (rx + rw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((rx + 16, ly + 16), "10-Point Validation & Alerts", fill="#F8FAFC", font=f_bold)
    draw.text((rx + 16, ly + 36), "Explainable Anomaly & Fraud Engine", fill="#94A3B8", font=f_small)

    alerts = [
        ("\U0001F6A8 Multi-Institution Dual Enrolment", "Aadhaar/APAAR match found in 2 concurrent institutions for AY 2024-25.", "#EF4444", "#7F1D1D"),
        ("\u26A0 Intake Exceeded Alert: DITS CSE", "Actual enrolment (128) exceeds AICTE approved intake capacity (120).", "#F59E0B", "#78350F"),
        ("\u2705 Verhoeff Checksum Validated", "1,180 Student APAAR IDs cryptographically verified via format check.", "#10B981", "#064E3B"),
        ("\U0001F4AC AI Regulatory Assistant Active", "AICTE Officers query compliance, anomalies & exports via conversational NLP.", "#38BDF8", "#0369A1")
    ]
    ay = ly + 64
    for a_title, a_desc, a_col, a_bg in alerts:
        draw.rounded_rectangle([(rx + 12, ay), (rx + rw - 12, ay + 78)], radius=6, fill=a_bg, outline=a_col)
        draw.text((rx + 20, ay + 8), a_title, fill=a_col, font=f_bold)
        # Wrap description
        draw.text((rx + 20, ay + 32), a_desc[:58], fill="#F1F5F9", font=f_small)
        if len(a_desc) > 58:
            draw.text((rx + 20, ay + 48), a_desc[58:], fill="#F1F5F9", font=f_small)
        ay += 90

    out_path = "prototype_dashboard_screenshot.png"
    img.save(out_path)
    print("Saved", out_path)

def create_mobile_verification_screenshot():
    w, h = 1200, 680
    img = Image.new("RGB", (w, h), "#0B1120")
    draw = ImageDraw.Draw(img)

    f_title = get_font("segoeuib.ttf", 22)
    f_bold = get_font("segoeuib.ttf", 14)
    f_regular = get_font("segoeui.ttf", 12)
    f_small = get_font("segoeui.ttf", 10)
    f_stat_num = get_font("segoeuib.ttf", 26)

    # 1. Browser Title Bar
    draw.rectangle([(0, 0), (w, 36)], fill="#1E293B")
    draw.ellipse([(14, 12), (24, 22)], fill="#EF4444")
    draw.ellipse([(32, 12), (42, 22)], fill="#F59E0B")
    draw.ellipse([(50, 12), (60, 22)], fill="#10B981")
    draw.rounded_rectangle([(180, 6), (w - 180, 30)], radius=6, fill="#0F172A", outline="#334155")
    draw.text((200, 9), "https://apaar-vault.aicte.gov.in/verify  (Zero-Knowledge Public Verification Portal)", fill="#94A3B8", font=f_small)

    # 2. Left Side: Student Digital APAAR ID Card
    draw.rounded_rectangle([(40, 60), (560, 650)], radius=12, fill="#1E293B", outline="#3B82F6", width=2)
    draw.text((64, 80), "Student Digital Academic Identity", fill="#38BDF8", font=f_title)
    draw.text((64, 114), "Self-Service Portal & Verifiable Credential", fill="#94A3B8", font=f_small)

    # Student Card Visual
    card_top = 145
    draw.rounded_rectangle([(64, card_top), (536, card_top + 460)], radius=12, fill="#0F172A", outline="#1E3A8A", width=2)
    
    # Header strip inside card
    draw.rounded_rectangle([(64, card_top), (536, card_top + 60)], radius=12, fill="#1E3A8A")
    draw.text((80, card_top + 18), "MINISTRY OF EDUCATION \u2022 APAAR-VAULT", fill="#93C5FD", font=f_bold)
    draw.text((430, card_top + 18), "\u2705 VERIFIED", fill="#10B981", font=f_bold)

    # Student Details
    sy = card_top + 80
    details = [
        ("Student Name:", "Rahul Sharma"),
        ("APAAR ID:", "9284 3194 0192 9821"),
        ("Institution:", "Delhi Institute of Tech. & Science"),
        ("Course / Degree:", "B.Tech Computer Science & Eng."),
        ("Academic Year:", "2023 \u2014 2027 (Active)"),
        ("Enrolment Status:", "REGULAR_FULL_TIME"),
        ("Cryptographic Seal:", "SHA-256 (AICTE Tamper-Proof)")
    ]
    for label, val in details:
        draw.text((84, sy), label, fill="#94A3B8", font=f_small)
        draw.text((220, sy), val, fill="#F8FAFC" if "APAAR" not in label else "#38BDF8", font=f_bold if "APAAR" in label else f_regular)
        sy += 36

    # Bottom badge
    draw.rounded_rectangle([(84, card_top + 370), (516, card_top + 440)], radius=8, fill="#064E3B", outline="#10B981")
    draw.text((100, card_top + 382), "\U0001F6E1 Cryptographically Signed by AICTE Registry", fill="#A7F3D0", font=f_bold)
    draw.text((100, card_top + 406), "Authenticity guaranteed. Tamper-evident hash logged in audit trail.", fill="#D1FAE5", font=f_small)

    # 3. Right Side: Public Verification & QR Scanner
    rx = 600
    rw = w - rx - 40
    draw.rounded_rectangle([(rx, 60), (rx + rw, 650)], radius=12, fill="#1E293B", outline="#10B981", width=2)
    draw.text((rx + 24, 80), "Zero-Knowledge Public Verification", fill="#10B981", font=f_title)
    draw.text((rx + 24, 114), "Instant third-party employer verification with zero PII leakage", fill="#94A3B8", font=f_small)

    # Insert mobile_qr.png in center
    qr_path = os.path.abspath("mobile_qr.png")
    if os.path.exists(qr_path):
        qr_img = Image.open(qr_path).resize((180, 180))
        img.paste(qr_img, (rx + (rw - 180) // 2, 160))

    draw.text((rx + (rw - 280) // 2, 355), "\U0001F4F1 SCAN TO VERIFY CREDENTIAL", fill="#F8FAFC", font=f_bold)
    draw.text((rx + 36, 385), "Scan this secure QR code using any smartphone camera or QR reader.", fill="#94A3B8", font=f_small)
    draw.text((rx + 42, 405), "Directly connects to AICTE verification endpoint to confirm enrollment.", fill="#94A3B8", font=f_small)

    # Verification Result Card
    vy = 435
    draw.rounded_rectangle([(rx + 24, vy), (rx + rw - 24, vy + 185)], radius=8, fill="#0F172A", outline="#334155")
    draw.text((rx + 40, vy + 16), "Verification Result Preview:", fill="#38BDF8", font=f_bold)
    
    v_results = [
        ("Cryptographic Proof:", "VALID (Matches Registry Ledger)"),
        ("APAAR ID Status:", "ACTIVE & ACCREDITED"),
        ("Institution Approval:", "AICTE Approved Ref: AICTE/2024/NORTH/001"),
        ("PII Protection:", "Zero Personal Identifiers Exposed")
    ]
    vy_sub = vy + 46
    for k, v in v_results:
        draw.text((rx + 40, vy_sub), k, fill="#94A3B8", font=f_small)
        draw.text((rx + 180, vy_sub), v, fill="#10B981" if "VALID" in v or "ACTIVE" in v else "#F8FAFC", font=f_bold if "VALID" in v else f_small)
        vy_sub += 28

    out_path = "prototype_mobile_verification_screenshot.png"
    img.save(out_path)
    print("Saved", out_path)

def create_hub_architecture_image():
    w, h = 800, 760
    img = Image.new("RGB", (w, h), "#0F172A")
    draw = ImageDraw.Draw(img)

    f_title = get_font("segoeuib.ttf", 20)
    f_header = get_font("segoeuib.ttf", 15)
    f_bold = get_font("segoeuib.ttf", 12)
    f_regular = get_font("segoeui.ttf", 11)
    f_small = get_font("segoeui.ttf", 9.5)

    # Outer container border
    draw.rounded_rectangle([(10, 10), (w - 10, h - 10)], radius=16, fill="#0B1120", outline="#38BDF8", width=2)

    # Title Pill
    draw.rounded_rectangle([(180, 24), (w - 180, 70)], radius=10, fill="#1E293B", outline="#0EA5E9", width=2)
    draw.text((215, 36), "APAAR-VAULT CORE PLATFORM", fill="#38BDF8", font=f_title)

    # Subtitle
    draw.text((230, 78), "Centralized AICTE Verification & Security Engine", fill="#94A3B8", font=f_small)

    # 1. Top Section: Data Ingestion
    draw.rounded_rectangle([(40, 110), (w - 40, 210)], radius=10, fill="#1E293B", outline="#3B82F6", width=1)
    draw.text((60, 122), "\U0001F4E5 INSTITUTION DATA INGESTION TIER", fill="#60A5FA", font=f_header)
    ingestion_items = [
        ("\u2022 Bulk CSV/XLSX Ingestion", "Automated header & schema validation"),
        ("\u2022 Secure Institution REST API", "Multi-tenant authenticated submission"),
        ("\u2022 Student Pre-Validation Gate", "Immediate client-side error detection")
    ]
    iy = 150
    for title, desc in ingestion_items:
        draw.text((70, iy), title, fill="#F8FAFC", font=f_bold)
        draw.text((290, iy), desc, fill="#94A3B8", font=f_regular)
        iy += 18

    # Arrow Down 1
    draw.polygon([(w//2 - 12, 220), (w//2 + 12, 220), (w//2, 238)], fill="#38BDF8")

    # 2. Middle Section: Core Rule & Checksum Engine (Prominent Gold/Orange Border)
    draw.rounded_rectangle([(40, 248), (w - 40, 480)], radius=12, fill="#172554", outline="#F59E0B", width=2)
    draw.text((60, 262), "\u2699\uFE0F 10-POINT VALIDATION & ANOMALY ENGINE", fill="#FBBF24", font=f_title)
    draw.text((60, 290), "Explainable rule engine executing real-time integrity verification", fill="#BAE6FD", font=f_small)

    engine_boxes = [
        ("Verhoeff & Luhn Checksum", "Mathematical validation of 12-digit APAAR & Aadhaar IDs", "#10B981", "#064E3B"),
        ("Multi-Campus Duplicate Detector", "Flags cross-institutional concurrent enrolments instantly", "#EF4444", "#7F1D1D"),
        ("Approved Intake Quota Monitor", "Tracks department seats against official AICTE sanction limits", "#F59E0B", "#78350F"),
        ("SHA-256 Tamper-Proof Seal", "Cryptographic ledger hash locking record authenticity", "#38BDF8", "#0369A1")
    ]
    ey = 315
    for b_title, b_desc, b_col, b_bg in engine_boxes:
        draw.rounded_rectangle([(60, ey), (w - 60, ey + 34)], radius=6, fill=b_bg, outline=b_col)
        draw.text((75, ey + 8), b_title, fill=b_col, font=f_bold)
        draw.text((330, ey + 8), b_desc, fill="#F8FAFC", font=f_small)
        ey += 39

    # Arrow Down 2
    draw.polygon([(w//2 - 12, 490), (w//2 + 12, 490), (w//2, 508)], fill="#10B981")

    # 3. Bottom Section: Split Delivery Tier (AICTE Regulatory + Student & Public)
    # Left Sub-block: AICTE Command
    bx1, bx2 = 40, w//2 - 10
    draw.rounded_rectangle([(bx1, 518), (bx2, 730)], radius=10, fill="#1E293B", outline="#3B82F6", width=1)
    draw.text((bx1 + 16, 532), "\U0001F3DB\uFE0F AICTE REGULATORY DESK", fill="#93C5FD", font=f_header)
    aicte_items = [
        "\u2022 Real-time Seat Quota Monitoring",
        "\u2022 Over-Enrolment & Ghost Alerts",
        "\u2022 Human-in-Loop Correction Desk",
        "\u2022 Conversational AI Regulatory NLP",
        "\u2022 National Accreditation Reporting"
    ]
    ay = 562
    for itm in aicte_items:
        draw.text((bx1 + 16, ay), itm, fill="#E2E8F0", font=f_small)
        ay += 32

    # Right Sub-block: Student Vault & QR
    bx3, bx4 = w//2 + 10, w - 40
    draw.rounded_rectangle([(bx3, 518), (bx4, 730)], radius=10, fill="#1E293B", outline="#10B981", width=1)
    draw.text((bx3 + 16, 532), "\U0001F393 STUDENT & PUBLIC VAULT", fill="#6EE7B7", font=f_header)
    student_items = [
        "\u2022 Self-Service Digital APAAR Card",
        "\u2022 High-Density Cryptographic QR",
        "\u2022 Instant Verification (Zero PII)",
        "\u2022 Offline Fallback Token Cache",
        "\u2022 DigiLocker & ABC Data Mobility"
    ]
    sy = 562
    for itm in student_items:
        draw.text((bx3 + 16, sy), itm, fill="#E2E8F0", font=f_small)
        sy += 32

    out_path = "prototype_hub_architecture.png"
    img.save(out_path)
    print("Saved", out_path)

def create_audit_security_screenshot():
    w, h = 1200, 680
    img = Image.new("RGB", (w, h), "#0B1120")
    draw = ImageDraw.Draw(img)

    f_title = get_font("segoeuib.ttf", 22)
    f_bold = get_font("segoeuib.ttf", 14)
    f_regular = get_font("segoeui.ttf", 12)
    f_small = get_font("segoeui.ttf", 10)
    f_tiny = get_font("segoeui.ttf", 9)
    f_stat_num = get_font("segoeuib.ttf", 24)

    # 1. Browser Title Bar
    draw.rectangle([(0, 0), (w, 36)], fill="#1E293B")
    draw.ellipse([(14, 12), (24, 22)], fill="#EF4444")
    draw.ellipse([(32, 12), (42, 22)], fill="#F59E0B")
    draw.ellipse([(50, 12), (60, 22)], fill="#10B981")
    draw.rounded_rectangle([(180, 6), (w - 180, 30)], radius=6, fill="#0F172A", outline="#334155")
    draw.text((200, 9), "https://apaar-vault.aicte.gov.in/audit  (Cryptographic Audit Trail & Intake Correction Engine)", fill="#94A3B8", font=f_small)

    # 2. Header
    draw.rectangle([(0, 36), (w, 96)], fill="#0F172A", outline="#1E293B")
    draw.text((24, 46), "APAAR-VAULT \u2022 AUDIT LEDGER & CORRECTION DESK", fill="#38BDF8", font=f_title)
    draw.text((24, 74), "Tamper-Evident SHA-256 Event Logging & Human-in-the-Loop Dispute Resolution", fill="#94A3B8", font=f_small)

    # Security Badge top right
    draw.rounded_rectangle([(w - 270, 50), (w - 24, 82)], radius=6, fill="#064E3B", outline="#10B981")
    draw.text((w - 255, 58), "\U0001F6E1 DPDP Act 2023 Compliant", fill="#A7F3D0", font=f_bold)

    # 3. Main Content: Left = Audit Trail (w=680), Right = Correction Request Workflow (w=460)
    # Left: Audit Trail
    ly = 112
    lh = 540
    lw = 680
    draw.rounded_rectangle([(24, ly), (24 + lw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((40, ly + 16), "Tamper-Evident Blockchain-Style Audit Ledger", fill="#F8FAFC", font=f_bold)
    draw.text((40, ly + 36), "Cryptographically signed SHA-256 transaction log guaranteeing immutable accountability", fill="#94A3B8", font=f_small)

    # Audit Table Header
    ty = ly + 64
    draw.rectangle([(36, ty), (24 + lw - 12, ty + 28)], fill="#0F172A")
    draw.text((48, ty + 6), "Timestamp", fill="#94A3B8", font=f_small)
    draw.text((150, ty + 6), "Event / Action", fill="#94A3B8", font=f_small)
    draw.text((360, ty + 6), "Target Record", fill="#94A3B8", font=f_small)
    draw.text((490, ty + 6), "SHA-256 Hash", fill="#94A3B8", font=f_small)
    draw.text((615, ty + 6), "Status", fill="#94A3B8", font=f_small)

    audit_logs = [
        ("13:24:12", "BULK_DATA_INGESTION", "DITS CSE (128 Records)", "e3b0c442...98b1", "VERIFIED", "#10B981", "#064E3B"),
        ("13:24:18", "CHECKSUM_VALIDATION", "APAAR: 9284-3194-0192", "8f4b12aa...77c2", "PASSED", "#10B981", "#064E3B"),
        ("13:24:22", "DUAL_ENROLMENT_FLAG", "Aadhaar: ****-****-4821", "2c5a910d...11fe", "ALERT", "#EF4444", "#7F1D1D"),
        ("13:24:45", "QUOTA_EXCEEDED_ALERT", "AICTE Capacity: 120/128", "99e120da...33aa", "ALERT", "#F59E0B", "#78350F"),
        ("13:25:01", "CORRECTION_PROPOSED", "Roll No: DITS-2024-042", "7a1b02ee...44cb", "PENDING", "#38BDF8", "#0369A1"),
        ("13:25:30", "PUBLIC_QR_VERIFIED", "Zero-PII Token Query", "4d88e1bc...99fa", "VERIFIED", "#10B981", "#064E3B"),
        ("13:26:00", "LEDGER_SEAL_LOCKED", "Block #10842 Merkle Root", "a1b2c3d4...ef01", "SEALED", "#8B5CF6", "#4C1D95")
    ]
    ay = ty + 36
    for tstamp, ev, rec, hsh, st, st_col, st_bg in audit_logs:
        draw.text((48, ay + 6), tstamp, fill="#94A3B8", font=f_small)
        draw.text((150, ay + 6), ev[:22], fill="#F8FAFC", font=f_bold)
        draw.text((360, ay + 6), rec[:18], fill="#CBD5E1", font=f_small)
        draw.text((490, ay + 6), hsh, fill="#38BDF8", font=f_tiny)
        # Badge
        draw.rounded_rectangle([(605, ay + 3), (24 + lw - 20, ay + 24)], radius=4, fill=st_bg, outline=st_col)
        draw.text((612, ay + 5), st, fill=st_col, font=f_tiny)
        ay += 46

    # Bottom Seal Info
    draw.rounded_rectangle([(40, ly + lh - 54), (24 + lw - 16, ly + lh - 14)], radius=6, fill="#0F172A", outline="#1E3A8A")
    draw.text((54, ly + lh - 44), "\U0001F510 Merkle Tree Integrity: Zero unverified mutations detected in historical logs (Total 18,420 events)", fill="#93C5FD", font=f_small)

    # Right: Dispute Resolution & Correction Desk
    rx = 24 + lw + 16
    rw = w - rx - 24
    draw.rounded_rectangle([(rx, ly), (rx + rw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((rx + 16, ly + 16), "Discrepancy Resolution Desk", fill="#F8FAFC", font=f_bold)
    draw.text((rx + 16, ly + 36), "Human-in-the-loop review for flagged student records", fill="#94A3B8", font=f_small)

    # Flagged Ticket Card
    draw.rounded_rectangle([(rx + 16, ly + 64), (rx + rw - 16, ly + 290)], radius=8, fill="#0F172A", outline="#EF4444", width=1)
    draw.rounded_rectangle([(rx + 16, ly + 64), (rx + rw - 16, ly + 96)], radius=8, fill="#7F1D1D")
    draw.text((rx + 28, ly + 72), "\U0001F6A8 CASE #CR-2026-092: DUAL ENROLMENT", fill="#FECACA", font=f_bold)

    ticket_details = [
        ("Student Name:", "Priya Narang"),
        ("APAAR ID:", "8812-4091-8821-3310"),
        ("Campus A (Admitted):", "Delhi Institute of Technology"),
        ("Campus B (Concurrent):", "Maharashtra College of Eng."),
        ("Scholarship Claim:", "AICTE Pragati Scheme (Duplicate)"),
        ("Recommended Action:", "Seat cancellation in Campus B")
    ]
    ty = ly + 104
    for k, v in ticket_details:
        draw.text((rx + 28, ty), k, fill="#94A3B8", font=f_small)
        draw.text((rx + 175, ty), v[:26], fill="#F8FAFC" if "Duplicate" not in v else "#EF4444", font=f_bold if "Duplicate" in v else f_small)
        ty += 24

    # Action Buttons
    draw.rounded_rectangle([(rx + 28, ty + 8), (rx + 210, ty + 38)], radius=6, fill="#064E3B", outline="#10B981")
    draw.text((rx + 42, ty + 16), "\u2705 Accept Campus A", fill="#A7F3D0", font=f_small)

    draw.rounded_rectangle([(rx + 225, ty + 8), (rx + rw - 28, ty + 38)], radius=6, fill="#7F1D1D", outline="#EF4444")
    draw.text((rx + 240, ty + 16), "\u274C Reject Campus B", fill="#FECACA", font=f_small)

    # Lower Box: System Health & Resiliency
    ry2 = ly + 310
    draw.rounded_rectangle([(rx + 16, ry2), (rx + rw - 16, ly + lh - 14)], radius=8, fill="#0F172A", outline="#10B981", width=1)
    draw.text((rx + 28, ry2 + 14), "\U0001F6E1 Production Resiliency & Security", fill="#34D399", font=f_bold)

    resilience_items = [
        ("\u2022 Containerized Docker Stack:", "Stateless FastAPI async worker pools"),
        ("\u2022 Zero-Downtime Sandbox:", "Pluggable offline simulator during API maintenance"),
        ("\u2022 Data Privacy by Design:", "Aadhaar hashing before database insertion"),
        ("\u2022 Multi-Tenant RBAC:", "AICTE SuperAdmin, Campus Registrar, Verifier")
    ]
    r_y = ry2 + 40
    for label, desc in resilience_items:
        draw.text((rx + 28, r_y), label, fill="#F8FAFC", font=f_small)
        draw.text((rx + 28, r_y + 16), desc, fill="#94A3B8", font=f_tiny)
        r_y += 38

    out_path = "prototype_audit_security_screenshot.png"
    img.save(out_path)
    print("Saved", out_path)

def create_impact_analytics_screenshot():
    w, h = 1200, 680
    img = Image.new("RGB", (w, h), "#0B1120")
    draw = ImageDraw.Draw(img)

    f_title = get_font("segoeuib.ttf", 22)
    f_header = get_font("segoeuib.ttf", 15)
    f_bold = get_font("segoeuib.ttf", 14)
    f_regular = get_font("segoeui.ttf", 12)
    f_small = get_font("segoeui.ttf", 10)
    f_tiny = get_font("segoeui.ttf", 9)
    f_stat_num = get_font("segoeuib.ttf", 26)

    # 1. Browser Title Bar
    draw.rectangle([(0, 0), (w, 36)], fill="#1E293B")
    draw.ellipse([(14, 12), (24, 22)], fill="#EF4444")
    draw.ellipse([(32, 12), (42, 22)], fill="#F59E0B")
    draw.ellipse([(50, 12), (60, 22)], fill="#10B981")
    draw.rounded_rectangle([(180, 6), (w - 180, 30)], radius=6, fill="#0F172A", outline="#334155")
    draw.text((200, 9), "https://apaar-vault.aicte.gov.in/analytics  (AICTE National Impact & Compliance Analytics)", fill="#94A3B8", font=f_small)

    # 2. Header
    draw.rectangle([(0, 36), (w, 96)], fill="#0F172A", outline="#1E293B")
    draw.text((24, 46), "AICTE REGULATORY IMPACT & NATIONWIDE ANALYTICS", fill="#38BDF8", font=f_title)
    draw.text((24, 74), "Measurable improvements in quota adherence, fraud prevention, and academic record transparency", fill="#94A3B8", font=f_small)

    # 3. 4 Top Impact KPI Cards
    card_y = 112
    card_h = 92
    card_w = (w - 48 - 36) // 4
    impact_stats = [
        ("Ghost Enrolments", "0%", "100% Elimination via Checksum", "#10B981", "#064E3B"),
        ("Verification Speed", "< 1.2s", "80% Time Reduction vs Manual", "#38BDF8", "#0369A1"),
        ("Data Quality Index", "98.6%", "Audited Across 12 Pilot Campuses", "#8B5CF6", "#4C1D95"),
        ("Rollout Readiness", "100%", "Full DPDP Act & AICTE Aligned", "#F59E0B", "#78350F")
    ]
    for i, (title, num, sub, accent, bg) in enumerate(impact_stats):
        cx = 24 + i * (card_w + 12)
        draw.rounded_rectangle([(cx, card_y), (cx + card_w, card_y + card_h)], radius=8, fill="#1E293B", outline=accent, width=1)
        draw.text((cx + 16, card_y + 10), title, fill="#94A3B8", font=f_small)
        draw.text((cx + 16, card_y + 28), num, fill=accent, font=f_stat_num)
        draw.text((cx + 16, card_y + 68), sub, fill="#CBD5E1", font=f_tiny)

    # 4. Main Section: Left = Intake Quota Utilization Chart (w=680), Right = Trust & Mobility Metrics (w=460)
    ly = 218
    lh = 440
    lw = 680
    draw.rounded_rectangle([(24, ly), (24 + lw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((40, ly + 16), "Campus Intake Quota Adherence Analysis", fill="#F8FAFC", font=f_bold)
    draw.text((40, ly + 36), "Comparison of approved AICTE student intake limits vs. validated enrolments", fill="#94A3B8", font=f_small)

    # Bar chart
    campuses = [
        ("Delhi Inst. of Tech (DITS)", 120, 128, "OVER-CAPACITY (FLAGGED)", "#EF4444"),
        ("Maharashtra College (MEIT)", 60, 58, "COMPLIANT (97%)", "#10B981"),
        ("Bangalore Academy (BATS)", 90, 75, "COMPLIANT (83%)", "#10B981"),
        ("Pune Technical Inst (PIET)", 120, 88, "UNDER-CAPACITY (73%)", "#3B82F6"),
        ("Chennai Institute (CIET)", 60, 64, "EXCESS SEATS (FLAGGED)", "#EF4444"),
        ("Hyderabad Tech (HITS)", 60, 42, "COMPLIANT (70%)", "#3B82F6")
    ]
    cy = ly + 70
    for name, approved, enrolled, status, col in campuses:
        draw.text((40, cy), name, fill="#F8FAFC", font=f_small)
        draw.text((40, cy + 16), f"Sanctioned: {approved} | Enrolled: {enrolled}  \u2014  {status}", fill=col, font=f_tiny)
        
        # Draw background bar (Approved = 100%)
        bar_x = 420
        bar_max_w = 230
        draw.rounded_rectangle([(bar_x, cy + 4), (bar_x + bar_max_w, cy + 22)], radius=4, fill="#0F172A", outline="#334155")
        
        # Enrolled bar
        fill_w = min(int((enrolled / 140) * bar_max_w), bar_max_w)
        draw.rounded_rectangle([(bar_x, cy + 4), (bar_x + fill_w, cy + 22)], radius=4, fill=col)
        draw.text((bar_x + bar_max_w + 10, cy + 4), f"{int((enrolled/approved)*100)}%", fill="#CBD5E1", font=f_tiny)
        cy += 58

    # Right: Nationwide Scale & Digital Trust Metrics
    rx = 24 + lw + 16
    rw = w - rx - 24
    draw.rounded_rectangle([(rx, ly), (rx + rw, ly + lh)], radius=8, fill="#1E293B", outline="#334155")
    draw.text((rx + 16, ly + 16), "Academic Mobility & Digital Trust", fill="#F8FAFC", font=f_bold)
    draw.text((rx + 16, ly + 36), "Key operational dividends delivered to AICTE & universities", fill="#94A3B8", font=f_small)

    dividends = [
        ("\U0001F6E1 Zero-Knowledge Public Verification", "14,280 Employer & University credential checks completed with 0% PII leak.", "#10B981", "#064E3B"),
        ("\U0001F50D Cross-Campus Fraud Interception", "48 Dual enrolments and duplicate scholarship claims identified before approval.", "#EF4444", "#7F1D1D"),
        ("\u26A1 Academic Bank of Credits (ABC) Sync", "100% interoperability with DigiLocker national academic repository standard.", "#38BDF8", "#0369A1"),
        ("\U0001F4C8 80% Administrative Inspection Savings", "Automated 10-point audits replace manual paper-based spot verifications.", "#F59E0B", "#78350F")
    ]
    dy = ly + 68
    for d_title, d_desc, d_col, d_bg in dividends:
        draw.rounded_rectangle([(rx + 14, dy), (rx + rw - 14, dy + 76)], radius=6, fill=d_bg, outline=d_col)
        draw.text((rx + 22, dy + 8), d_title, fill=d_col, font=f_bold)
        # 2 lines desc
        draw.text((rx + 22, dy + 32), d_desc[:55], fill="#F1F5F9", font=f_small)
        if len(d_desc) > 55:
            draw.text((rx + 22, dy + 48), d_desc[55:], fill="#F1F5F9", font=f_small)
        dy += 88

    out_path = "prototype_impact_analytics_screenshot.png"
    img.save(out_path)
    print("Saved", out_path)

if __name__ == '__main__':
    create_dashboard_screenshot()
    create_mobile_verification_screenshot()
    create_hub_architecture_image()
    create_audit_security_screenshot()
    create_impact_analytics_screenshot()

