"""Text rules that keep binder source documents aligned with the
'AI Policy & Evidence Binder' positioning: a documented record, NOT
third-party assurance, verification, certification, or coverage.

Idempotent: running the rules on already-converted text changes nothing.
Rules are applied in order; each rule is case-preserving (initial capital).
"""
import re

# Exact title / heading replacements (applied first, also to file names via
# the underscore variant).
TITLES = [
    ("Public Trust & Verification Concepts", "Public Trust & Registry Record Concepts"),
    ("Public Trust & Documentation Concepts", "Public Trust & Registry Record Concepts"),
    ("Controlled Governance Verification Endpoint", "Controlled Governance Registry Record Endpoint"),
    ("Controlled Governance evidence review Endpoint", "Controlled Governance Registry Record Endpoint"),
    ("Controlled Artifact Identity, Verification, Revision, and Executive Orientation", "Controlled Artifact Identity, Registry Record, Revision, and Executive Orientation"),
    ("Controlled Artifact Identity, Evidence review, Revision, and Executive Orientation", "Controlled Artifact Identity, Registry Record, Revision, and Executive Orientation"),
    ("[QR Verification Placeholder]", "[QR Registry Reference Placeholder]"),
    ("QR Verification", "QR Registry Reference"),
    ("Verification Status", "Registry Record Status"),
    ("Verification, Assurance, and Institutional Trust Statement",
     "Documented Record, Reliance Boundaries, and Institutional Trust Statement"),
    ("Public Trust and Verification Concepts",
     "Public Trust and Registry Record Concepts"),
    ("Governance Assurance, Institutional Trust, and External Reliance",
     "Governance Representations, Institutional Trust, and External Reliance"),
    ("Operational Review, Assurance Validation, and Control Observability",
     "Operational Review, Representation Validation, and Control Observability"),
    ("Governance Verification, Evidence Substantiation, Assurance Defense, and Operational Proof Structures",
     "Governance Evidence Review, Evidence Substantiation, Representation Defense, and Operational Documentation Structures"),
]


SENT_REG = "The registry record shows only that this binder was issued to the named organization. It is not an audit, certification, assurance, or verification of compliance."
SENT_PURPOSE = "Purpose: locate the registry record for this binder, including its issue date, revision, and current status (active, superseded, or withdrawn)."
# Replacement sentences that legitimately contain the disclaimed words; they are
# swapped in behind placeholders so the phrase rules cannot rewrite them.
PROTECTED = [
    ("This record is the organization\u2019s own, unaudited documentation of AI governance spending. It is not accounting, tax, legal, or insurance advice, and it is not an audit, certification, assurance, or verification by Paladin Compliance or any third party. Figures are only as accurate as the entries the organization makes and the invoices it keeps.", None),
    ("Do not describe this figure as a measure of compliance, safety, or insurability, and do not describe it as certified, verified, or assured by Paladin Compliance or any other party.", None),
    ("Purpose: verify authentic controlled artifact, stewardship identity, revision continuity, supersession or withdrawal status, and governance traceability.", SENT_PURPOSE),
    ("The endpoint supports controlled artifact authenticity. It does not replace evidence review where reliance is material.", SENT_REG),
    ("The registry record shows only that this binder was issued to the named organization. It is not an audit, certification, confidence, or evidence review of compliance.", SENT_REG),
    (SENT_REG, SENT_REG),
    (SENT_PURPOSE, SENT_PURPOSE),
]

# (pattern, replacement) -- lower-case patterns; case is restored from match.
PHRASES = [
    # --- explicit statements about Paladin / the registry -----------------
    (r"\bqr verification\b", "qr registry reference"),
    (r"\bverification status\b", "registry record status"),
    (r"\bverification placeholder\b", "registry reference placeholder"),
    (r"\borganization-specific verification routing\b", "organization-specific registry record routing"),
    (r"\bmaintained verification or register process\b", "maintained registry record process"),
    (r"\bunconditional certification\b", "any certification"),
    (r"\babsolute certification\b", "certification"),
    (r"\buniversal certification\b", "certification"),
    (r"\bpermanent assurance\b", "permanent confidence"),
    (r"\bunconditional assurance\b", "unconditional confidence"),
    (r"\blegal certification posture\b", "legal certification or attestation"),
    # --- verification as a trust signal -> registry record / evidence review
    (r"\bpublic verification\b", "public registry record"),
    (r"\bverification (pages?|signals?|status|identity|channels?)\b", lambda m: "registry record " + m.group(1)),
    (r"\bverification (records?|references?|elements?)\b", lambda m: "registry " + m.group(1)),
    (r"\bverification (statements?|language|narratives?|content|update|materials?|category|concern|challenge|pressure|model|structure|treatment|limitation|ownership|maintenance|integrity|freshness|survivability|misuse|overextension|synthesis|boundary|boundaries)\b",
     lambda m: "documentation " + m.group(1)),
    (r"\b(maintained|visible|prior|current|governed) verification\b", lambda m: m.group(1) + " registry record"),
    (r"\bexceed verified (support|facts)\b", lambda m: "exceed documented " + m.group(1)),
    (r"\bverified recommendations\b", "reviewed recommendations"),
    (r"\bsubstitute for verified understanding\b", "substitute for reviewed understanding"),
    (r"\bimpact from verified consequence\b", "impact from reviewed consequence"),
    (r"\bgovernance verification\b", "governance evidence review"),
    # --- assurance ---------------------------------------------------------
    (r"\bassurance defense mechanisms\b", "representation defense mechanisms"),
    (r"\bassurance defense\b", "representation defense"),
    (r"\bassurance validation\b", "representation validation"),
    (r"\bcustomer assurance (response|packet|request|volume)s?\b", lambda m: "customer " + m.group(1)),
    (r"\bcustomer assurance\b", "customer confidence"),
    (r"\bvendor-provided assurances?\b", "vendor-provided representations"),
    (r"\bvendor assurances?\b", "vendor representations"),
    (r"\bassurances\b", "confidence statements"),
    (r"\ban assurance\b", "a confidence"),
    (r"\bassure\b", "reassure"),
    (r"\bassurance\b", "confidence"),
]

