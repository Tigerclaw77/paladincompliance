import "server-only";

import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import {
  drawHeading,
  drawMetadataRow,
  drawPageChrome,
  drawWrappedText,
  formatPdfDate,
  letterPageSize,
  pdfColors,
  type PdfFonts,
} from "@/lib/paladin/pdf/helpers";

export type BinderPdfInput = {
  generatedAt?: Date;
  organizationName: string;
  subscriptionTier: string;
  verificationStatus: string;
  verificationUrl: string;
};

type PolicySection = {
  body: string[];
  controls: string[];
  title: string;
};

const policySections: PolicySection[] = [
  {
    title: "Acceptable AI Use",
    body: [
      "AI systems may be used to support drafting, summarization, research assistance, analysis, and operational workflow improvement when use is consistent with internal policy and applicable obligations.",
      "Team members remain responsible for final work product, customer communications, and decisions that affect clients, patients, employees, vendors, or regulated records.",
    ],
    controls: [
      "Use approved AI tools for business activity.",
      "Review AI-assisted output before relying on it.",
      "Do not use AI to bypass professional judgment or required review.",
    ],
  },
  {
    title: "Human Oversight",
    body: [
      "Paladin recommends a human-in-the-loop operating model for material decisions, sensitive communications, and any workflow where AI output could affect rights, care, eligibility, finances, or access to services.",
      "AI output should be treated as advisory until reviewed by an accountable person with appropriate context.",
    ],
    controls: [
      "Assign accountable reviewers for high-impact AI use.",
      "Document exceptions and escalations when AI output appears unreliable.",
      "Maintain review expectations for customer-facing work.",
    ],
  },
  {
    title: "Data Handling",
    body: [
      "Users should avoid entering confidential, regulated, proprietary, or unnecessary personal data into AI tools unless the organization has approved the tool and confirmed appropriate safeguards.",
      "Minimum necessary data practices should guide prompts, uploads, transcripts, and generated outputs.",
    ],
    controls: [
      "Limit prompts to the minimum information required.",
      "Do not paste credentials, secrets, or unnecessary personal data into AI systems.",
      "Use approved retention and deletion practices for AI-assisted files.",
    ],
  },
  {
    title: "AI Disclosure",
    body: [
      "The organization should maintain clear expectations for when AI assistance is disclosed internally, to customers, or to external stakeholders.",
      "Disclosure should be practical and context-aware, focused on transparency, trust, and professional accountability rather than unnecessary alarm.",
    ],
    controls: [
      "Disclose AI involvement when policy, contract, or law requires it.",
      "Use plain language for customer or vendor-facing AI notices.",
      "Avoid representing AI-generated work as independently verified without review.",
    ],
  },
  {
    title: "Vendor Responsibility",
    body: [
      "AI vendors should be evaluated for security, privacy, data use, retention, and administrative controls before adoption for material workflows.",
      "Teams should prefer vendors that provide clear documentation, contractual safeguards, and operational support for compliance-sensitive use cases.",
    ],
    controls: [
      "Record approved AI vendors and intended use cases.",
      "Review vendor terms for data retention and model training use.",
      "Reassess vendors when workflows or risk profiles change.",
    ],
  },
  {
    title: "Incident Escalation",
    body: [
      "Suspected AI-related incidents should be escalated through normal operational channels, including privacy, security, compliance, or leadership contacts where appropriate.",
      "Examples include unintended disclosure, inaccurate high-impact output, unauthorized tool use, or material vendor control concerns.",
    ],
    controls: [
      "Pause affected AI workflow when a material concern is identified.",
      "Preserve relevant prompts, outputs, files, and timestamps.",
      "Document remediation decisions and follow-up ownership.",
    ],
  },
];

