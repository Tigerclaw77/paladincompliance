import "server-only";

import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import {
  SPEND_CATEGORIES,
  SPEND_RECORD_NOTICE,
} from "@/lib/paladin/spendRecord";
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

  drawSpendRecordPages({ fonts, organizationName, pdf });

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
  page.drawText("AI Policy & Evidence Binder", {
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
    value: "AI Policy & Evidence Binder (documented record)",
    x: 54,
    y,
  });
  y -= 20;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Registry Record URL",
    value: verificationUrl,
    x: 54,
    y,
  });
  y -= 20;
  drawMetadataRow({
    page,
    fonts,
    label: "Plan Tier",
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
    text: "This binder is a printable, documented record of the organization's AI policies and evidence, generated from its Paladin Compliance registry profile. It is for internal reference, client and insurer questionnaires, and file maintenance. It is not legal advice and is not an audit, certification, assurance, or verification of compliance.",
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
    title: "Registry Record",
  });

  drawHeading({
    page,
    text: "Registry Record",
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
    label: "Registry Record Status",
    value: verificationStatus,
    x: 334,
    y,
  });
  y -= 18;
  drawMetadataRow({
    page,
    fonts,
    label: "Registry Record URL",
    value: verificationUrl,
    x: 334,
    y,
  });

  drawHeading({
    page,
    text: "About This Registry Record",
    x: 54,
    y: 300,
    font: fonts.bold,
    size: 18,
  });
  drawWrappedText({
    page,
    text: "This page records the organization's Paladin registry record URL and the status of the record at the time of generation. The QR code opens the public registry record, which shows that this binder was issued to this organization. It is not an audit, certification, or verification of compliance, and it does not assess how the organization actually uses AI.",
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
    ["2", "Registry Record"],
    ["3", "Table of Contents"],
    ["4", "AI Governance Overview"],
    ["5", "Acceptable AI Use"],
    ["6", "Human Oversight"],
    ["7", "Data Handling"],
    ["8", "AI Disclosure"],
    ["9", "Vendor Responsibility"],
    ["10", "Incident Escalation"],
    ["11", "Annual AI Governance Expenditure Record"],
    ["12", "Expenditure Log"],
    ["13", "Annual Summary and Retention"],
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

type GridOptions = {
  colWidths: number[];
  fonts: PdfFonts;
  headers: string[];
  page: PDFPage;
  rowHeight: number;
  rows: string[][];
  size?: number;
  x: number;
  yTop: number;
};

function fitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(out, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out === text ? out : `${out.slice(0, -1)}.`;
}

function drawGrid({
  colWidths,
  fonts,
  headers,
  page,
  rowHeight,
  rows,
  size = 8,
  x,
  yTop,
}: GridOptions) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const all = [headers, ...rows];
  all.forEach((row, rowIndex) => {
    const top = yTop - rowIndex * rowHeight;
    let cx = x;
    if (rowIndex === 0) {
      page.drawRectangle({
        x,
        y: top - rowHeight,
        width: totalWidth,
        height: rowHeight,
        color: pdfColors.paleBlue,
      });
    }
    row.forEach((cell, col) => {
      page.drawRectangle({
        x: cx,
        y: top - rowHeight,
        width: colWidths[col],
        height: rowHeight,
        borderColor: pdfColors.border,
        borderWidth: 0.75,
      });
      if (cell) {
        const font = rowIndex === 0 ? fonts.bold : fonts.regular;
        page.drawText(fitText(font, cell, size, colWidths[col] - 8), {
          x: cx + 4,
          y: top - rowHeight / 2 - size / 2 + 1,
          size,
          font,
          color: rowIndex === 0 ? pdfColors.blue : pdfColors.ink,
        });
      }
      cx += colWidths[col];
    });
  });
  return yTop - all.length * rowHeight;
}

function drawSpendRecordPages({
  fonts,
  organizationName,
  pdf,
}: {
  fonts: PdfFonts;
  organizationName: string;
  pdf: PDFDocument;
}) {
  // Page 11: purpose, notice, identification, categories
  let page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: pdf.getPageCount(),
    title: "Annual AI Governance Expenditure Record",
  });
  drawHeading({
    page,
    text: "Annual AI Governance Expenditure Record",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 20,
  });
  page.drawText(organizationName, {
    x: 54,
    y: 668,
    size: 10,
    font: fonts.regular,
    color: pdfColors.muted,
  });
  page.drawRectangle({
    x: 54,
    y: 584,
    width: 504,
    height: 66,
    color: pdfColors.paleBlue,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  drawWrappedText({
    page,
    text: SPEND_RECORD_NOTICE,
    x: 64,
    y: 636,
    maxWidth: 484,
    font: fonts.regular,
    size: 8.5,
    lineHeight: 12,
    color: pdfColors.ink,
  });
  let y = drawWrappedText({
    page,
    text: "Use this record to document what the organization spends on AI governance during a fiscal year, so it can state what it recorded as spent. Log each expenditure by date, category, vendor, amount, and purpose on the next page, then total it on the Annual Summary. Keep the invoice or reference for every entry. A spend total documents effort and resources; it does not show that controls work or that any law, contract, insurer, or customer requirement is met.",
    x: 54,
    y: 562,
    maxWidth: 504,
    font: fonts.regular,
    size: 10,
    lineHeight: 14,
  });
  y -= 10;
  y = drawGrid({
    colWidths: [170, 334],
    fonts,
    headers: ["Record identification", "Entry"],
    page,
    rowHeight: 20,
    rows: [
      ["Fiscal year (start - end)", ""],
      ["Prepared by (name, role) / date", ""],
      ["Reviewed by (name, role) / date", ""],
    ],
    x: 54,
    yTop: y,
  });
  y -= 18;
  drawHeading({
    page,
    text: "Spending categories (one per entry)",
    x: 54,
    y,
    font: fonts.bold,
    size: 12,
  });
  y -= 16;
  SPEND_CATEGORIES.forEach((category) => {
    page.drawText(category.name, {
      x: 54,
      y,
      size: 9,
      font: fonts.bold,
      color: pdfColors.blue,
    });
    y = drawWrappedText({
      page,
      text: category.description,
      x: 54,
      y: y - 12,
      maxWidth: 504,
      font: fonts.regular,
      size: 8.5,
      lineHeight: 11,
      color: pdfColors.muted,
    });
    y -= 4;
  });

  // Page 12: expenditure log
  page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: pdf.getPageCount(),
    title: "Expenditure Log",
  });
  drawHeading({
    page,
    text: "Expenditure Log",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 22,
  });
  drawWrappedText({
    page,
    text: "One line per expenditure. Add copies of this page as needed, or use the companion spreadsheet or the dashboard spend record to total entries automatically.",
    x: 54,
    y: 668,
    maxWidth: 504,
    font: fonts.regular,
    size: 9,
    lineHeight: 12,
    color: pdfColors.muted,
  });
  drawGrid({
    colWidths: [58, 92, 90, 140, 56, 68],
    fonts,
    headers: ["Date", "Category", "Vendor / payee", "Purpose", "Amount (USD)", "Invoice / ref."],
    page,
    rowHeight: 28,
    rows: Array.from({ length: 18 }, () => ["", "", "", "", "", ""]),
    x: 54,
    yTop: 640,
  });

  // Page 13: annual summary + retention
  page = pdf.addPage(letterPageSize);
  drawPageChrome({
    fonts,
    page,
    pageNumber: pdf.getPageCount(),
    title: "Annual Summary and Retention",
  });
  drawHeading({
    page,
    text: "Annual Summary",
    x: 54,
    y: 690,
    font: fonts.bold,
    size: 22,
  });
  y = drawGrid({
    colWidths: [154, 62, 62, 62, 62, 102],
    fonts,
    headers: ["Category", "Q1", "Q2", "Q3", "Q4", "Annual total"],
    page,
    rowHeight: 22,
    rows: [
      ...SPEND_CATEGORIES.map((c) => [c.name, "", "", "", "", ""]),
      ["Total", "", "", "", "", ""],
    ],
    x: 54,
    yTop: 664,
  });
  y -= 22;
  drawHeading({
    page,
    text: "Annual statement",
    x: 54,
    y,
    font: fonts.bold,
    size: 12,
  });
  y = drawWrappedText({
    page,
    text: "For fiscal year [year], [organization] recorded [$total] in AI governance spending across [n] entries, mainly in [top categories]. This is the organization's own unaudited record, kept with supporting invoices. Do not describe this figure as a measure of compliance, safety, or insurability, or as certified, verified, or assured by Paladin Compliance or any other party.",
    x: 54,
    y: y - 16,
    maxWidth: 504,
    font: fonts.regular,
    size: 9.5,
    lineHeight: 13,
  });
  y -= 14;
  drawGrid({
    colWidths: [240, 264],
    fonts,
    headers: ["Review and retention", "Entry"],
    page,
    rowHeight: 20,
    rows: [
      ["Invoices and references kept at (location)", ""],
      ["Entries matched to invoices by / date", ""],
      ["Known gaps or estimates", ""],
      ["Next scheduled review date", ""],
    ],
    x: 54,
    yTop: y,
  });
}
