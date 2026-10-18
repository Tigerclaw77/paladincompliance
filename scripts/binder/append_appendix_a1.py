#!/usr/bin/env python3
"""Append Appendix A-1 (Annual AI Governance Expenditure Record) to the
assembled binder DOCX files (Core PRINT/DIGITAL/plain, Master, Reference Library).
Idempotent. Adds a static TOC row where the Core 'Group | Section | Page' table
exists. Page numbers in static TOC tables are NOT recomputed (regenerate in Word).

usage: append_appendix_a1.py file.docx [...]
"""
import os, re, shutil, sys, tempfile, zipfile

SRC = os.path.join(os.path.dirname(__file__), "..", "..", "binder_source_ordered", "401_A_A-1_AI_Governance_Expenditure_Record.docx")
MARK = "A-1 Annual AI Governance Expenditure Record"
BOOKMARK = "toc_a_1"

def appendix_body():
    x = zipfile.ZipFile(SRC).read("word/document.xml").decode("utf-8")
    inner = x[x.index("<w:body>") + 8: x.rindex("<w:sectPr")]
    # Title -> Heading1 with a bookmark so the static TOC row can link to it
    inner = inner.replace('<w:pStyle w:val="Title"/>', '<w:pStyle w:val="Heading1"/>', 1)
    inner = re.sub(r"(<w:p>)(<w:pPr><w:pStyle w:val=\"Heading1\"/></w:pPr>)",
                   r'\1\2<w:bookmarkStart w:id="9001" w:name="%s"/>' % BOOKMARK, inner, count=1)
    inner = inner.replace(MARK + "</w:t></w:r></w:p>", MARK + "</w:t></w:r><w:bookmarkEnd w:id=\"9001\"/></w:p>", 1)
    pagebreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
    return pagebreak + inner

def add_toc_row(x):
    m = re.search(r"<w:t>Group</w:t>.*?<w:t>Section</w:t>.*?<w:t>Page</w:t>", x, re.S)
    if not m:
        return x
    tbl_end = x.index("</w:tbl>", m.end())
    rows = list(re.finditer(r"<w:tr>.*?</w:tr>", x[:tbl_end], re.S))
    last = rows[-1].group(0)
    cells = re.findall(r"<w:t>([^<]*)</w:t>", last)
    new = last
    texts = iter(["Appendix", MARK, "end"])
    def sub(mm):
        return "<w:t>%s</w:t>" % next(texts)
    new = re.sub(r"<w:t>[^<]*</w:t>", sub, new)
    new = re.sub(r"<w:bookmarkStart[^>]*/>|<w:bookmarkEnd[^>]*/>", "", new)
    new = new.replace('w:anchor="%s"' % re.search(r'w:anchor="([^"]*)"', last).group(1), 'w:anchor="%s"' % BOOKMARK) if 'w:anchor="' in last else new
    return x[:tbl_end] + new + x[tbl_end:]

def process(path):
    with zipfile.ZipFile(path) as zin:
        x = zin.read("word/document.xml").decode("utf-8")
        if BOOKMARK in x:
            return False
        x = add_toc_row(x)
        i = x.rindex("<w:sectPr")
        x = x[:i] + appendix_body() + x[i:]
        tmp = tempfile.mktemp(suffix=".docx")
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for it in zin.infolist():
                data = zin.read(it.filename)
                if it.filename == "word/document.xml":
                    data = x.encode("utf-8")
                zout.writestr(it, data)
    shutil.move(tmp, path)
    return True

if __name__ == "__main__":
    for f in sys.argv[1:]:
        print(("appended " if process(f) else "skipped  ") + os.path.basename(f))
