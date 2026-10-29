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

if __name__ == '__main__':
    create_dashboard_screenshot()
    create_mobile_verification_screenshot()
