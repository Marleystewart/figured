from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUT = "/Users/marley/Documents/New project/output/pdf/promptly_gen_z_growth_playbook.pdf"
ICON = "/private/tmp/opening-app-from-live/assets/app-icon.png"

NAVY = colors.HexColor("#0B1022")
INK = colors.HexColor("#182036")
PURPLE = colors.HexColor("#6E43FF")
VIOLET = colors.HexColor("#A92BFF")
CYAN = colors.HexColor("#31C9F5")
MINT = colors.HexColor("#DDF9F1")
LAVENDER = colors.HexColor("#EEE9FF")
PALE = colors.HexColor("#F5F7FC")
MID = colors.HexColor("#63708A")
LINE = colors.HexColor("#D9DFEA")
WHITE = colors.white


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Eyebrow", fontName="Helvetica-Bold", fontSize=8.5, leading=10,
    textColor=PURPLE, spaceAfter=6, uppercase=True,
))
styles.add(ParagraphStyle(
    name="H1", fontName="Helvetica-Bold", fontSize=25, leading=28,
    textColor=INK, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="H2", fontName="Helvetica-Bold", fontSize=16, leading=19,
    textColor=INK, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="H3", fontName="Helvetica-Bold", fontSize=11, leading=13,
    textColor=INK, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="Body", fontName="Helvetica", fontSize=9.3, leading=13.2,
    textColor=INK, spaceAfter=7,
))
styles.add(ParagraphStyle(
    name="Small", fontName="Helvetica", fontSize=7.8, leading=10.5,
    textColor=MID,
))
styles.add(ParagraphStyle(
    name="CardTitle", fontName="Helvetica-Bold", fontSize=10.2, leading=12.5,
    textColor=INK, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="CardBody", fontName="Helvetica", fontSize=8.2, leading=11.2,
    textColor=MID,
))
styles.add(ParagraphStyle(
    name="HeaderCell", fontName="Helvetica-Bold", fontSize=9, leading=11,
    textColor=WHITE,
))
styles.add(ParagraphStyle(
    name="Metric", fontName="Helvetica-Bold", fontSize=22, leading=23,
    textColor=PURPLE, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="MetricLabel", fontName="Helvetica", fontSize=7.5, leading=9.5,
    textColor=INK, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="Quote", fontName="Helvetica-Bold", fontSize=14, leading=18,
    textColor=INK, alignment=TA_CENTER,
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="Helvetica-Bold", fontSize=33, leading=36,
    textColor=WHITE, alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName="Helvetica", fontSize=12, leading=17,
    textColor=colors.HexColor("#D9DDF0"), alignment=TA_LEFT,
))
styles.add(ParagraphStyle(
    name="WhiteSmall", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
    textColor=colors.HexColor("#D9DDF0"),
))


def p(text, style="Body"):
    return Paragraph(text, styles[style])


def section(label, title, intro=None):
    items = [p(label.upper(), "Eyebrow"), p(title, "H1")]
    if intro:
        items.append(p(intro, "Body"))
    items.append(Spacer(1, 6))
    return items


def card(title, body, width=2.45 * inch, bg=PALE):
    t = Table([[p(title, "CardTitle")], [p(body, "CardBody")]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
        ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 11),
    ]))
    return t


def bullet(text):
    return p(f"<font color='#6E43FF'><b>+ </b></font>{text}", "Body")