export async function generateBinderPdf({
  generatedAt = new Date(),
  organizationName,
  subscriptionTier,
  verificationStatus,
  verificationUrl,
}: BinderPdfInput) {
  const pdf = await PDFDocument.create();
  const fonts = {
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    regular: await pdf.embedFont(StandardFonts.Helvetica),
  };
  const qrPng = await QRCode.toBuffer(verificationUrl, {
    color: {
      dark: "#020617",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
    margin: 4,
    type: "png",
    width: 420,
  });
  const qrImage = await pdf.embedPng(qrPng);

  drawCoverPage({
    generatedAt,
    fonts,
    organizationName,
    pdf,
    subscriptionTier,
    verificationUrl,
  });
  drawVerificationPage({
    fonts,
    organizationName,
    pdf,
    qrImage,
    verificationStatus,
    verificationUrl,
  });
  drawTableOfContents({ fonts, pdf });
  drawOverviewPage({ fonts, organizationName, pdf });

  policySections.forEach((policy) => {
    drawPolicyPage({
      fonts,
      organizationName,
      pdf,
      policy,
    });
  });

  return pdf.save();
}

function drawCoverPage({
  fonts,
  generatedAt,
  organizationName,
  pdf,
  subscriptionTier,
  verificationUrl,
}: {
  fonts: PdfFonts;
  generatedAt: Date;
  organizationName: string;
  pdf: PDFDocument;
  subscriptionTier: string;
  verificationUrl: string;
}) {
  const page = pdf.addPage(letterPageSize);
  const { height, width } = page.getSize();

  page.drawRectangle({
    x: 0,
    y: height - 148,
    width,
    height: 148,
    color: pdfColors.slate,
  });
  page.drawRectangle({
    x: 0,
    y: height - 151,
    width,
    height: 3,
    color: pdfColors.amber,
  });
  page.drawText("Paladin Compliance", {
    x: 54,
    y: height - 78,
    size: 18,
    font: fonts.bold,
    color: pdfColors.white,
  });
  page.drawText("AI Governance Binder", {
    x: 54,
    y: height - 116,
    size: 30,
    font: fonts.bold,
    color: pdfColors.white,
  });

  drawHeading({
    page,
    text: organizationName,
    x: 54,
    y: height - 220,
    font: fonts.bold,
    size: 28,
  });

  let y = height - 286;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Generated",
    value: formatPdfDate(generatedAt),
    x: 54,
    y,
  });
  y -= 20;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Document Type",
    value: "Governance Binder",
    x: 54,
    y,
  });
  y -= 20;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Verification URL",
    value: verificationUrl,
    x: 54,
    y,
  });
  y -= 20;
  drawMetadataRow({
    page,
    fonts,
    label: "Coverage Tier",
    value: subscriptionTier,
    x: 54,
    y,
  });

  page.drawRectangle({
    x: 54,
    y: 104,
    width: 504,
    height: 96,
    color: pdfColors.paleBlue,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  drawWrappedText({
    page,
    text: "This binder is a printable governance record generated from the organization's Paladin Compliance verification profile. It is intended for internal reference, vendor review, and compliance file maintenance.",
    x: 76,
    y: 164,
    maxWidth: 460,
    font: fonts.regular,
    size: 11,
    lineHeight: 16,
    color: pdfColors.ink,
  });
}

function drawVerificationPage({
  fonts,
  organizationName,
  pdf,
  qrImage,
  verificationStatus,
  verificationUrl,
}: {
  fonts: PdfFonts;
  organizationName: string;
  pdf: PDFDocument;
  qrImage: Awaited<ReturnType<PDFDocument["embedPng"]>>;
  verificationStatus: string;
  verificationUrl: string;
}) {
  const page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: 2,
    title: "Verification Record",
  });

  drawHeading({
    page,
    text: "Verification Record",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 26,
  });

  page.drawImage(qrImage, {
    x: 54,
    y: 370,
    width: 250,
    height: 250,
  });

  let y = 610;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Organization",
    value: organizationName,
    x: 334,
    y,
  });
  y -= 18;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Verification Status",
    value: verificationStatus,
    x: 334,
    y,
  });
  y -= 18;
  drawMetadataRow({
    page,
    fonts,
    label: "Verification URL",
    value: verificationUrl,
    x: 334,
    y,
  });

  drawHeading({
    page,
    text: "Verification Statement",
    x: 54,
    y: 300,
    font: fonts.bold,
    size: 18,
  });
  drawWrappedText({
    page,
    text: "This page records the organization's Paladin verification URL and current module standing at the time of generation. The QR code directs reviewers to the public verification record.",
    x: 54,
    y: 270,
    maxWidth: 500,
    font: fonts.regular,
    size: 11,
    lineHeight: 17,
    color: pdfColors.ink,
  });
}

