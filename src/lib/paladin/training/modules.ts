export type StarterTrainingModule = {
  description: string;
  estimatedMinutes: number;
  objectives: string[];
  sections: {
    body: string;
    title: string;
  }[];
  slug: string;
  title: string;
};

export const starterTrainingModules: StarterTrainingModule[] = [
  {
    title: "Responsible AI Usage",
    slug: "responsible-ai-usage",
    description:
      "Baseline expectations for using AI tools responsibly in daily operational work.",
    estimatedMinutes: 12,
    objectives: [
      "Understand when AI can support work without replacing accountability.",
      "Recognize review obligations for AI-assisted output.",
      "Apply practical guardrails for responsible AI use.",
    ],
    sections: [
      {
        title: "Use AI as support",
        body: "AI tools may help draft, summarize, organize, or analyze information, but users remain responsible for the final work product. AI output should be treated as a working aid until reviewed.",
      },
      {
        title: "Keep accountability clear",
        body: "For customer, patient, vendor, employee, financial, or regulated communications, an accountable person should review the output before use. AI should not be used to bypass professional judgment.",
      },
      {
        title: "Know the boundaries",
        body: "Do not use AI tools for prohibited, unauthorized, or high-risk workflows unless the organization has approved the use case and documented the expected safeguards.",
      },
    ],
  },
  {
    title: "Human Review & Oversight",
    slug: "human-review-oversight",
    description:
      "A practical human-in-the-loop framework for AI-assisted work and decisions.",
    estimatedMinutes: 10,
    objectives: [
      "Identify workflows that need human review.",
      "Use escalation when AI output appears inaccurate or risky.",
      "Document accountable oversight for sensitive use cases.",
    ],
    sections: [
      {
        title: "Human-in-the-loop review",
        body: "AI-assisted output should be reviewed by a qualified person before it is relied on for sensitive, external, or material decisions. Review should consider accuracy, context, tone, and operational risk.",
      },
      {
        title: "Escalate concerns",
        body: "If AI output appears unreliable, biased, incomplete, or inappropriate, pause use of that output and escalate through normal supervisory, compliance, privacy, or security channels.",
      },
      {
        title: "Document exceptions",
        body: "Material exceptions, incidents, and workflow changes should be documented so the organization can maintain a defensible operating record.",
      },
    ],
  },
  {
    title: "Data Privacy & AI Tools",
    slug: "data-privacy-ai-tools",
    description:
      "Data handling expectations for prompts, uploads, generated output, and AI vendors.",
    estimatedMinutes: 14,
    objectives: [
      "Recognize sensitive data risks in AI prompts and uploads.",
      "Use minimum necessary data practices.",
      "Understand why vendor controls matter before AI adoption.",
    ],
    sections: [
      {
        title: "Use minimum necessary data",
        body: "Prompts and uploads should include only the information needed for the task. Avoid entering confidential, regulated, proprietary, or unnecessary personal information into AI tools unless the tool and workflow are approved.",
      },
      {
        title: "Protect confidential information",
        body: "Never enter passwords, secrets, credentials, private keys, or unnecessary sensitive records into AI systems. Follow the organization's approved retention and data handling practices.",
      },
      {
        title: "Review vendors",
        body: "AI vendors should be evaluated for privacy, security, data retention, model training use, administrative controls, and contractual safeguards before material use.",
      },
    ],
  },
];

export function getStarterModuleContent(slug: string) {
  return starterTrainingModules.find((module) => module.slug === slug) ?? null;
}
