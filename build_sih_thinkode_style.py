import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    prs = Presentation()
    prs.slide_width = Emu(12192000)   # 16:9 widescreen (13.333 inches)
    prs.slide_height = Emu(6858000)  # 7.5 inches

    # Color Palette matching Thinkode sample
    BG_WARM = RGBColor(253, 250, 246)       # Soft warm off-white #FDFBF6
    NAVY = RGBColor(16, 42, 77)             # #102A4D
    RUST = RGBColor(169, 50, 38)            # Thinkode dark red/rust #A93226
    ORANGE = RGBColor(230, 81, 0)           # SIH Orange #E65100
    AMBER = RGBColor(243, 156, 18)          # Amber #F39C12
    BLUE = RGBColor(41, 128, 185)           # Accent Blue #2980B9
    DARK_TEXT = RGBColor(33, 37, 41)
    MUTED_TEXT = RGBColor(100, 116, 139)
    WHITE = RGBColor(255, 255, 255)
    
    CARD_BG_WARM = RGBColor(255, 248, 240)  # #FFF8F0
    CARD_BG_BLUE = RGBColor(235, 245, 251)  # #EBF5FB
    CARD_BG_AMBER = RGBColor(254, 249, 231) # #FEF9E7

    # Assets
    sih_bulb = os.path.abspath("sih_bulb_logo.png")
    sih_header = os.path.abspath("sih_header_logo.png")
    dash_shot = os.path.abspath("prototype_dashboard_screenshot.png")
    qr_shot = os.path.abspath("prototype_mobile_verification_screenshot.png")
    blank_layout = prs.slide_layouts[6]

    def add_common_header(slide, title_text, slide_number):
        # 1. Background fill
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Emu(12192000), Emu(6858000))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_WARM
        bg.line.fill.background()

        # 2. Team script logo top-left
        team_box = slide.shapes.add_textbox(Emu(360000), Emu(140000), Emu(2500000), Emu(600000))
        tp = team_box.text_frame.paragraphs[0]
        tp.text = "Byte codx"
        tp.font.name = "Georgia"
        tp.font.italic = True
        tp.font.bold = True
        tp.font.size = Pt(24)
        tp.font.color.rgb = RUST

        # 3. Slide Title
        title_box = slide.shapes.add_textbox(Emu(2800000), Emu(140000), Emu(6600000), Emu(650000))
        ttp = title_box.text_frame.paragraphs[0]
        ttp.text = title_text
        ttp.font.name = "Calibri"
        ttp.font.bold = True
        ttp.font.size = Pt(24)
        ttp.font.color.rgb = NAVY
        ttp.alignment = PP_ALIGN.CENTER

        # 4. SIH Header Logo top-right
        if os.path.exists(sih_header):
            slide.shapes.add_picture(sih_header, Emu(9900000), Emu(80000), width=Emu(1900000))

        # 5. Footer strip
        footer_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Emu(6420000), Emu(12192000), Emu(438000))
        footer_bar.fill.solid()
        footer_bar.fill.fore_color.rgb = NAVY
        footer_bar.line.fill.background()

        footer_text = slide.shapes.add_textbox(Emu(4400000), Emu(6440000), Emu(3400000), Emu(380000))
        ftp = footer_text.text_frame.paragraphs[0]
        ftp.text = "@SIH Idea submission- Template"
        ftp.font.name = "Calibri"
        ftp.font.size = Pt(10)
        ftp.font.color.rgb = WHITE
        ftp.alignment = PP_ALIGN.CENTER

        slide_num_box = slide.shapes.add_textbox(Emu(11200000), Emu(6440000), Emu(600000), Emu(380000))
        snp = slide_num_box.text_frame.paragraphs[0]
        snp.text = str(slide_number)
        snp.font.name = "Calibri"
        snp.font.size = Pt(10)
        snp.font.color.rgb = WHITE
        snp.alignment = PP_ALIGN.RIGHT

    # =========================================================================
    # SLIDE 1: TITLE PAGE
    # =========================================================================
    slide1 = prs.slides.add_slide(blank_layout)
    bg1 = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Emu(12192000), Emu(6858000))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = BG_WARM
    bg1.line.fill.background()

    # Title Banner
    t1_box = slide1.shapes.add_textbox(Emu(1500000), Emu(300000), Emu(9192000), Emu(700000))
    t1p = t1_box.text_frame.paragraphs[0]
    t1p.text = "SMART INDIA HACKATHON 2026"
    t1p.font.name = "Calibri"
    t1p.font.bold = True
    t1p.font.size = Pt(32)
    t1p.font.color.rgb = NAVY
    t1p.alignment = PP_ALIGN.CENTER

    sub1_box = slide1.shapes.add_textbox(Emu(1500000), Emu(1050000), Emu(9192000), Emu(550000))
    s1p = sub1_box.text_frame.paragraphs[0]
    s1p.text = "Team \u2013 Byte codx"
    s1p.font.name = "Georgia"
    s1p.font.bold = True
    s1p.font.size = Pt(26)
    s1p.font.color.rgb = RUST
    s1p.alignment = PP_ALIGN.CENTER

    # Left Column: Project Details
    info_box = slide1.shapes.add_textbox(Emu(600000), Emu(1800000), Emu(7200000), Emu(3200000))
    itf = info_box.text_frame
    itf.word_wrap = True

    details = [
        ("\u2022 Problem Statement ID:", "26263"),
        ("\u2022 Problem Statement Title:", "Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions"),
        ("\u2022 Theme:", "Smart Automation"),
        ("\u2022 PS Category- Software/Hardware:", "Software"),
        ("\u2022 Team ID:", "199199"),
        ("\u2022 Team Name:", "Byte codx")
    ]
    for i, (label, val) in enumerate(details):
        p = itf.paragraphs[0] if i == 0 else itf.add_paragraph()
        p.space_after = Pt(8)
        run_lbl = p.add_run()
        run_lbl.text = label + " "
        run_lbl.font.name = "Calibri"
        run_lbl.font.bold = True
        run_lbl.font.size = Pt(13.5)
        run_lbl.font.color.rgb = NAVY

        run_val = p.add_run()
        run_val.text = val
        run_val.font.name = "Calibri"
        run_val.font.size = Pt(13)
        run_val.font.color.rgb = DARK_TEXT

    # Links Callout Box on Slide 1 (Bottom Left)
    link_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(600000), Emu(5200000), Emu(6800000), Emu(1150000))
    link_card.fill.solid()
    link_card.fill.fore_color.rgb = CARD_BG_WARM
    link_card.line.color.rgb = ORANGE
    link_card.line.width = Pt(1.5)
    ltf = link_card.text_frame
    ltf.word_wrap = True

    lp0 = ltf.paragraphs[0]
    lp0.space_after = Pt(4)
    r0_lbl = lp0.add_run()
    r0_lbl.text = "\u25B6 Prototype Video: "
    r0_lbl.font.name = "Calibri"
    r0_lbl.font.bold = True
    r0_lbl.font.size = Pt(11)
    r0_lbl.font.color.rgb = RUST
    r0_link = lp0.add_run()
    r0_link.text = "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"
    r0_link.font.name = "Calibri"
    r0_link.font.bold = True
    r0_link.font.size = Pt(11)
    r0_link.font.color.rgb = RGBColor(0, 102, 204)
    r0_link.font.underline = True
    r0_link.hyperlink.address = "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"

    lp1 = ltf.add_paragraph()
    r1_lbl = lp1.add_run()
    r1_lbl.text = "\u25B6 GitHub Repository: "
    r1_lbl.font.name = "Calibri"
    r1_lbl.font.bold = True
    r1_lbl.font.size = Pt(11)
    r1_lbl.font.color.rgb = NAVY
    r1_link = lp1.add_run()
    r1_link.text = "https://github.com/SDP-001/SIH.git"
    r1_link.font.name = "Calibri"
    r1_link.font.bold = True
    r1_link.font.size = Pt(11)
    r1_link.font.color.rgb = RGBColor(0, 102, 204)
    r1_link.font.underline = True
    r1_link.hyperlink.address = "https://github.com/SDP-001/SIH.git"

    # Right Column: Big SIH Bulb Logo
    if os.path.exists(sih_bulb):
        slide1.shapes.add_picture(sih_bulb, Emu(8000000), Emu(1750000), width=Emu(3700000))

    # Watermark signature bottom right
    sign_box = slide1.shapes.add_textbox(Emu(9500000), Emu(5700000), Emu(2300000), Emu(600000))
    sp = sign_box.text_frame.paragraphs[0]
    sp.text = "Byte codx"
    sp.font.name = "Georgia"
    sp.font.italic = True
    sp.font.size = Pt(30)
    sp.font.color.rgb = RUST
    sp.alignment = PP_ALIGN.RIGHT

    # Top-right small SIH logo
    if os.path.exists(sih_header):
        slide1.shapes.add_picture(sih_header, Emu(10000000), Emu(150000), width=Emu(1900000))

    # =========================================================================
    # SLIDE 2: PROPOSED SOLUTION (Mind Map Hub Diagram matching Thinkode p.2)
    # =========================================================================
    slide2 = prs.slides.add_slide(blank_layout)
    add_common_header(slide2, "APAAR-Vault: Student Data Management & Verification Platform", 2)

    # Center Hub Oval
    hub_w = Emu(3400000)
    hub_h = Emu(4900000)
    hub_x = Emu(4396000)
    hub_y = Emu(1150000)
    
    hub = slide2.shapes.add_shape(MSO_SHAPE.OVAL, hub_x, hub_y, hub_w, hub_h)
    hub.fill.solid()
    hub.fill.fore_color.rgb = CARD_BG_WARM
    hub.line.color.rgb = ORANGE
    hub.line.width = Pt(2.5)
    htf = hub.text_frame
    htf.word_wrap = True
    htf.vertical_anchor = MSO_ANCHOR.MIDDLE
    
    hp = htf.paragraphs[0]
    hp.text = "A smart and unique centralized platform to automate student data management, 10-point validation, multi-institution duplicate detection, and intake compliance monitoring for AICTE."
    hp.font.name = "Calibri"
    hp.font.bold = True
    hp.font.size = Pt(14)
    hp.font.color.rgb = NAVY
    hp.alignment = PP_ALIGN.CENTER

    # Left Nodes (7 pills)
    left_nodes = [
        "Institutional Bulk Data Upload",
        "Automated Format & Schema Checks",
        "10-Point Validation Rule Engine",
        "Approved Intake Monitoring",
        "Over-Enrolment Discrepancy Alerts",
        "Institutional Correction Workflows",
        "Tamper-Evident Audit Trails"
    ]
    node_w = Emu(3600000)
    node_h = Emu(580000)
    start_y = Emu(1200000)
    step_y = Emu(710000)
    
    for i, txt in enumerate(left_nodes):
        ny = start_y + i * step_y
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(550000), ny, node_w, node_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = ORANGE
        card.line.width = Pt(1.5)
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
        cp = ctf.paragraphs[0]
        cp.text = txt
        cp.font.name = "Calibri"
        cp.font.bold = True
        cp.font.size = Pt(12)
        cp.font.color.rgb = NAVY
        cp.alignment = PP_ALIGN.CENTER

        # Connector dot on right edge
        dot = slide2.shapes.add_shape(MSO_SHAPE.OVAL, Emu(550000) + node_w - Emu(60000), ny + Emu(210000), Emu(160000), Emu(160000))
        dot.fill.solid()
        dot.fill.fore_color.rgb = ORANGE
        dot.line.fill.background()

    # Right Nodes (7 pills)
    right_nodes = [
        "Verhoeff & Luhn Checksum Checks",
        "Cross-Campus Duplicate Detection",
        "Zero-Knowledge Public Verification",
        "Cryptographic QR Verification",
        "Student Self-Service Vault",
        "AI Regulatory Officer Assistant",
        "Multi-Tenant RBAC Security"
    ]
    right_x = Emu(8042000)
    for i, txt in enumerate(right_nodes):
        ny = start_y + i * step_y
        card = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, right_x, ny, node_w, node_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = ORANGE
        card.line.width = Pt(1.5)
        ctf = card.text_frame
        ctf.word_wrap = True
        ctf.vertical_anchor = MSO_ANCHOR.MIDDLE
        cp = ctf.paragraphs[0]
        cp.text = txt
        cp.font.name = "Calibri"
        cp.font.bold = True
        cp.font.size = Pt(12)
        cp.font.color.rgb = NAVY
        cp.alignment = PP_ALIGN.CENTER

        # Connector dot on left edge
        dot = slide2.shapes.add_shape(MSO_SHAPE.OVAL, right_x - Emu(100000), ny + Emu(210000), Emu(160000), Emu(160000))
        dot.fill.solid()
        dot.fill.fore_color.rgb = ORANGE
        dot.line.fill.background()

    # =========================================================================
    # SLIDE 3: TECHNICAL APPROACH (Web App + Dashboard Screenshot)
    # =========================================================================
    slide3 = prs.slides.add_slide(blank_layout)
    add_common_header(slide3, "TECHNICAL APPROACH", 3)

    # Left Column: Web Application Architecture (w=5,200,000)
    left_card = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(550000), Emu(1150000), Emu(5100000), Emu(5050000))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = WHITE
    left_card.line.color.rgb = RUST
    left_card.line.width = Pt(2)
    
    ltf = left_card.text_frame
    ltf.word_wrap = True
    
    # Header inside card
    p_head = ltf.paragraphs[0]
    p_head.text = "Web Application (AICTE & Institution Portal)"
    p_head.font.name = "Calibri"
    p_head.font.bold = True
    p_head.font.size = Pt(14)
    p_head.font.color.rgb = RUST
    p_head.font.underline = True
    p_head.space_after = Pt(8)

    tech_items = [
        ("Frontend: ", "Next.js 16 (React 19) + Tailwind CSS v4"),
        ("Auth & RBAC: ", "JWT Authentication + Multi-Tenant RBAC"),
        ("Backend: ", "FastAPI (Python 3.12) + Uvicorn Async"),
        ("Validation Pipeline: ", "10-Point Rule Engine (Aadhaar/APAAR Checksum, Format, Dual-Enrolment)"),
        ("Anomaly Engine: ", "Scikit-Learn Anomaly Detection & Over-Enrolment Monitoring"),
        ("Database: ", "PostgreSQL / SQLite + SQLAlchemy ORM"),
        ("Reporting & Export: ", "CSV/XLSX Ingestion + Recharts Analytics"),
        ("Security: ", "SHA-256 Cryptographic Seals, Masked APAAR IDs, Zero-Knowledge Proofs"),
        ("YouTube Demo: ", "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"),
        ("GitHub Repo: ", "https://github.com/SDP-001/SIH.git")
    ]
    for label, desc in tech_items:
        p = ltf.add_paragraph()
        p.space_after = Pt(5)
        run_l = p.add_run()
        run_l.text = label
        run_l.font.name = "Calibri"
        run_l.font.bold = True
        run_l.font.size = Pt(10.5)
        run_l.font.color.rgb = NAVY if "Demo" not in label and "Repo" not in label else RUST

        run_d = p.add_run()
        run_d.text = desc
        run_d.font.name = "Calibri"
        run_d.font.size = Pt(10)
        if desc.startswith("http"):
            run_d.font.color.rgb = RGBColor(0, 102, 204)
            run_d.font.underline = True
            run_d.hyperlink.address = desc
        else:
            run_d.font.color.rgb = DARK_TEXT if "Demo" not in label and "Repo" not in label else BLUE

    # Right Column: Prototype Screenshot
    label_box = slide3.shapes.add_textbox(Emu(6000000), Emu(1150000), Emu(5600000), Emu(400000))
    lbp = label_box.text_frame.paragraphs[0]
    lbp.text = "PROTOTYPE SCREENSHOT"
    lbp.font.name = "Calibri"
    lbp.font.bold = True
    lbp.font.size = Pt(15)
    lbp.font.color.rgb = NAVY
    lbp.alignment = PP_ALIGN.CENTER

    if os.path.exists(dash_shot):
        slide3.shapes.add_picture(dash_shot, Emu(6000000), Emu(1650000), width=Emu(5600000), height=Emu(4000000))

    caption_box = slide3.shapes.add_textbox(Emu(6000000), Emu(5750000), Emu(5600000), Emu(450000))
    cp = caption_box.text_frame.paragraphs[0]
    cp.text = "AICTE Regulatory Command Centre & Student Verification Portal"
    cp.font.name = "Calibri"
    cp.font.bold = True
    cp.font.size = Pt(13)
    cp.font.color.rgb = NAVY
    cp.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 4: TECHNICAL APPROACH (Mobile / Public Verification & QR Screenshot)
    # =========================================================================
    slide4 = prs.slides.add_slide(blank_layout)
    add_common_header(slide4, "TECHNICAL APPROACH", 4)

    # Left Column: Mobile & Verification Engine
    left_card4 = slide4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(550000), Emu(1150000), Emu(5100000), Emu(5050000))
    left_card4.fill.solid()
    left_card4.fill.fore_color.rgb = WHITE
    left_card4.line.color.rgb = RUST
    left_card4.line.width = Pt(2)
    
    ltf4 = left_card4.text_frame
    ltf4.word_wrap = True

    p_head4 = ltf4.paragraphs[0]
    p_head4.text = "Student Credential & Public Verification Engine"
    p_head4.font.name = "Calibri"
    p_head4.font.bold = True
    p_head4.font.size = Pt(14)
    p_head4.font.color.rgb = RUST
    p_head4.font.underline = True
    p_head4.space_after = Pt(8)

    mob_items = [
        ("Architecture: ", "Mobile-Responsive Progressive Web App (PWA)"),
        ("Student Vault: ", "Self-Service Digital APAAR ID & Credential Status"),
        ("QR Technology: ", "High-Density Cryptographic QR Code Generator"),
        ("Verification Mechanism: ", "Instant camera/scanner lookup with Zero PII leakage"),
        ("Tamper-Evident Seal: ", "SHA-256 Ledger Verification against AICTE Database"),
        ("AI Regulatory Assistant: ", "Conversational NLP for AICTE Officers & Audits"),
        ("Dual REST Adapters: ", "Pluggable Mock Sandbox + Production APAAR/ABC API"),
        ("Offline Fallback: ", "Cached cryptographic proofs for low-connectivity regions"),
        ("YouTube Demo: ", "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"),
        ("GitHub Repo: ", "https://github.com/SDP-001/SIH.git")
    ]
    for label, desc in mob_items:
        p = ltf4.add_paragraph()
        p.space_after = Pt(5)
        run_l = p.add_run()
        run_l.text = label
        run_l.font.name = "Calibri"
        run_l.font.bold = True
        run_l.font.size = Pt(10.5)
        run_l.font.color.rgb = NAVY if "Demo" not in label and "Repo" not in label else RUST

        run_d = p.add_run()
        run_d.text = desc
        run_d.font.name = "Calibri"
        run_d.font.size = Pt(10)
        if desc.startswith("http"):
            run_d.font.color.rgb = RGBColor(0, 102, 204)
            run_d.font.underline = True
            run_d.hyperlink.address = desc
        else:
            run_d.font.color.rgb = DARK_TEXT if "Demo" not in label and "Repo" not in label else BLUE

    # Right Column: Mobile / QR Verification Screenshot
    label_box4 = slide4.shapes.add_textbox(Emu(6000000), Emu(1150000), Emu(5600000), Emu(400000))
    lbp4 = label_box4.text_frame.paragraphs[0]
    lbp4.text = "PROTOTYPE SCREENSHOT"
    lbp4.font.name = "Calibri"
    lbp4.font.bold = True
    lbp4.font.size = Pt(15)
    lbp4.font.color.rgb = NAVY
    lbp4.alignment = PP_ALIGN.CENTER

    if os.path.exists(qr_shot):
        slide4.shapes.add_picture(qr_shot, Emu(6000000), Emu(1650000), width=Emu(5600000), height=Emu(4000000))

    caption_box4 = slide4.shapes.add_textbox(Emu(6000000), Emu(5750000), Emu(5600000), Emu(450000))
    cp4 = caption_box4.text_frame.paragraphs[0]
    cp4.text = "Student Digital Academic Identity & Zero-Knowledge QR Verification"
    cp4.font.name = "Calibri"
    cp4.font.bold = True
    cp4.font.size = Pt(13)
    cp4.font.color.rgb = NAVY
    cp4.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 5: FEASIBILITY AND VIABILITY (3-Column Matrix matching Thinkode p.5)
    # =========================================================================
    slide5 = prs.slides.add_slide(blank_layout)
    add_common_header(slide5, "FEASIBILITY AND VIABILITY", 5)

    col_w = Emu(3500000)
    col_gap = Emu(300000)
    col1_x = Emu(550000)
    col2_x = col1_x + col_w + col_gap
    col3_x = col2_x + col_w + col_gap

    headers = [
        (col1_x, "Feasibility Analysis", RGBColor(229, 80, 57)),   # Coral Red
        (col2_x, "Challenges & Risks", RGBColor(243, 156, 18)),    # Orange/Amber
        (col3_x, "Mitigation Strategies", RGBColor(41, 128, 185))  # Blue
    ]
    for cx, title, col in headers:
        hdr_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, Emu(1200000), col_w, Emu(550000))
        hdr_box.fill.solid()
        hdr_box.fill.fore_color.rgb = col
        hdr_box.line.fill.background()
        hp = hdr_box.text_frame.paragraphs[0]
        hp.text = title
        hp.font.name = "Calibri"
        hp.font.bold = True
        hp.font.size = Pt(14)
        hp.font.color.rgb = WHITE
        hp.alignment = PP_ALIGN.CENTER

    # Row 1, 2, 3 Cards
    cards_data = [
        # Col 1: Feasibility
        (col1_x, [
            ("Prototype Ready Tech Stack", "Modern production-grade stack (Next.js 16 + FastAPI + PostgreSQL/SQLite) fully implemented and operational.", RGBColor(255, 243, 240), RGBColor(229, 80, 57)),
            ("Core AICTE Features Achieved", "Intake vs actual enrolment monitoring, 10-point validation, and multi-tenant RBAC working end-to-end.", RGBColor(255, 243, 240), RGBColor(229, 80, 57)),
            ("Low-Cost Scalable Deployment", "Containerized Docker setup with asynchronous API endpoints for low-cost nationwide university rollout.", RGBColor(255, 243, 240), RGBColor(229, 80, 57))
        ]),
        # Col 2: Challenges
        (col2_x, [
            ("Incomplete Student Records", "Institutions uploading legacy or dirty data with missing roll numbers or invalid APAAR format.", CARD_BG_AMBER, AMBER),
            ("Cross-Campus Dual Enrolments", "Students concurrently admitted across two institutions claiming duplicate seats and scholarships.", CARD_BG_AMBER, AMBER),
            ("Verification Service Limits", "Rate limits, network latency, or unexpected downtime on official third-party APAAR/ABC APIs.", CARD_BG_AMBER, AMBER)
        ]),
        # Col 3: Mitigation
        (col3_x, [
            ("Automated Checks & Corrections", "Immediate schema checks on upload with human-in-the-loop correction and re-validation workflows.", CARD_BG_BLUE, BLUE),
            ("Fuzzy & Rule-Based Detector", "Similarity and exact-match algorithms flag dual enrolments with resolution audit logs.", CARD_BG_BLUE, BLUE),
            ("Pluggable Dual-Adapter Design", "Built-in simulation sandbox allows seamless offline testing with zero external API downtime.", CARD_BG_BLUE, BLUE)
        ])
    ]

    card_h = Emu(1300000)
    card_gap = Emu(150000)
    base_y = Emu(1900000)

    for cx, c_list in cards_data:
        for idx, (head, body, bg_c, border_c) in enumerate(c_list):
            cy = base_y + idx * (card_h + card_gap)
            c_box = slide5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, cx, cy, col_w, card_h)
            c_box.fill.solid()
            c_box.fill.fore_color.rgb = bg_c
            c_box.line.color.rgb = border_c
            c_box.line.width = Pt(1.5)
            ctf = c_box.text_frame
            ctf.word_wrap = True
            
            p0 = ctf.paragraphs[0]
            p0.text = head
            p0.font.name = "Calibri"
            p0.font.bold = True
            p0.font.size = Pt(13)
            p0.font.color.rgb = NAVY
            p0.alignment = PP_ALIGN.CENTER
            p0.space_after = Pt(4)

            p1 = ctf.add_paragraph()
            p1.text = body
            p1.font.name = "Calibri"
            p1.font.size = Pt(9.5)
            p1.font.color.rgb = DARK_TEXT
            p1.alignment = PP_ALIGN.CENTER

    # =========================================================================
    # SLIDE 6: IMPACT AND BENEFITS (Numbered Cards 01 to 05 matching Thinkode p.6)
    # =========================================================================
    slide6 = prs.slides.add_slide(blank_layout)
    add_common_header(slide6, "IMPACT AND BENEFITS", 6)

    # 5 Staggered Numbered Cards
    # Card 01 (Left Top)
    card1_w = Emu(3600000)
    card1_h = Emu(1550000)

    def draw_numbered_card(slide, x, y, w, h, num_str, title_str, desc_str, num_color, bg_color, border_color):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.5)
        
        # Large Number Box on left
        n_box = slide.shapes.add_textbox(x + Emu(120000), y + Emu(100000), Emu(800000), h - Emu(200000))
        np = n_box.text_frame.paragraphs[0]
        np.text = num_str
        np.font.name = "Calibri"
        np.font.bold = True
        np.font.size = Pt(36)
        np.font.color.rgb = num_color
        np.alignment = PP_ALIGN.CENTER
        
        # Text Box on right
        t_box = slide.shapes.add_textbox(x + Emu(950000), y + Emu(120000), w - Emu(1050000), h - Emu(240000))
        ttf = t_box.text_frame
        ttf.word_wrap = True
        
        tp0 = ttf.paragraphs[0]
        tp0.text = title_str
        tp0.font.name = "Calibri"
        tp0.font.bold = True
        tp0.font.size = Pt(13)
        tp0.font.color.rgb = NAVY
        tp0.space_after = Pt(4)

        tp1 = ttf.add_paragraph()
        tp1.text = desc_str
        tp1.font.name = "Calibri"
        tp1.font.size = Pt(10)
        tp1.font.color.rgb = DARK_TEXT

    # 01 (Left Top)
    draw_numbered_card(slide6, Emu(550000), Emu(1250000), card1_w, card1_h, "01", "Regulatory Integrity (AICTE)", "Real-time intake vs enrolment monitoring eliminates unauthorized seat over-allocation and ghost enrolments across technical campuses.", ORANGE, CARD_BG_WARM, ORANGE)

    # 02 (Left Bottom)
    draw_numbered_card(slide6, Emu(550000), Emu(3000000), card1_w, card1_h, "02", "Fraud & Duplicate Prevention", "Automated cross-institutional checks prevent concurrent admissions and fraudulent duplicate scholarship claims.", ORANGE, CARD_BG_WARM, ORANGE)

    # 03 (Center)
    draw_numbered_card(slide6, Emu(4350000), Emu(2100000), card1_w, card1_h, "03", "Transparency & Trust", "Cryptographic zero-knowledge verification prevents credential tampering, fake degrees, and falsified academic records.", BLUE, CARD_BG_BLUE, BLUE)

    # 04 (Right Top)
    draw_numbered_card(slide6, Emu(8150000), Emu(1250000), card1_w, card1_h, "04", "Operational Efficiency", "Standardized bulk upload and 10-point automated checks reduce manual reporting workload and inspection backlogs by 80%.", BLUE, CARD_BG_BLUE, BLUE)

    # 05 (Right Bottom)
    draw_numbered_card(slide6, Emu(8150000), Emu(3000000), card1_w, card1_h, "05", "Scalable for Future", "Privacy-by-design architecture strictly adheres to DPDP Act 2023, ready for nationwide rollout across all AICTE universities.", BLUE, CARD_BG_BLUE, BLUE)

    # Bottom Full-Width Highlight Banner for YouTube & GitHub
    banner_w = Emu(11200000)
    banner_h = Emu(1300000)
    banner = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu(550000), Emu(4800000), banner_w, banner_h)
    banner.fill.solid()
    banner.fill.fore_color.rgb = CARD_BG_WARM
    banner.line.color.rgb = ORANGE
    banner.line.width = Pt(2)
    
    btf = banner.text_frame
    btf.word_wrap = True
    
    bp0 = btf.paragraphs[0]
    bp0.text = "\U0001F3A5 WORKING PROTOTYPE DEMONSTRATION & REPOSITORY LINKS"
    bp0.font.name = "Calibri"
    bp0.font.bold = True
    bp0.font.size = Pt(13)
    bp0.font.color.rgb = RUST
    bp0.alignment = PP_ALIGN.CENTER
    bp0.space_after = Pt(4)

    bp1 = btf.add_paragraph()
    bp1.space_after = Pt(4)
    bp1.alignment = PP_ALIGN.CENTER
    r_b1_lbl = bp1.add_run()
    r_b1_lbl.text = "\u25B6 YouTube Prototype Video: "
    r_b1_lbl.font.name = "Calibri"
    r_b1_lbl.font.bold = True
    r_b1_lbl.font.size = Pt(11.5)
    r_b1_lbl.font.color.rgb = RUST
    r_b1_lnk = bp1.add_run()
    r_b1_lnk.text = "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"
    r_b1_lnk.font.name = "Calibri"
    r_b1_lnk.font.bold = True
    r_b1_lnk.font.size = Pt(11.5)
    r_b1_lnk.font.underline = True
    r_b1_lnk.font.color.rgb = RGBColor(0, 102, 204)
    r_b1_lnk.hyperlink.address = "https://youtu.be/rEz9BszbQnQ?si=c1oF4zL5QWqgU2EB"

    bp2 = btf.add_paragraph()
    bp2.alignment = PP_ALIGN.CENTER
    r_b2_lbl = bp2.add_run()
    r_b2_lbl.text = "\u25B6 GitHub Source Repository: "
    r_b2_lbl.font.name = "Calibri"
    r_b2_lbl.font.bold = True
    r_b2_lbl.font.size = Pt(11.5)
    r_b2_lbl.font.color.rgb = NAVY
    r_b2_lnk = bp2.add_run()
    r_b2_lnk.text = "https://github.com/SDP-001/SIH.git"
    r_b2_lnk.font.name = "Calibri"
    r_b2_lnk.font.bold = True
    r_b2_lnk.font.size = Pt(11.5)
    r_b2_lnk.font.underline = True
    r_b2_lnk.font.color.rgb = RGBColor(0, 102, 204)
    r_b2_lnk.hyperlink.address = "https://github.com/SDP-001/SIH.git"

    # Save to both project workspace and OneDrive Documents
    out_file1 = "SIH2026-IDEA-Presentation_APAAR-Vault.pptx"
    out_file2 = r"c:\Users\SDP\OneDrive\Documents\SIH2026-IDEA-Presentation_APAAR-Vault.pptx"
    
    prs.save(out_file1)
    prs.save(out_file2)
    print("SUCCESS: Generated 6-slide presentation matching Thinkode format!")
    print(f"  Saved to: {os.path.abspath(out_file1)}")
    print(f"  Saved to: {out_file2}")

if __name__ == '__main__':
    build_presentation()
