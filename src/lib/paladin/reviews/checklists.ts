// Recurring review checklists. Pure data and validation. A completed checklist
// is saved as an internal dated record; it is not an audit or a certification.

export const CHECKLIST_VERSION = "1.0";

export type ChecklistItem = { id: string; text: string };
export type ChecklistDefinition = {
  key: string;
  title: string;
  cadence: string;
  purpose: string;
  items: ChecklistItem[];
};

export const CHECKLISTS: ChecklistDefinition[] = [
  {
    key: "ai_tool_inventory",
    title: "AI tool inventory review",
    cadence: "Quarterly (a calendar reminder is sent about a week before)",
    purpose:
      "Confirm the list of AI tools actually in use matches the approved list, and that each has an owner and a known data boundary.",
    items: [
      { id: "list_current", text: "The written list of AI tools is up to date: each tool has a name, plan type (free/paid, work/personal account), business owner, and purpose." },
      { id: "ask_staff", text: "Staff were asked (email, meeting, or short form) which AI tools they use for work, including free tools, browser extensions, meeting bots, and AI features built into existing software." },
      { id: "unapproved_handled", text: "Any tool found in use that is not approved was either approved after review or stopped, and the decision was noted." },
      { id: "data_types", text: "For each tool, the types of information allowed in it are stated (for example: public only; internal; client information allowed)." },
      { id: "accounts_work", text: "Work accounts (not personal accounts) are used where available, and former staff access was removed." },
      { id: "settings_checked", text: "Key settings were checked for each material tool: data retention, use of inputs for model training, sharing links, and who can see chat history." },
      { id: "retired", text: "Tools no longer used were retired and their accounts closed or data deleted where possible." },
      { id: "spend_logged", text: "AI-related spend for the period (subscriptions, services, training) was entered in the AI Spend Record." },
    ],
  },
  {
    key: "vendor_review",
    title: "AI vendor review",
    cadence: "Semiannual, and before adopting a new AI vendor that will touch client or business information",
    purpose:
      "Check what each AI vendor does with your information and whether anything changed since the last review.",
    items: [
      { id: "terms_read", text: "Current terms of service, privacy policy and data processing terms were read (not assumed) for each material vendor, and the review date was noted." },
      { id: "retention", text: "The vendor's data retention and deletion options are understood, including how long prompts, files and outputs are kept." },
      { id: "training_use", text: "It is clear whether your inputs are used to train or improve models, and the setting matches the organization's rule for that data type." },
      { id: "subprocessors", text: "The vendor's subprocessors or hosting locations were reviewed for anything that conflicts with your contracts or client expectations." },
      { id: "security", text: "The vendor's security information (for example, a published security page, independent security report, or breach notification commitment) was reviewed for material vendors." },
      { id: "contract_flowdown", text: "Client contracts, insurance applications and questionnaires were checked for AI or subcontractor language that this vendor could affect." },
      { id: "changes", text: "Material changes since the last review (new features, pricing, ownership, terms) were identified and handled." },
      { id: "exit", text: "You know how to export your data and end the relationship with each material vendor." },
      { id: "record", text: "The outcome for each vendor (continue, restrict, replace, stop) was recorded." },
    ],
  },
];

export function getChecklist(key: string) {
  return CHECKLISTS.find((checklist) => checklist.key === key) ?? null;
}

export const REVIEW_LIMITS = { name: 120, notes: 4000 };

export type ReviewRecordInput = {
  checklistKey: string;
  reviewedOn: string;
  reviewerName: string;
  checkedItemIds: string[];
  notes: string;
};

export function validateReviewInput(
  raw: {
    checklistKey?: unknown;
    reviewedOn?: unknown;
    reviewerName?: unknown;
    checkedItemIds?: unknown;
    notes?: unknown;
  },
  today: Date = new Date()
): { ok: true; value: ReviewRecordInput } | { ok: false; error: string } {
  const checklist = getChecklist(String(raw.checklistKey ?? ""));

  if (!checklist) {
    return { ok: false, error: "Unknown checklist." };
  }

  const reviewerName = String(raw.reviewerName ?? "").trim();
  const reviewedOn = String(raw.reviewedOn ?? "").trim();
  const notes = String(raw.notes ?? "").trim();

  if (reviewerName.length < 2 || reviewerName.length > REVIEW_LIMITS.name) {
    return { ok: false, error: "Enter the reviewer's name (2-120 characters)." };
  }

  if (notes.length > REVIEW_LIMITS.notes) {
    return { ok: false, error: "Notes must be 4000 characters or fewer." };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(reviewedOn);
  const parsed = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : null;

  if (!parsed || parsed.toISOString().slice(0, 10) !== reviewedOn) {
    return { ok: false, error: "Enter the review date as YYYY-MM-DD." };
  }

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  if (parsed.getTime() > todayUtc + 86_400_000) {
    return { ok: false, error: "The review date cannot be in the future." };
  }

  const known = new Set(checklist.items.map((item) => item.id));
  const checked = Array.isArray(raw.checkedItemIds)
    ? [...new Set(raw.checkedItemIds.map(String))].filter((id) => known.has(id))
    : [];

  return {
    ok: true,
    value: {
      checkedItemIds: checked,
      checklistKey: checklist.key,
      notes,
      reviewedOn,
      reviewerName,
    },
  };
}