def draw_cover(canvas, doc):
    canvas.saveState()
    w, h = LETTER
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#21184B"))
    canvas.circle(w - 40, h - 120, 170, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#162D4B"))
    canvas.circle(w - 80, 40, 135, fill=1, stroke=0)
    canvas.setStrokeColor(PURPLE)
    canvas.setLineWidth(2)
    canvas.line(42, 48, 190, 48)
    canvas.restoreState()


def draw_page(canvas, doc):
    canvas.saveState()
    w, h = LETTER
    canvas.setFillColor(WHITE)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 15, w, 15, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(MID)
    canvas.drawString(40, 24, "PROMPTLY  |  GEN Z GROWTH PLAYBOOK")
    canvas.drawRightString(w - 40, 24, str(doc.page))
    canvas.setStrokeColor(LINE)
    canvas.line(40, 34, w - 40, 34)
    canvas.restoreState()


doc = SimpleDocTemplate(
    OUT,
    pagesize=LETTER,
    rightMargin=40,
    leftMargin=40,
    topMargin=42,
    bottomMargin=46,
    title="Promptly Gen Z Growth Playbook",
    author="Promptly",
)

story = []

# Cover
story.append(Spacer(1, 28))
story.append(Image(ICON, width=0.9 * inch, height=0.9 * inch))
story.append(Spacer(1, 28))
story.append(p("PROMPTLY", "WhiteSmall"))
story.append(Spacer(1, 8))
story.append(p("How We Win<br/>Our Generation", "CoverTitle"))
story.append(Spacer(1, 16))
story.append(p(
    "A platform strategy, campus growth system, and 12-month roadmap for building the student alert network we wish already existed.",
    "CoverSub",
))
story.append(Spacer(1, 190))
cover_meta = Table([
    [p("FOUNDERS", "WhiteSmall"), p("AUDIENCE", "WhiteSmall"), p("VERSION", "WhiteSmall")],
    [p("Peer-built at age 20", "CoverSub"), p("Students 18-24", "CoverSub"), p("June 2026", "CoverSub")],
], colWidths=[2.1 * inch, 2.1 * inch, 2.1 * inch])
cover_meta.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
]))
story.append(cover_meta)
story.append(PageBreak())

# Strategy
story += section(
    "01 / The thesis",
    "The advantage is not being older. It is being closer.",
    "Promptly can speak with students instead of at them. The founders understand the anxiety, group chats, missed deadlines, and overload because they are living the same moment.",
)
story.append(Table([[card(
    "Positioning",
    "Promptly is the student alert layer for internships and early-career opportunities. It finds relevant openings, verifies the source, and tells students before the window closes.",
    3.1 * inch,
    LAVENDER,
), card(
    "Brand promise",
    "No job-board maze. No random spam. No pretending students want another feed to manage. Only timely alerts matched to goals, major, interests, and recruiting cycle.",
    3.1 * inch,
    MINT,
)]], colWidths=[3.25 * inch, 3.25 * inch], style=[
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(Spacer(1, 16))
story.append(p("THE MESSAGE TO REPEAT", "Eyebrow"))
story.append(p("\"The opening should find you before you have to find it.\"", "Quote"))
story.append(Spacer(1, 18))
story.append(p("Three reasons students should believe Promptly", "H2"))
story.append(bullet("<b>Relevant:</b> alerts are ranked using the student's profile, not just a broad keyword."))
story.append(bullet("<b>Fast:</b> push and email arrive when an opening is detected, with deadline and source."))
story.append(bullet("<b>Trustworthy:</b> every alert points to the official employer page and clearly shows when it was verified."))
story.append(Spacer(1, 12))
story.append(card(
    "Founder voice",
    "Use first-person language: 'We built this because we missed openings too.' Show the real process, mistakes, late-night builds, and student feedback. The founders are part of the product story.",
    6.45 * inch,
    PALE,
))
story.append(PageBreak())

# Audience evidence
story += section(
    "02 / Audience truth",
    "Meet students where they already discover, compare, and share.",
    "The goal is not to post everywhere equally. Each channel has a different job in the funnel.",
)
metrics = Table([
    [p("95%", "Metric"), p("80%", "Metric"), p("63%", "Metric"), p("58%", "Metric")],
    [p("of U.S. adults 18-29 use YouTube", "MetricLabel"), p("use Instagram", "MetricLabel"), p("use TikTok", "MetricLabel"), p("use Snapchat", "MetricLabel")],
], colWidths=[1.62 * inch] * 4)
metrics.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), LAVENDER),
    ("BOX", (0, 0), (-1, -1), 0.7, LINE),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
    ("TOPPADDING", (0, 0), (-1, 0), 14),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
    ("TOPPADDING", (0, 1), (-1, 1), 2),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
]))
story.append(metrics)
story.append(Spacer(1, 16))
story.append(Table([[card(
    "Career growth is already a habit",
    "Deloitte reports that 70% of Gen Z respondents develop career skills weekly or more often. Promptly should frame alerts as part of that growth habit, not as doom-scrolling.",
    3.1 * inch,
), card(
    "Guidance matters",
    "Deloitte reports that 86% of Gen Z respondents value mentorship and guidance. Even a small 'why this fits you' explanation makes an alert feel more useful and human.",
    3.1 * inch,
)]], colWidths=[3.25 * inch, 3.25 * inch], style=[
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(Spacer(1, 16))
story.append(p("What this means for Promptly", "H2"))
insight_rows = [
    ["Behavior", "Product or marketing response"],
    ["Students scroll for discovery", "Lead with a recognizable employer, exact role, and opening time in the first second."],
    ["Students trust friends", "Build referral codes, campus reps, class group-chat sharing, and student testimonials."],
    ["Students want relevance", "Show why the alert matched: major, goal, skill, location, or recruiting cycle."],
    ["Students fear missing out", "Use honest urgency: opened today, deadline, and verified source. Never invent scarcity."],
    ["Students value purpose", "Highlight mission, learning, pay, location, and role impact when the source provides it."],
]
tbl = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(insight_rows)], colWidths=[1.75 * inch, 4.75 * inch])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 9),
    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(tbl)
