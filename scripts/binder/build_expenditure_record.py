#!/usr/bin/env python3
"""Builds the Annual AI Governance Expenditure Record templates:
  - binder_source_ordered/401_A_A-1_AI_Governance_Expenditure_Record.docx (+ root copy)
  - public/templates/Paladin_AI_Governance_Expenditure_Record.xlsx
  - public/templates/Paladin_AI_Governance_Expenditure_Log.csv
Run from repo root:  python3 scripts/binder/build_expenditure_record.py
The DOCX reuses the style/footer/numbering parts of FM-6 so it assembles
like every other binder source document.
"""
import copy, os, shutil, csv
import docx
from docx.shared import Pt, RGBColor
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = "17365D"; INK = "2F3A4A"; GREY = "66758A"; LINE = "B9C4D1"; SHADE = "EEF3F8"

CATEGORIES = [
    ("Policy & governance program", "Drafting or maintaining AI use policies, this binder, templates, governance tooling subscriptions."),
    ("Legal & regulatory advice", "Outside counsel or consultants advising on AI use, contracts, privacy, or regulatory questions."),
    ("Training & awareness", "Staff training, courses, workshops, and awareness materials about acceptable AI use."),
    ("Vendor review & due diligence", "Time or fees spent reviewing AI vendors, security questionnaires, data-processing terms."),
    ("Tools, logging & monitoring", "Software or services used to log, monitor, or control AI use (not the AI tools themselves)."),
    ("Third-party assessments", "Assessments, audits, or penetration tests the organization itself commissioned from an independent firm."),
    ("Incident response & remediation", "Costs of reviewing, containing, or correcting an AI-related incident or finding."),
    ("Insurance (AI-related)", "Premium or endorsement cost for an actual insurance policy that addresses AI-related risk."),
    ("Internal staff time (allocated)", "Documented, reasonable allocation of staff time spent on AI governance; state the method in Notes."),
    ("Other", "Anything else the organization considers AI governance spending; explain in Purpose."),
]
TYPES = ["One-time", "Recurring"]
LOG_COLS = ["Date (YYYY-MM-DD)", "Category", "Vendor / Payee", "Purpose", "Amount (USD)", "One-time / Recurring", "Invoice or reference", "Approved by", "Notes"]

NOTICE = ("This record is the organization\u2019s own, unaudited documentation of AI governance spending. "
          "It is not accounting, tax, legal, or insurance advice, and it is not an audit, certification, "
          "assurance, or verification by Paladin Compliance or any third party. Figures are only as accurate "
          "as the entries the organization makes and the invoices it keeps.")

# ----------------------------------------------------------------- DOCX
def run(p, text, bold=False, color=INK, size=9):
    r = p.add_run(text); r.bold = bold
    r.font.name = "Aptos"; r._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
    r.font.size = Pt(size); r.font.color.rgb = RGBColor.from_string(color)
    return r

def para(d, text="", bold=False, color=INK, size=9, after=6, keep_next=False):
    p = d.add_paragraph()
    pf = p.paragraph_format; pf.space_after = Pt(after); pf.space_before = Pt(0)
    pf.keep_with_next = keep_next
    if text: run(p, text, bold, color, size)
    return p

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:val"), "clear"); shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), fill)
    tcPr.append(shd)

def borders(cell):
    tcPr = cell._tc.get_or_add_tcPr()
    b = OxmlElement("w:tcBorders")
    for side in ("top", "left", "bottom", "right"):
        e = OxmlElement(f"w:{side}")
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "8"); e.set(qn("w:space"), "0"); e.set(qn("w:color"), LINE)
        b.append(e)
    tcPr.append(b)

