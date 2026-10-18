#!/usr/bin/env python3
"""Apply binder_text_rules to one or more .docx files in place (text runs only;
formatting, numbering, TOC fields and styles are untouched).

usage: sanitize_binder_docx.py [--dry-run] file.docx [...]
"""
import os, re, sys, zipfile, shutil, tempfile, html
sys.path.insert(0, os.path.dirname(__file__))
from binder_text_rules import transform_text, RECORD_DOC_KEYS, NOTICE_TEXT, NOTICE_ANCHORS

PARA = re.compile(r"<w:p[ >].*?</w:p>", re.S)
RUN = re.compile(r"<w:r[ >].*?</w:r>", re.S)

def add_notice(xml):
    """Insert NOTICE_TEXT after each anchor paragraph (idempotent)."""
    esc = html.escape(NOTICE_TEXT, quote=False)
    if esc in xml:
        return xml, 0
    n = 0
    def sub(m):
        nonlocal n
        p = m.group(0)
        text = html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)))
        if not any(text.startswith(a) for a in NOTICE_ANCHORS):
            return p
        runs = RUN.findall(p)
        if not runs:
            return p
        run = re.sub(r"<w:t(?: [^>]*)?>[^<]*</w:t>", '<w:t xml:space="preserve">' + esc + "</w:t>", runs[0], count=1)
        ppr = re.search(r"<w:pPr>.*?</w:pPr>", p, re.S)
        head = re.match(r"<w:p(?: [^>]*)?>", p).group(0)
        # drop paragraph ids so the clone does not duplicate w14:paraId
        head = re.sub(r' w14:(paraId|textId)="[^"]*"', "", head)
        clone = head + (ppr.group(0) if ppr else "") + run + "</w:p>"
        n += 1
        return p + clone
    return PARA.sub(sub, xml), n

HEAD = re.compile(r"^(FM-\d+|\d+\.\d+)\s+[A-Z]")
ASSEMBLED = re.compile(r"(Master|Core_Governance|Reference_Library)")
PARTS = re.compile(r"^(word/(document|footnotes|endnotes|header\d*|footer\d*)\.xml|docProps/(core|app)\.xml)$")
TEXT = re.compile(r"(<(?:w:t|dc:title|dc:subject|dc:description|cp:keywords|Title)(?: [^>]*)?>)([^<]*)(</)")

def process(path, dry=False):
    changed = 0
    hint = os.path.basename(path)
    tmp = tempfile.mktemp(suffix=".docx")
    with zipfile.ZipFile(path) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if PARTS.match(item.filename):
                s = data.decode("utf-8")
                def sub(m, rec=False):
                    nonlocal changed
                    raw = html.unescape(m.group(2))
                    if raw.startswith('Nature of this binder.'):
                        return m.group(0)
                    new = transform_text(raw, record_doc=rec)
                    if new != raw:
                        changed += 1
                        return m.group(1) + html.escape(new, quote=False) + m.group(3)
                    return m.group(0)
                if item.filename == 'word/document.xml':
                    state = {"rec": any(k in hint for k in RECORD_DOC_KEYS) and not ASSEMBLED.search(hint)}
                    def psub(pm):
                        ptxt = html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", pm.group(0))))
                        if ASSEMBLED.search(hint) and len(ptxt) < 160:
                            h = HEAD.match(ptxt.strip())
                            if h:
                                state["rec"] = h.group(1) in ("FM-1", "FM-3", "1.8")
                        return TEXT.sub(lambda m: sub(m, state["rec"]), pm.group(0))
                    s2 = PARA.sub(psub, s)
                    s2, added = add_notice(s2)
                    changed += added
                else:
                    s2 = TEXT.sub(lambda m: sub(m, any(k in hint for k in RECORD_DOC_KEYS) and not ASSEMBLED.search(hint)), s)
                data = s2.encode("utf-8")
            zout.writestr(item, data)
    if dry or not changed:
        os.unlink(tmp)
    else:
        shutil.move(tmp, path)
    return changed

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    dry = "--dry-run" in sys.argv
    for f in args:
        print(f"{process(f, dry):5d}  {os.path.basename(f)}")
