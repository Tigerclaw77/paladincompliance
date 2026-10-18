// Training module content. Pure data (no server imports) so it can be unit
// tested and printed. These are short, plain-language staff reading modules
// that end in an acknowledgment. They are NOT a course with grading, NOT
// certification, and NOT legal advice; an organization should adapt them to its
// own policy and have counsel review where regulated.

export const TRAINING_CONTENT_VERSION = "1.0";
export const TRAINING_REFRESH_MONTHS = 12;

export type TrainingSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type TrainingModuleContent = {
  slug: string;
  title: string;
  version: string;
  minutes: number;
  summary: string;
  audience: string;
  sections: TrainingSection[];
  selfCheck: { question: string; answer: string }[];
  acknowledgment: string;
};

export const TRAINING_ACKNOWLEDGMENT_NOTICE =
  "A training acknowledgment records that a named person read a module on a date. It is an internal record, not a certification, test result, or finding of competence.";

export const TRAINING_MODULES: TrainingModuleContent[] = [
  {
    slug: "ai-acceptable-use",
    title: "AI Acceptable Use",
    version: TRAINING_CONTENT_VERSION,
    minutes: 8,
    audience: "Everyone who uses AI tools for work, including occasional use.",
    summary:
      "What AI tools may be used for at work, what needs a second pair of eyes, and what is off limits.",
    sections: [
      {
        heading: "Why this exists",
        paragraphs: [
          "AI chat assistants, writing tools, meeting note-takers and coding helpers save time, but they also make confident mistakes and move information outside the organization. This module sets simple ground rules so people can use AI without creating avoidable problems for clients, patients, colleagues, or the organization.",
          "You remain responsible for anything you send, file, or decide, whether or not AI helped produce it.",
        ],
      },
      {
        heading: "Use only approved tools",
        bullets: [
          "Use the AI tools your organization has approved. If a tool is not on the approved list, ask before using it for work, even if it is free or you already use it personally.",
          "Use a work account, not a personal account, when a work account is available. Personal accounts are outside the organization's control and records.",
          "Do not install browser extensions, plug-ins, or meeting bots that connect to work email, calendars, or files without approval.",
        ],
      },
      {
        heading: "What AI may help with",
        bullets: [
          "Drafting and editing text you will review: emails, outlines, summaries of non-confidential material.",
          "Brainstorming, formatting, and explaining general concepts.",
          "Summarizing or analyzing information that is public or that the organization has approved for that tool.",
        ],
      },
      {
        heading: "What needs human review before use",
        paragraphs: [
          "Treat AI output as a first draft from a fast but unreliable assistant. Check facts, names, numbers, citations and quotes against a trusted source before relying on them. AI tools can invent sources and details that look real.",
        ],
        bullets: [
          "Anything sent to a client, patient, regulator, insurer, court, or the public.",
          "Anything that affects a person's job, pay, health, money, eligibility, or access to a service.",
          "Legal, medical, tax, financial, or safety content. AI is not a substitute for a qualified professional.",
        ],
      },
      {
        heading: "What is off limits unless leadership has approved it in writing",
        bullets: [
          "Making or recommending decisions about hiring, firing, discipline, credit, coverage, diagnosis, or eligibility from AI output alone.",
          "Presenting AI-generated work as entirely your own where your clients or profession expect disclosure.",
          "Using AI to impersonate someone, create deceptive content, or bypass a required review or approval.",
          "Entering the kinds of information listed in the Data Handling module into any AI tool that has not been approved for it.",
        ],
      },
      {
        heading: "If you are unsure",
        paragraphs: [
          "Stop and ask your manager or the person your organization has named for AI questions. Asking first is always acceptable. If something already went wrong, report it right away (see the Incident Reporting module); prompt reporting is treated as the right thing to do.",
        ],
      },
    ],
    selfCheck: [
      {
        question:
          "A free AI note-taker offers to join your client calls. May you add it?",
        answer:
          "Not without approval. Meeting bots capture client information and send it to a third party. Ask first.",
      },
      {
        question:
          "AI drafted a paragraph with three statistics. What do you do before sending it to a client?",
        answer:
          "Verify each statistic against a trusted source, edit the text, and take responsibility for the final version.",
      },
      {
        question:
          "May you use AI output alone to decide which job applicant to reject?",
        answer:
          "No. Decisions affecting people's jobs, health, money or eligibility need accountable human judgment and leadership-approved process.",
      },
    ],
    acknowledgment:
      "I have read the AI Acceptable Use module. I understand that I am responsible for work I produce with AI tools, that I may use only approved tools, and that I should ask or report when I am unsure or something goes wrong.",
  },
  {
    slug: "ai-data-handling",
    title: "Data Handling with AI Tools",
    version: TRAINING_CONTENT_VERSION,
    minutes: 10,
    audience: "Everyone who types, pastes, uploads, or speaks information into an AI tool.",
    summary:
      "What information must never go into an AI tool, what to remove first, and how to think about where your data goes.",
    sections: [
      {
        heading: "The key idea: a prompt leaves the building",
        paragraphs: [
          "When you paste text or upload a file into an AI tool, that information is sent to another company's servers. Depending on the product and plan it may be stored, reviewed by staff, used to improve models, or exposed through an account breach or a shared link. Free and personal plans usually offer the fewest protections.",
          "Rule of thumb: if you would not post it on a public website or email it to a stranger, do not put it into an AI tool that has not been approved for that kind of information.",
        ],
      },
      {
        heading: "Never enter these into an unapproved AI tool",
        bullets: [
          "Client, patient, student, or customer personal information: names with contact details, health information, account numbers, government ID numbers, dates of birth.",
          "Passwords, API keys, access tokens, private keys, and security configuration.",
          "Confidential business information: contracts under NDA, unreleased financials, legal advice, negotiation positions, and trade secrets.",
          "Employee records, performance or disciplinary information, and background checks.",
          "Information a contract, law, or professional rule requires you to protect. If you are not sure whether a rule applies, treat the information as restricted and ask.",
        ],
      },
      {
        heading: "Use the minimum necessary",
        bullets: [
          "Remove or replace names, numbers, and identifying details before pasting text. Use placeholders such as [Client A] or [Account].",
          "Share a paragraph, not the whole document, when a paragraph is enough.",
          "Describe the problem generally instead of attaching the underlying record.",
          "Keep the key to any placeholders (for example, who [Client A] is) outside the AI tool.",
        ],
      },
      {
        heading: "Know the tool before you rely on it",
        bullets: [
          "Check whether your plan keeps prompts, how long, and whether they are used to train models. Business plans often differ from free plans; read the vendor's current terms rather than assuming.",
          "Check who can see shared chats and whether links can be opened by anyone.",
          "Prefer tools your organization has reviewed. New vendors should be reviewed before they touch client or business information (see the vendor review checklist in your workspace).",
        ],
      },
      {
        heading: "Outputs are data too",
        bullets: [
          "AI-generated text can contain personal or confidential details that you supplied earlier. Check before sharing it outside the organization.",
          "Save outputs you rely on in the normal business record rather than leaving them only in a chat history.",
          "Follow the organization's retention and deletion practices for chats and uploads.",
        ],
      },
      {
        heading: "If you pasted something you should not have",
        paragraphs: [
          "Do not try to hide it. Note which tool, what information, and when, and report it right away using the Incident Reporting module. Some tools let you delete a conversation or request deletion; the incident owner will decide what else is needed, including whether anyone must be notified.",
        ],
      },
    ],
    selfCheck: [
      {
        question:
          "You want a summary of a client's intake form. What is the safe first step?",
        answer:
          "Do not paste the form into an unapproved tool. Use an approved tool, or remove identifying details first, and only if your policy allows that kind of use.",
      },
      {
        question: "Is it fine to paste a password into an AI tool to ask what is wrong with a login?",
        answer: "No. Never enter passwords, keys or tokens into AI tools.",
      },
      {
        question:
          "You realize you uploaded a confidential contract to a free AI tool. What do you do?",
        answer:
          "Report it immediately with the tool name, what was shared, and when. Do not wait to see whether anything happens.",
      },
    ],
    acknowledgment:
      "I have read the Data Handling with AI Tools module. I understand which information must not be entered into unapproved AI tools, that I should use the minimum necessary information, and that I must report any mistake promptly.",
  },
  {
    slug: "ai-incident-reporting",
    title: "Reporting AI Incidents and Mistakes",
    version: TRAINING_CONTENT_VERSION,
    minutes: 7,
    audience: "Everyone. Managers and the named incident owner should also read the last section.",
    summary:
      "What counts as an AI incident, who to tell, what to write down, and why prompt reporting matters.",
    sections: [
      {
        heading: "Why report",
        paragraphs: [
          "Mistakes with AI tools are normal. What makes them costly is delay. Early reports let the organization limit the damage, fix the cause, and keep an accurate record. Reporting in good faith is expected and is not a reason for blame.",
        ],
      },
      {
        heading: "What counts as an AI incident",
        bullets: [
          "Confidential, personal, or restricted information was entered into, uploaded to, or exposed by an AI tool that was not approved for it.",
          "AI output that was wrong, biased, or inappropriate was sent to a client or used for a decision and may have caused harm.",
          "An unapproved AI tool, browser extension, or meeting bot was connected to work accounts or files.",
          "An AI vendor tells you about a breach, a policy change, or an outage affecting your data or work.",
          "Someone used AI to impersonate a person or create a deceptive message (for example a cloned voice or fake email).",
          "A near miss: you caught the problem before it left the organization. Report these too; they show where the process is weak.",
        ],
      },
      {
        heading: "What to do in the first hour",
        bullets: [
          "Stop the activity. Do not keep using the tool for that task, and do not send the questionable output.",
          "Tell the person your organization named for AI incidents (or your manager if none is named). A short message is enough; do not wait to gather every detail.",
          "Write down what you know while it is fresh: the tool and account, what was entered or produced, when, who else was involved, and who might be affected.",
          "Do not delete evidence such as chat history or files until the incident owner says so. Do not contact affected clients or the vendor on your own unless told to.",
        ],
      },
      {
        heading: "What to record",
        bullets: [
          "Date and time found, and date and time it happened.",
          "Tool, account, and plan type (work or personal, free or paid).",
          "What information or output was involved and how sensitive it is.",
          "Who reported it and who was told, with times.",
          "What was done to contain it, and what follow-up is planned.",
        ],
      },
      {
        heading: "For managers and the incident owner",
        paragraphs: [
          "Decide quickly whether information about clients, patients, or employees may have been exposed. Some contracts, insurance policies, and laws require notice within a set time after you learn of an incident, and the clock can start at discovery. Do not assume a deadline does or does not apply: check your contracts and insurance policy, and consult qualified counsel or your insurer's incident line when personal or regulated information may be involved.",
          "Close each incident with a short note on the cause and one fix (for example, remove an unapproved tool, add a rule, or retrain a team), and keep the record with your other AI governance records.",
        ],
      },
    ],
    selfCheck: [
      {
        question: "You noticed a mistake in an AI-drafted email that was already sent. Do you report it?",
        answer: "Yes. Report promptly with what was sent, to whom and when, even if you think the impact is small.",
      },
      {
        question: "Should you delete the chat to keep the problem from spreading?",
        answer: "No, not until the incident owner says so. The history may be needed to understand and fix the problem.",
      },
      {
        question: "Does a near miss need a report?",
        answer: "Yes. Near misses show weak spots at no cost.",
      },
    ],
    acknowledgment:
      "I have read the Reporting AI Incidents and Mistakes module. I understand what counts as an AI incident, that I should report promptly to the person my organization has named, and that good-faith reporting is expected.",
  },
];