story.append(PageBreak())

# Platform playbook
story += section(
    "03 / Platform playbook",
    "Give every platform one clear job.",
    "Do not paste the same post everywhere. Reuse the idea, then shape it for the behavior of each platform.",
)
platform_rows = [
    ["Platform", "Job", "What to publish", "Cadence"],
    ["TikTok", "Discovery", "20-35 second alert breakdowns, missed-opening stories, founder build clips, campus reactions", "4-5x weekly"],
    ["Instagram", "Trust + sharing", "Reels, alert carousels, student results, Stories polls, campus rep takeovers", "3-4x weekly + Stories"],
    ["YouTube Shorts", "Search + shelf life", "Evergreen recruiting-cycle explainers and weekly 'what opened' recaps", "2-3x weekly"],
    ["LinkedIn", "Credibility", "Founder lessons, verified employer wins, university partnerships, product milestones", "2x weekly"],
    ["Snapchat", "Friend-to-friend reach", "Campus Stories, rep content, deadline reminders, QR codes at events", "Campaign bursts"],
    ["Reddit", "Listening", "Helpful answers in career and college communities. Disclose founder status. No spam.", "1 useful thread weekly"],
    ["GroupMe / Discord", "Conversion", "Shareable alert cards and campus-specific channels run by real student reps", "When value is real"],
    ["Email / push", "Retention", "Matched opening, why it fits, deadline, official source, and one clear action", "User-controlled"],
]
platform_tbl = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(platform_rows)], colWidths=[0.85 * inch, 1.05 * inch, 3.65 * inch, 0.95 * inch], repeatRows=1)
platform_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
    ("GRID", (0, 0), (-1, -1), 0.45, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(platform_tbl)
story.append(Spacer(1, 14))
story.append(card(
    "Recommended launch priority",
    "Start with TikTok + Instagram for reach, campus reps + group chats for trust, and email + push for retention. Add YouTube Shorts after the first two weeks by republishing the best-performing concepts with stronger titles.",
    6.45 * inch,
    LAVENDER,
))
story.append(PageBreak())

# Content engine
story += section(
    "04 / Content engine",
    "Build recognizable series, not random posts.",
    "A repeatable format lowers production pressure and teaches students what Promptly is through examples.",
)
series = [
    ("OPENED TODAY", "Screen-record the alert, show the employer and role, then explain who it fits in under 25 seconds."),
    ("YOU MISSED THIS", "Show a recently closed internship and the simple alert that would have prevented the miss."),
    ("MAJOR TO ROLE", "Pick one major and reveal three less-obvious career paths and the employers recruiting for them."),
    ("RECRUITING CLOCK", "Explain what opens this month for one field, class year, or internship season."),
    ("BUILDING AT 20", "Show the founders testing, reading feedback, fixing a bug, visiting campuses, or celebrating a real signup."),
    ("IS IT VERIFIED?", "Teach students how to spot stale listings, unofficial reposts, and misleading deadlines."),
]
for i in range(0, len(series), 2):
    story.append(Table([[card(series[i][0], series[i][1], 3.1 * inch, PALE), card(series[i+1][0], series[i+1][1], 3.1 * inch, PALE)]], colWidths=[3.25 * inch, 3.25 * inch], style=[
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
story.append(Spacer(1, 12))
story.append(p("The 7-second content test", "H2"))
story.append(bullet("Can a student understand the role or pain point without sound?"))
story.append(bullet("Does the first frame say who this is for? Example: 'Political science majors: this opened today.'"))
story.append(bullet("Is there one next action? Join, turn on alerts, save the deadline, or send it to a friend."))
story.append(Spacer(1, 8))
story.append(p("Sample short-form script", "H2"))
script_tbl = Table([
    [p("0-2 sec", "CardTitle"), p("'Marketing majors, Spotify just opened a summer role.'", "CardBody")],
    [p("3-10 sec", "CardTitle"), p("Show the official source, location, deadline, and what made the alert match.", "CardBody")],
    [p("11-20 sec", "CardTitle"), p("'Promptly caught it two hours after it opened and sent this alert.'", "CardBody")],
    [p("21-25 sec", "CardTitle"), p("'Turn on your field alerts before the next one drops.'", "CardBody")],
], colWidths=[1.05 * inch, 5.4 * inch])
script_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), LAVENDER),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(script_tbl)
story.append(PageBreak())

# Campus loop
story += section(
    "05 / Campus growth",
    "Turn one useful alert into a campus loop.",
    "Promptly grows when the product creates something worth sending to a friend. The alert is both the service and the marketing asset.",
)
loop = Table([
    [p("1", "Metric"), p("2", "Metric"), p("3", "Metric"), p("4", "Metric")],
    [p("A verified alert arrives", "MetricLabel"), p("Student shares the alert card", "MetricLabel"), p("Friend joins the same track", "MetricLabel"), p("More profiles improve matching", "MetricLabel")],
], colWidths=[1.62 * inch] * 4)
loop.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), MINT),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("TOPPADDING", (0, 0), (-1, 0), 12),
    ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
    ("BOTTOMPADDING", (0, 1), (-1, 1), 11),
]))
story.append(loop)
story.append(Spacer(1, 15))
story.append(p("Campus ambassador program", "H2"))
amb_rows = [
    ["Element", "Simple version"],
    ["Who", "One connected student per campus or major: club leader, athlete, RA, creator, or career-focused friend."],
    ["Mission", "Get 25 verified signups and collect 10 honest interviews in the first month."],
    ["Tools", "Personal QR code, referral link, 5 ready-made posts, table sign, and weekly alert recap."],
    ["Reward", "$50 milestone bonus, founder access, resume line, early product input, and public recognition."],
    ["Guardrail", "Pay for verified activation and feedback, not empty clicks. Never encourage spam in class chats."],
]
amb = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(amb_rows)], colWidths=[1.15 * inch, 5.35 * inch])
amb.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(amb)
story.append(Spacer(1, 14))
story.append(p("Partnership ladder", "H2"))
story.append(bullet("<b>Start:</b> clubs, student organizations, athletic teams, and major-specific societies."))
story.append(bullet("<b>Next:</b> professors, peer mentors, resident assistants, and internship coordinators."))
story.append(bullet("<b>Then:</b> career centers and university departments, backed by real student activation data."))
story.append(card(
    "The pitch to a campus partner",
    "'We are not replacing advising. Promptly handles the time-sensitive alert layer so students arrive earlier and better prepared.'",
    6.45 * inch,
    LAVENDER,
))
story.append(PageBreak())