def table(d, header, rows, widths, blank_rows=0):
    t = d.add_table(rows=1, cols=len(header)); t.style = "Table Grid"; t.autofit = False
    tblPr = t._tbl.tblPr
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    def fill(row, vals, head=False):
        for i, v in enumerate(vals):
            c = row.cells[i]; c.width = widths[i]
            borders(c)
            if head: shade(c, SHADE)
            p = c.paragraphs[0]; p.paragraph_format.space_after = Pt(2); p.paragraph_format.space_before = Pt(2)
            run(p, v, bold=head, color=NAVY if head else INK, size=8)
        trPr = row._tr.get_or_add_trPr(); trPr.append(OxmlElement("w:cantSplit"))
    fill(t.rows[0], header, True)
    for r in rows: fill(t.add_row(), r)
    for _ in range(blank_rows): fill(t.add_row(), [""] * len(header))
    d.add_paragraph().paragraph_format.space_after = Pt(4)
    return t

def build_docx(out):
    src = "binder_source_ordered/006_FM_Executive_Governance_Overview.docx"
    d = docx.Document(src)
    body = d.element.body
    for el in list(body):
        if el.tag != qn("w:sectPr"):
            body.remove(el)
    from docx.shared import Emu
    W = lambda n: Emu(int(n / 100 * 6400000))
    t = d.add_paragraph(style="Title"); run(t, "A-1 Annual AI Governance Expenditure Record", True, NAVY, 18.5)
    para(d, "Paladin Compliance Governance Binder | Appendix", True, GREY, 9, 10)
    para(d, NOTICE, False, INK, 9, 8)
    para(d, "Purpose and Use", True, NAVY, 9, 3, True)
    para(d, "This appendix lets the organization keep a documented record of what it spends on AI governance during a fiscal year: policy work, training, vendor review, tooling, advice, and similar items. The log records each expenditure by date, category, vendor, amount, and purpose. The annual summary totals the log by category and quarter so the organization can state, for its own board, budget, insurer, or client conversations, what it recorded as spent during the year.")
    para(d, "Use the same fiscal year as the organization\u2019s accounting records. Record an expenditure when it is paid or invoiced, consistently. Keep the invoice or reference number so each entry can be traced to a source. Do not include the cost of the AI tools the organization uses for its work unless it deliberately treats a specific item as governance spending and explains why in Purpose.")
    para(d, "A spend figure documents effort and resources. It does not show that controls work, that the organization complies with any law or contract, or that any insurer, customer, or regulator will accept it.")

    para(d, "Part 1. Record Identification", True, NAVY, 9, 3, True)
    table(d, ["Field", "Entry"], [
        ["Organization name", ""], ["Fiscal year (start \u2013 end)", ""], ["Prepared by (name, role)", ""],
        ["Date prepared", ""], ["Reviewed or approved by (name, role)", ""], ["Date reviewed", ""],
        ["Currency and accounting basis", "USD; cash / accrual (circle one)"],
    ], [W(38), W(62)])

    para(d, "Part 2. Spending Categories", True, NAVY, 9, 3, True)
    para(d, "Use one category per entry. Add context in Purpose or Notes. If an entry spans categories, split it into separate lines.")
    table(d, ["Category", "What belongs here"], [[c, n] for c, n in CATEGORIES], [W(32), W(68)])

    para(d, "Part 3. Expenditure Log", True, NAVY, 9, 3, True)
    para(d, "Record one line per expenditure. Add pages as needed or use the companion spreadsheet (Paladin_AI_Governance_Expenditure_Record.xlsx), whose Annual Summary totals the log automatically.")
    table(d, ["Date", "Category", "Vendor / Payee", "Purpose", "Amount (USD)", "Invoice / reference"],
          [], [W(11), W(20), W(18), W(27), W(11), W(13)], blank_rows=14)
    para(d, "Optional columns kept in the spreadsheet: one-time or recurring, approved by, and notes.", False, GREY, 8)

    para(d, "Part 4. Annual Summary", True, NAVY, 9, 3, True)
    para(d, "Total each category from the log. Quarter columns follow the fiscal year start.")
    table(d, ["Category", "Q1", "Q2", "Q3", "Q4", "Annual total", "% of total"],
          [[c, "", "", "", "", "", ""] for c, _ in CATEGORIES] + [["Total", "", "", "", "", "", "100%"]],
          [W(30), W(11), W(11), W(11), W(11), W(14), W(12)])
    table(d, ["Comparison", "Entry"], [
        ["Prior fiscal year total (if recorded)", ""], ["Change from prior year (amount and %)", ""],
        ["Number of log entries this year", ""], ["Largest single category and why", ""],
    ], [W(45), W(55)])

    para(d, "Part 5. Annual Statement", True, NAVY, 9, 3, True)
    para(d, "Complete after the summary is reviewed. Suggested wording for internal, board, or customer use:")
    para(d, "\u201CFor fiscal year [year], [organization] recorded [$total] in AI governance spending across [n] entries, mainly in [top categories]. This is the organization\u2019s own unaudited record, kept with supporting invoices.\u201D", False, NAVY, 9, 6)
    para(d, "Do not describe this figure as a measure of compliance, safety, or insurability, and do not describe it as certified, verified, or assured by Paladin Compliance or any other party.")

    para(d, "Part 6. Review and Retention", True, NAVY, 9, 3, True)
    table(d, ["Item", "Entry"], [
        ["Invoices and references retained at (location)", ""], ["Retention period set by organization", ""],
        ["Reviewer confirms entries match source invoices (initials, date)", ""],
        ["Known gaps or estimates in this record", ""],
        ["Next scheduled review date", ""],
    ], [W(55), W(45)])
    para(d, "Retain this record with other governance evidence under the organization\u2019s retention practice (see Section 2.5). Update the record at least once per fiscal year.", False, INK, 9)
    d.core_properties.title = "A-1 Annual AI Governance Expenditure Record"
    d.core_properties.subject = "Paladin Compliance Governance Binder appendix"
    d.save(out)
    # footer text
    import zipfile, tempfile
    tmp = tempfile.mktemp(suffix=".docx")
    with zipfile.ZipFile(out) as zi, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            data = zi.read(it.filename)
            if it.filename == "word/footer1.xml":
                data = data.replace(b"Paladin Compliance Governance Binder | Front Matter", b"Paladin Compliance Governance Binder | Appendix A-1")
            zo.writestr(it, data)
    shutil.move(tmp, out)