export function getTrainingModule(slug: string) {
  return TRAINING_MODULES.find((module) => module.slug === slug) ?? null;
}

export type AcknowledgmentInput = {
  moduleSlug: string;
  personName: string;
  personEmail?: string;
  personRole?: string;
  acknowledgedOn: string;
};

export const ACK_LIMITS = { email: 254, name: 120, role: 120 };

export function validateAcknowledgmentInput(
  raw: Partial<Record<keyof AcknowledgmentInput, unknown>>,
  today: Date = new Date()
):
  | { ok: true; value: Required<AcknowledgmentInput> }
  | { ok: false; error: string } {
  const moduleSlug = String(raw.moduleSlug ?? "").trim();
  const personName = String(raw.personName ?? "").trim();
  const personEmail = String(raw.personEmail ?? "").trim().toLowerCase();
  const personRole = String(raw.personRole ?? "").trim();
  const acknowledgedOn = String(raw.acknowledgedOn ?? "").trim();

  if (!getTrainingModule(moduleSlug)) {
    return { ok: false, error: "Unknown training module." };
  }

  if (personName.length < 2 || personName.length > ACK_LIMITS.name) {
    return { ok: false, error: "Enter the person's full name (2-120 characters)." };
  }

  if (
    personEmail &&
    (personEmail.length > ACK_LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personEmail))
  ) {
    return { ok: false, error: "Enter a valid email address or leave it blank." };
  }

  if (personRole.length > ACK_LIMITS.role) {
    return { ok: false, error: "Role must be 120 characters or fewer." };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(acknowledgedOn);
  const parsed = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : null;

  if (!parsed || parsed.toISOString().slice(0, 10) !== acknowledgedOn) {
    return { ok: false, error: "Enter the date as YYYY-MM-DD." };
  }

  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  if (parsed.getTime() > todayUtc + 86_400_000) {
    return { ok: false, error: "The acknowledgment date cannot be in the future." };
  }

  if (parsed.getTime() < todayUtc - 400 * 86_400_000) {
    return { ok: false, error: "The acknowledgment date is more than 13 months ago." };
  }

  return {
    ok: true,
    value: { acknowledgedOn, moduleSlug, personEmail, personName, personRole },
  };
}

/** A completed acknowledgment is current for TRAINING_REFRESH_MONTHS. */
export function acknowledgmentStatus(
  acknowledgedOn: string | null | undefined,
  today: Date = new Date()
): "current" | "due" | "none" {
  if (!acknowledgedOn) {
    return "none";
  }

  const [y, m, d] = acknowledgedOn.split("-").map(Number);
  const expires = new Date(Date.UTC(y, m - 1 + TRAINING_REFRESH_MONTHS, d));

  return expires.getTime() > today.getTime() ? "current" : "due";
}