function drawTableOfContents({
  fonts,
  pdf,
}: {
  fonts: PdfFonts;
  pdf: PDFDocument;
}) {
  const page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: 3,
    title: "Table of Contents",
  });
  drawHeading({
    page,
    text: "Table of Contents",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 26,
  });

  const entries = [
    ["1", "Cover Page"],
    ["2", "Verification Record"],
    ["3", "Table of Contents"],
    ["4", "AI Governance Overview"],
    ["5", "Acceptable AI Use"],
    ["6", "Human Oversight"],
    ["7", "Data Handling"],
    ["8", "AI Disclosure"],
    ["9", "Vendor Responsibility"],
    ["10", "Incident Escalation"],
  ];
  let y = 632;

  entries.forEach(([pageNumber, label]) => {
    page.drawText(pageNumber, {
      x: 66,
      y,
      size: 11,
      font: fonts.bold,
      color: pdfColors.blue,
    });
    page.drawText(label, {
      x: 108,
      y,
      size: 11,
      font: fonts.regular,
      color: pdfColors.ink,
    });
    y -= 30;
  });
}

function drawOverviewPage({
  fonts,
  organizationName,
  pdf,
}: {
  fonts: PdfFonts;
  organizationName: string;
  pdf: PDFDocument;
}) {
  const page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: 4,
    title: "AI Governance Overview",
  });
  drawHeading({
    page,
    text: "AI Governance Overview",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 26,
  });

  let y = drawWrappedText({
    page,
    text: `${organizationName} maintains this binder as an operational reference for responsible AI use, review expectations, data handling, and escalation practices. This binder is structured to support consistent internal review, governance discussions, and compliance file maintenance.`,
    x: 54,
    y: 640,
    maxWidth: 500,
    font: fonts.regular,
    size: 11,
    lineHeight: 17,
  });
  y -= 24;
  drawHeading({
    page,
    text: "Operating Principles",
    x: 54,
    y,
    font: fonts.bold,
    size: 16,
  });
  y -= 30;

  [
    "Use AI to support work, not to replace accountable professional judgment.",
    "Keep sensitive data out of tools unless the workflow and vendor are approved.",
    "Review AI-assisted output before customer, patient, vendor, or regulator-facing use.",
    "Document exceptions, incidents, and material changes to AI workflows.",
  ].forEach((principle) => {
    page.drawText("-", {
      x: 62,
      y,
      size: 11,
      font: fonts.bold,
      color: pdfColors.blue,
    });
    y = drawWrappedText({
      page,
      text: principle,
      x: 82,
      y,
      maxWidth: 458,
      font: fonts.regular,
      size: 11,
      lineHeight: 17,
    });
    y -= 8;
  });
}

function drawPolicyPage({
  fonts,
  organizationName,
  pdf,
  policy,
}: {
  fonts: PdfFonts;
  organizationName: string;
  pdf: PDFDocument;
  policy: PolicySection;
}) {
  const pageNumber = pdf.getPageCount() + 1;
  const page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber,
    title: policy.title,
  });

  drawHeading({
    page,
    text: policy.title,
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 25,
  });
  page.drawText(organizationName, {
    x: 54,
    y: 664,
    size: 10,
    font: fonts.regular,
    color: pdfColors.muted,
  });

  let y = 620;
  policy.body.forEach((paragraph) => {
    y = drawWrappedText({
      page,
      text: paragraph,
      x: 54,
      y,
      maxWidth: 500,
      font: fonts.regular,
      size: 11,
      lineHeight: 17,
    });
    y -= 14;
  });

  drawHeading({
    page,
    text: "Documented Controls",
    x: 54,
    y,
    font: fonts.bold,
    size: 16,
  });
  y -= 30;

  policy.controls.forEach((control) => {
    page.drawText("-", {
      x: 62,
      y,
      size: 11,
      font: fonts.bold,
      color: pdfColors.blue,
    });
    y = drawWrappedText({
      page,
      text: control,
      x: 82,
      y,
      maxWidth: 458,
      font: fonts.regular,
      size: 11,
      lineHeight: 17,
    });
    y -= 8;
  });

  page.drawRectangle({
    x: 54,
    y: 92,
    width: 500,
    height: 72,
    color: pdfColors.paleBlue,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  drawWrappedText({
    page,
    text: "Record note: review this section with the appropriate policy owner and update approvals, owners, and review dates as internal procedures mature.",
    x: 74,
    y: 132,
    maxWidth: 460,
    font: fonts.regular,
    size: 10,
    lineHeight: 14,
    color: pdfColors.muted,
  });
}