# ----------------------------------------------------------------- XLSX / CSV
def build_xlsx(out):
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.worksheet.datavalidation import DataValidation
    wb = openpyxl.Workbook()
    hdr = PatternFill("solid", fgColor=SHADE); hf = Font(bold=True, color=NAVY)
    thin = Side(style="thin", color=LINE); bd = Border(left=thin, right=thin, top=thin, bottom=thin)
    ws = wb.active; ws.title = "Instructions"
    lines = [
        ("Annual AI Governance Expenditure Record", True),
        ("Paladin Compliance Governance Binder | Appendix A-1", False),
        ("", False), (NOTICE, False), ("", False),
        ("How to use", True),
        ("1. Enter the organization name and fiscal year start date on the Annual Summary sheet.", False),
        ("2. Record one row per expenditure on the Expenditure Log sheet (date, category, vendor, purpose, amount).", False),
        ("3. The Annual Summary totals the log by category and fiscal quarter, and by one-time vs recurring.", False),
        ("4. Keep the invoice or reference for every row. Review once per fiscal year.", False),
        ("5. A spend total documents effort and resources. It is not a measure of compliance, safety, or insurability.", False),
        ("", False), ("Categories", True),
    ]
    for i, (t, b) in enumerate(lines, 1):
        c = ws.cell(i, 1, t); c.font = Font(bold=b, color=NAVY if b else INK, size=13 if i == 1 else 11)
        c.alignment = Alignment(wrap_text=True, vertical="top")
    r = len(lines) + 1
    for cat, note in CATEGORIES:
        ws.cell(r, 1, cat).font = Font(bold=True); ws.cell(r, 2, note).alignment = Alignment(wrap_text=True); r += 1
    ws.column_dimensions["A"].width = 60; ws.column_dimensions["B"].width = 90

    cats = wb.create_sheet("Categories")
    cats.append(["Category", "What belongs here"])
    for c, n in CATEGORIES: cats.append([c, n])
    cats.column_dimensions["A"].width = 34; cats.column_dimensions["B"].width = 100
    for c in cats[1]: c.fill = hdr; c.font = hf

    log = wb.create_sheet("Expenditure Log")
    log.append(LOG_COLS)
    for c in log[1]: c.fill = hdr; c.font = hf; c.border = bd; c.alignment = Alignment(wrap_text=True)
    widths = [16, 30, 26, 44, 16, 18, 24, 20, 36]
    for i, w in enumerate(widths): log.column_dimensions[chr(65 + i)].width = w
    N = 500
    for row in range(2, N + 2):
        log.cell(row, 1).number_format = "yyyy-mm-dd"
        log.cell(row, 5).number_format = '"$"#,##0.00'
        for col in range(1, 10): log.cell(row, col).border = bd
    dv = DataValidation(type="list", formula1=f"=Categories!$A$2:$A${len(CATEGORIES)+1}", allow_blank=True); log.add_data_validation(dv); dv.add(f"B2:B{N+1}")
    dv2 = DataValidation(type="list", formula1='"One-time,Recurring"', allow_blank=True); log.add_data_validation(dv2); dv2.add(f"F2:F{N+1}")
    dv3 = DataValidation(type="decimal", operator="greaterThanOrEqual", formula1="0", allow_blank=True,
                         errorTitle="Amount", error="Enter a non-negative number; record refunds as a separate note."); log.add_data_validation(dv3); dv3.add(f"E2:E{N+1}")
    log.freeze_panes = "A2"
    # one example row, clearly labeled
    log.append([])
    ex = wb.create_sheet("Example (delete)")
    ex.append(LOG_COLS)
    ex.append(["2026-02-14", "Training & awareness", "Example Training Co.", "Staff session on acceptable AI use", 450, "One-time", "INV-1042", "Operations lead", "Illustrative entry only"])
    ex.append(["2026-03-01", "Policy & governance program", "Example Vendor", "Annual subscription for policy tooling", 499, "Recurring", "INV-2210", "Operations lead", "Illustrative entry only"])
    for c in ex[1]: c.fill = hdr; c.font = hf
    for i, w in enumerate(widths): ex.column_dimensions[chr(65 + i)].width = w

    s = wb.create_sheet("Annual Summary", 1)
    s["A1"] = "Annual AI Governance Expenditure Summary"; s["A1"].font = Font(bold=True, size=13, color=NAVY)
    s["A2"] = "Organization"; s["B2"] = ""
    s["A3"] = "Fiscal year start date"; s["B3"] = None; s["B3"].number_format = "yyyy-mm-dd"
    s["C3"] = "(enter date, e.g. 2026-01-01)"
    s["A4"] = "Fiscal year end date"; s["B4"] = '=IF(B3="","",EDATE(B3,12)-1)'; s["B4"].number_format = "yyyy-mm-dd"
    s["A5"] = "Prior fiscal year total (optional)"; s["B5"].number_format = '"$"#,##0.00'
    for a in ("A2", "A3", "A4", "A5"): s[a].font = Font(bold=True)
    heads = ["Category", "Q1", "Q2", "Q3", "Q4", "Annual total", "% of total", "Entries"]
    s.append([]); s.append(heads)
    hr = 7
    for c in s[hr]: c.fill = hdr; c.font = hf; c.border = bd
    rng = lambda col: f"'Expenditure Log'!${col}$2:${col}${N+1}"
    first = hr + 1
    for i, (cat, _) in enumerate(CATEGORIES):
        r = first + i
        s.cell(r, 1, cat)
        for q in range(4):
            a = f'EDATE($B$3,{3*q})'; b = f'EDATE($B$3,{3*(q+1)})'
            s.cell(r, 2 + q, f'=IF($B$3="",0,SUMIFS({rng("E")},{rng("B")},$A{r},{rng("A")},">="&{a},{rng("A")},"<"&{b}))')
        s.cell(r, 6, f"=SUM(B{r}:E{r})")
        s.cell(r, 8, f'=IF($B$3="",0,COUNTIFS({rng("B")},$A{r},{rng("A")},">="&$B$3,{rng("A")},"<"&EDATE($B$3,12)))')
    last = first + len(CATEGORIES) - 1; tot = last + 1
    s.cell(tot, 1, "Total").font = Font(bold=True)
    for col in range(2, 7): s.cell(tot, col, f"=SUM({chr(64+col)}{first}:{chr(64+col)}{last})").font = Font(bold=True)
    s.cell(tot, 8, f"=SUM(H{first}:H{last})").font = Font(bold=True)
    for r in range(first, tot + 1):
        s.cell(r, 7, f'=IF($F${tot}=0,0,F{r}/$F${tot})').number_format = "0.0%"
        for col in range(2, 7): s.cell(r, col).number_format = '"$"#,##0.00'
        for col in range(1, 9): s.cell(r, col).border = bd
    n = tot + 2
    s.cell(n, 1, "Recurring spend"); s.cell(n, 2, f'=IF($B$3="",0,SUMIFS({rng("E")},{rng("F")},"Recurring",{rng("A")},">="&$B$3,{rng("A")},"<"&EDATE($B$3,12)))')
    s.cell(n + 1, 1, "One-time spend"); s.cell(n + 1, 2, f'=IF($B$3="",0,SUMIFS({rng("E")},{rng("F")},"One-time",{rng("A")},">="&$B$3,{rng("A")},"<"&EDATE($B$3,12)))')
    s.cell(n + 2, 1, "Change from prior year"); s.cell(n + 2, 2, f'=IF(B5="","",F{tot}-B5)')
    s.cell(n + 3, 1, "Rows outside the fiscal year or without a category (check these)")
    s.cell(n + 3, 2, f'=COUNTA({rng("E")})-H{tot}')
    for r in range(n, n + 3): s.cell(r, 2).number_format = '"$"#,##0.00'
    s.cell(n + 5, 1, "Annual statement").font = Font(bold=True)
    s.cell(n + 6, 1, f'="For fiscal year starting "&TEXT($B$3,"yyyy-mm-dd")&", "&$B$2&" recorded "&TEXT(F{tot},"$#,##0.00")&" in AI governance spending across "&H{tot}&" entries. This is the organization\'s own unaudited record, kept with supporting invoices."')
    s.cell(n + 7, 1, NOTICE).alignment = Alignment(wrap_text=True, vertical="top")
    s.merge_cells(start_row=n + 6, start_column=1, end_row=n + 6, end_column=8)
    s.merge_cells(start_row=n + 7, start_column=1, end_row=n + 7, end_column=8)
    s.row_dimensions[n + 6].height = 32; s.row_dimensions[n + 7].height = 48
    s.cell(n + 6, 1).alignment = Alignment(wrap_text=True, vertical="top")
    s.column_dimensions["A"].width = 40
    for col in "BCDEFGH": s.column_dimensions[col].width = 16
    wb.save(out)

def build_csv(out):
    with open(out, "w", newline="") as f:
        w = csv.writer(f); w.writerow(LOG_COLS)

if __name__ == "__main__":
    os.makedirs("public/templates", exist_ok=True)
    name = "401_A_A-1_AI_Governance_Expenditure_Record.docx"
    build_docx("binder_source_ordered/" + name)
    shutil.copy("binder_source_ordered/" + name, "Paladin_Compliance_A-1_AI_Governance_Expenditure_Record.docx")
    build_xlsx("public/templates/Paladin_AI_Governance_Expenditure_Record.xlsx")
    build_csv("public/templates/Paladin_AI_Governance_Expenditure_Log.csv")
    print("built")