# Product growth
story += section(
    "06 / Product-led growth",
    "Make the product prove its value every week.",
    "Growth will stall if students join but do not receive a relevant alert quickly. The first useful alert is the activation moment.",
)
product_rows = [
    ["Priority", "Why it matters", "Minimum version"],
    ["First-alert promise", "Sets a clear expectation", "Tell users what tracks are active and when they should expect alerts."],
    ["Why this matched", "Builds trust in personalization", "Show major, interest, goal, skill, and timing signals behind each alert."],
    ["Share alert", "Creates the referral loop", "Generate a clean image or link with role, deadline, Promptly mark, and referral."],
    ["Notification controls", "Prevents fatigue", "Let users choose push, email, SMS, field, location, and urgency."],
    ["Verified source", "Separates Promptly from stale boards", "Official employer URL, last checked time, and reporting button."],
    ["Campus + major context", "Makes matching feel student-specific", "Class year, school, major, graduation date, goals, and free-text interests."],
    ["Closed-loop feedback", "Improves matching", "Useful / not useful, plus one-tap reason: wrong field, timing, location, or level."],
]
prod = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(product_rows)], colWidths=[1.35 * inch, 1.85 * inch, 3.3 * inch])
prod.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
]))
story.append(prod)
story.append(Spacer(1, 13))
story.append(Table([[card(
    "North-star metric",
    "Weekly Activated Students: students who receive at least one relevant alert and open the official source within seven days.",
    3.1 * inch,
    MINT,
), card(
    "Trust metric",
    "Verified-alert accuracy: the percentage of alerts that are still open, official, correctly categorized, and matched to the intended student level.",
    3.1 * inch,
    LAVENDER,
)]], colWidths=[3.25 * inch, 3.25 * inch], style=[
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(PageBreak())

# Roadmap
story += section(
    "07 / Roadmap",
    "A practical 12-month build and growth sequence.",
    "The order matters: prove the alert, prove retention, then expand campuses and channels.",
)
roadmap_rows = [
    ["Phase", "Product", "Growth", "Proof to earn"],
    ["0-30 days\nFoundation", "Make email + push tests reliable. Fix source links. Add notification inbox and useful / not useful feedback.", "Interview 25 students. Launch 3 content series. Recruit 5 campus reps across 2 campuses.", "100 activated students; 60% receive a useful alert in week one."],
    ["31-90 days\nRepeatability", "Shareable alert cards, referral tracking, profile-based match reasons, cleaner recruiting cycles.", "Weekly founder content. 10 reps on 5 campuses. Club partnerships and small tabling tests.", "500 activated students; 30% weekly retention; 20% of signups referred."],
    ["Months 4-6\nCampus system", "Add SMS with consent, digest controls, campus and major filters, reporting tools.", "Formal ambassador cohort. Expand to 15 campuses and 3 strong field clusters.", "2,000 activated students; consistent cost per activated student; 90%+ alert accuracy."],
    ["Months 7-12\nScale", "Broader employer coverage, stronger ranking, admin tools, partnership analytics.", "University partnerships, creator collaborations, PR around student outcomes, selective paid tests.", "10,000 activated students; 40%+ 8-week retention in strongest cohorts."],
]
road = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(roadmap_rows)], colWidths=[1.05 * inch, 2.05 * inch, 2.05 * inch, 1.35 * inch])
road.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("BACKGROUND", (0, 1), (0, -1), LAVENDER),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(road)
story.append(Spacer(1, 16))
story.append(p("Decision rule", "H2"))
story.append(card(
    "Do not scale a channel before it produces activated students",
    "Views are attention, not traction. Keep a channel when it brings students who complete a profile, enable an alert channel, receive a relevant alert, and open the official source.",
    6.45 * inch,
    MINT,
))
story.append(Spacer(1, 14))
story.append(p("Founder operating rhythm", "H2"))
story.append(bullet("Monday: review alerts, source quality, and delivery failures."))
story.append(bullet("Tuesday: interview two students and publish one founder story."))
story.append(bullet("Wednesday: ship one product improvement tied to activation or trust."))
story.append(bullet("Thursday: campus rep check-in and partnership outreach."))
story.append(bullet("Friday: review the funnel, choose next week's experiment, and post the weekly opening recap."))
story.append(PageBreak())

# 30-day plan
story += section(
    "08 / First 30 days",
    "The launch sprint.",
    "A focused month should create enough evidence to decide what deserves more time and money.",
)
week_rows = [
    ["Week", "Build", "Publish", "Learn"],
    ["1", "Confirm push + email delivery. Instrument signup, profile, alert, source-open, save, and share.", "Founder intro, 'why we built it,' and 2 Opened Today posts.", "10 student interviews. Record their exact words."],
    ["2", "Add shareable alert links and clear match reasons.", "Major to Role, You Missed This, and one campus reaction.", "Test 3 hooks and 2 calls to action."],
    ["3", "Launch referral tracking and rep toolkit.", "Rep takeovers, weekly openings recap, and one verified-source lesson.", "Run two campus tables or club demos."],
    ["4", "Fix the top three reasons alerts feel irrelevant.", "Student result, build-in-public recap, and next-month recruiting clock.", "Choose the best channel, campus, and field cohort."],
]
week = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(week_rows)], colWidths=[0.55 * inch, 2.15 * inch, 2.15 * inch, 1.65 * inch])
week.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("BACKGROUND", (0, 1), (0, -1), LAVENDER),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 7),
    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(week)