def _case(src, dst, before=""):
    if src.isupper() and len(src) > 3:
        return dst.upper()
    words = src.split(" ")
    if len(words) > 1 and all(w[:1].isupper() for w in words):
        return " ".join(w[:1].upper() + w[1:] for w in dst.split(" "))
    if src[:1].isupper():
        # Title Case when it follows another capitalised heading word
        prev = before.rstrip().split(" ")[-1] if before.strip() else ""
        if prev[:1].isupper() and not before.rstrip().endswith((".", ":", "?", "!")) and len(prev) > 1:
            return " ".join(w[:1].upper() + w[1:] for w in dst.split(" "))
        return dst[:1].upper() + dst[1:]
    return dst

def transform_text(text, titles=True, record_doc=False):
    out = text
    holds = []
    for a, b in PROTECTED:
        if a in out:
            out = out.replace(a, '\x00%d\x00' % len(holds))
            holds.append(b if b is not None else a)
    if titles:
        for a, b in TITLES:
            out = out.replace(a, b)
            out = out.replace(a.replace(", ", " ").replace(",", ""), b.replace(", ", " ").replace(",", ""))
            out = out.replace(a.replace(" ", "_").replace(",", ""), b.replace(" ", "_").replace(",", ""))
    for pat, rep in PHRASES:
        rx = re.compile(pat, re.I)
        def sub(m, rep=rep):
            r = rep(m) if callable(rep) else rep
            return _case(m.group(0), r, m.string[:m.start()])
        out = rx.sub(sub, out)
    if record_doc:
        out = re.sub(r"\bverification\b", lambda m: _case(m.group(0), "documentation", m.string[:m.start()]), out, flags=re.I)
        out = re.sub(r"\bverified\b", lambda m: _case(m.group(0), "documented"), out, flags=re.I)
        out = re.sub(r"\bverify\b", lambda m: _case(m.group(0), "confirm"), out, flags=re.I)
    else:
        out = re.sub(r"(?<!operational )(?<!source )(?<!human )(?<!factual )(?<!authority )(?<!with )(?<!coverage )\bverification\b",
                     lambda m: _case(m.group(0), "evidence review", m.string[:m.start()]), out, flags=re.I)
    for i, h in enumerate(holds):
        out = out.replace('\x00%d\x00' % i, h)
    return out

# Documents whose subject IS the documented-record / registry signal.
RECORD_DOC_KEYS = ("FM-1", "FM-3", "1.8_", "_FM_Cover", "_FM_Verification", "Public_Trust", "Documented_Record", "_FM_Documented", "FM-1_Cover")

def transform_text_for_doc(text, doc_hint=""):
    return transform_text(text, record_doc=any(k in doc_hint for k in RECORD_DOC_KEYS))


NOTICE_TEXT = (
    "Nature of this binder. Paladin Compliance provides documentation tools and templates. "
    "This binder, and any Paladin registry record issued with it, are a documented record of the "
    "organization\u2019s own AI policies and evidence. They are not an audit, assessment, certification, "
    "third-party assurance, or verification of compliance; they are not legal advice; and they do not "
    "provide, change, or substitute for insurance coverage. Where this binder uses terms such as "
    "confidence, reliance, or documentation, they describe the organization\u2019s own representations "
    "and the care needed to keep them accurate."
)
# Paragraph (start of text) after which NOTICE_TEXT is inserted as a clone.
NOTICE_ANCHORS = (
    "This front matter section establishes the binder as a controlled governance artifact intended to be adopted",
    "This front matter section establishes documentation as a bounded governance signal",
)
