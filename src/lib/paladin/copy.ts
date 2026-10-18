// Shared public-facing copy. Keep claims conservative: Paladin is the issuer
// of its own records. Nothing here may imply independent review, certification,
// legal advice, or a guarantee of compliance with any law.

export const PRODUCT_NAME = "AI Policy & Evidence Binder";

export const DISCLAIMER_SHORT =
  "Documentation only. Not legal advice. Not a certification, audit, or guarantee, and not a HIPAA, TRAIGA, or other regulatory approval. Records are issued by Paladin Compliance, not by a government agency or independent third party.";

export const SUPPORTS_NOT_REPLACES =
  "A documented gesture that supports, and does not replace, responsible AI use. The binder records what your organization decided and spent; your people still have to follow the policy.";

export const SPEND_RECORD_FRAMING =
  "Keep a documented record of what your organization spends on AI compliance resources each year, so you can say \u201Cwe spent $X on AI compliance this year\u201D to a board, a budget committee, an insurer, or a client.";

export const REGISTRY_DEFINITION =
  "A public registry record showing this binder was issued to this organization.";

export const BINDER_USE_CASES = [
  "Insurance renewals and broker questionnaires",
  "Client and vendor security questionnaires",
  "Board, budget, and annual-spend records",
] as const;

// Mirrors the real binder assembly order (binder_assembly_order.md). Titles are
// shortened.
export const SAMPLE_TOC = [
  {
    part: "Front Matter",
    items: [
      "FM-1  Cover page and controlled-document identity",
      "FM-2  Controlled document and governance notice",
      "FM-3  Documented record, reliance boundaries, and institutional trust statement",
      "FM-4  Document control, revision history, and maintenance",
      "FM-6  Executive governance overview",
    ],
  },
  {
    part: "Section I \u2014 Governance Foundations",
    items: [
      "1.1\u20131.4  Overview, operating model, lifecycle, oversight structure",
      "1.5\u20131.7  Operational accountability, maturity reference, failure modes",
      "1.8\u20131.10  Public trust and registry record concepts, drift, escalation",
      "1.11\u20131.14  Evidence integrity, control drift, decision accountability, dependencies",
      "1.15\u20131.18  Change management, external reliance, self-review, stewardship",
    ],
  },
  {
    part: "Section II \u2014 Data, Vendors, and Risk",
    items: [
      "2.1\u20132.3  Sensitive information, exposure pathways, AI data handling",
      "2.4\u20132.5  Third-party AI vendors and record retention",
      "2.7\u20132.9  Incident classification, risk categories, high-risk workflows",
      "2.10\u20132.13  Review cadence, exposure chains, vendor tiering, risk severity",
      "2.14\u20132.15  Confidentiality classification and containment",
    ],
  },
  {
    part: "Section III \u2014 Safeguards and Operations",
    items: [
      "3.1\u20133.3  Safeguards, monitoring and review, maintenance and drift correction",
      "3.4\u20133.5  Evidence review and documentation structures, training and human oversight",
      "3.6\u20133.7  Incident response, integration and alignment",
      "3.8\u20133.9  Document stewardship, adoption roadmap",
    ],
  },
  {
    part: "Appendix",
    items: [
      "A-1  Annual AI governance expenditure record (log by date, category, vendor, amount, purpose; annual summary)",
    ],
  },
] as const;