story.append(Spacer(1, 14))
story.append(p("Scoreboard", "H2"))
score_rows = [
    ["Metric", "30-day target", "Why"],
    ["Profile completion", "75%+", "Matching cannot work without enough context."],
    ["Notification opt-in", "60%+", "Promptly must earn permission to alert."],
    ["First useful alert", "60% in 7 days", "This is the activation moment."],
    ["Official-source open rate", "35%+", "Shows alerts are relevant enough to act on."],
    ["Share or referral rate", "15%+", "Signals organic campus potential."],
    ["4-week retained", "30%+", "Shows students continue to value the service."],
]
score = Table([[p(c, "HeaderCell" if r == 0 else "CardBody") for c in row] for r, row in enumerate(score_rows)], colWidths=[2.1 * inch, 1.45 * inch, 2.95 * inch])
score.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
    ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
]))
story.append(score)
story.append(PageBreak())

# Idea bank and sources
story += section(
    "09 / Idea bank",
    "Experiments worth testing after the core works.",
    "These are options, not a to-do list. Run one experiment at a time and judge it by activation and retention.",
)
ideas = [
    ("Alert Drop Live", "A weekly 10-minute TikTok or Instagram Live reviewing openings that appeared that week."),
    ("Campus Heatmap", "A public view of the fields and employers students at each campus are tracking, with privacy-safe totals."),
    ("Track Clubs", "Opt-in micro-communities for sports business, policy, design, healthcare, media, and other paths."),
    ("Promptly Pass", "A QR card reps can hand out at club meetings that opens directly to the matching field setup."),
    ("Deadline Rescue", "A Sunday digest of saved alerts closing in the next 7 or 14 days."),
    ("Founder Hotline", "A weekly Story question box where students submit a major or dream role for the founders to research."),
    ("Campus Challenge", "Two campuses compete on verified activations, with a career club grant or event prize."),
    ("Proof Wall", "Student-submitted screenshots of real Promptly alerts that led them to an opportunity they would have missed."),
]
for i in range(0, len(ideas), 2):
    story.append(Table([[card(ideas[i][0], ideas[i][1], 3.1 * inch, PALE), card(ideas[i+1][0], ideas[i+1][1], 3.1 * inch, PALE)]], colWidths=[3.25 * inch, 3.25 * inch], style=[
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
story.append(Spacer(1, 10))
story.append(p("Guardrails", "H2"))
story.append(bullet("Do not claim AI precision until match quality is measured and explainable."))
story.append(bullet("Do not send alerts from stale aggregators when an official source is available."))
story.append(bullet("Do not make every notification urgent. Let students control frequency and channel."))
story.append(bullet("Do not let campus growth become spam. Value must arrive before the ask to share."))
story.append(Spacer(1, 10))
story.append(p("Sources", "H2"))
story.append(p(
    "Pew Research Center, <i>Social Media Fact Sheet</i>, 2025. https://www.pewresearch.org/internet/fact-sheet/social-media/",
    "Small",
))
story.append(Spacer(1, 4))
story.append(p(
    "Pew Research Center, <i>How U.S. Adults Use TikTok</i>, 2024. https://www.pewresearch.org/internet/2024/02/22/how-u-s-adults-use-tiktok/",
    "Small",
))
story.append(Spacer(1, 4))
story.append(p(
    "Deloitte, <i>2025 Gen Z and Millennial Survey</i>. https://www.deloitte.com/cbc/en/issues/work/genz-millennial-survey.html",
    "Small",
))
story.append(Spacer(1, 14))
story.append(card(
    "Bottom line",
    "Promptly can win by being the fastest trusted bridge between a student's real interests and a live opportunity. Build the alert so well that students naturally show it to each other.",
    6.45 * inch,
    LAVENDER,
))

doc.build(story, onFirstPage=draw_cover, onLaterPages=draw_page)
print(OUT)
