import "server-only";

import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import {
  drawHeading,
  drawMetadataRow,
  drawWrappedText,
  formatPdfDate,
  letterPageSize,
  pdfColors,
} from "@/lib/paladin/pdf/helpers";

type TrainingCertificateInput = {
  completedAt: Date;
  moduleTitle: string;
  organizationName: string;
  userName: string;
};

type VerificationCertificateInput = {
  expirationDate?: Date | null;
  hipaaActive: boolean;
  issueDate: Date;
  organizationName: string;
  revisionId: string;
  status: string;
  verificationId: string;
  verificationUrl: string;
};

export async function generateVerificationCertificatePdf({
  expirationDate,
  hipaaActive,
  issueDate,
  organizationName,
  revisionId,
  status,
  verificationId,
  verificationUrl,
}: VerificationCertificateInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(letterPageSize);
  const fonts = {
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    regular: await pdf.embedFont(StandardFonts.Helvetica),
  };
  const { height, width } = page.getSize();
  const qrImage = await embedQrPng(pdf, verificationUrl);

  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: pdfColors.amber,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 44,
    y: 44,
    width: width - 88,
    height: height - 88,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 44,
    y: height - 158,
    width: width - 88,
    height: 114,
    color: pdfColors.slate,
  });

  page.drawText("Paladin Compliance", {
    x: 68,
    y: height - 82,
    size: 16,
    font: fonts.bold,
    color: pdfColors.white,
  });
  page.drawText("Registry Record", {
    x: 68,
    y: height - 122,
    size: 28,
    font: fonts.bold,
    color: pdfColors.white,
  });
  page.drawText(status.toUpperCase(), {
    x: width - 190,
    y: height - 92,
    size: 20,
    font: fonts.bold,
    color: status === "ACTIVE" ? pdfColors.amber : pdfColors.white,
  });

  drawWrappedText({
    page,
    text: "This document summarizes the public Paladin registry record showing that an AI Policy & Evidence Binder was issued to the organization named below. It is documentation only: not a certification, audit, legal advice, or guarantee of compliance. Printed or forwarded copies should be confirmed against the QR registry link.",
    x: 68,
    y: height - 196,
    maxWidth: 456,
    font: fonts.regular,
    size: 11,
    lineHeight: 16,
    color: pdfColors.muted,
  });

  drawHeading({
    page,
    text: organizationName,
    x: 68,
    y: height - 262,
    font: fonts.bold,
    size: 30,
  });

  if (hipaaActive) {
    page.drawRectangle({
      x: 68,
      y: height - 306,
      width: 142,
      height: 24,
      color: pdfColors.paleBlue,
      borderColor: pdfColors.blue,
      borderWidth: 1,
    });
    page.drawText("HIPAA MATERIALS ADD-ON", {
      x: 78,
      y: height - 299,
      size: 8,
      font: fonts.bold,
      color: pdfColors.blue,
    });
  }

  page.drawRectangle({
    x: 68,
    y: 208,
    width: 292,
    height: 238,
    color: pdfColors.paleBlue,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });

  let y = 408;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Registry ID",
    value: verificationId,
    x: 88,
    y,
  });
  y -= 18;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Revision ID",
    value: revisionId,
    x: 88,
    y,
  });
  y -= 18;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Issue Date",
    value: formatPdfDate(issueDate),
    x: 88,
    y,
  });
  y -= 18;
  drawMetadataRow({
    page,
    fonts,
    label: "Valid Through",
    value: expirationDate ? formatPdfDate(expirationDate) : "Pending",
    x: 88,
    y,
  });

  page.drawRectangle({
    x: 392,
    y: 238,
    width: 132,
    height: 132,
    color: pdfColors.white,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  page.drawImage(qrImage, {
    x: 400,
    y: 246,
    width: 116,
    height: 116,
  });
  page.drawText("Scan to open registry record", {
    x: 416,
    y: 218,
    size: 10,
    font: fonts.bold,
    color: pdfColors.ink,
  });

  page.drawRectangle({
    x: 68,
    y: 116,
    width: 456,
    height: 62,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  drawWrappedText({
    page,
    text: verificationUrl,
    x: 88,
    y: 152,
    maxWidth: 416,
    font: fonts.regular,
    size: 10,
    lineHeight: 14,
    color: pdfColors.blue,
  });

  page.drawText("Registry record issued by Paladin Compliance (documentation only)", {
    x: 68,
    y: 76,
    size: 9,
    font: fonts.bold,
    color: pdfColors.muted,
  });

  return pdf.save();
}

export async function generateTrainingCertificatePdf({
  completedAt,
  moduleTitle,
  organizationName,
  userName,
}: TrainingCertificateInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(letterPageSize);
  const fonts = {
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    regular: await pdf.embedFont(StandardFonts.Helvetica),
  };
  const { height, width } = page.getSize();

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: pdfColors.amber,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 48,
    y: 48,
    width: width - 96,
    height: height - 96,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 48,
    y: height - 148,
    width: width - 96,
    height: 100,
    color: pdfColors.slate,
  });

  page.drawText("Paladin Compliance", {
    x: 72,
    y: height - 88,
    size: 18,
    font: fonts.bold,
    color: pdfColors.white,
  });
  page.drawText("Training Completion Record", {
    x: 72,
    y: height - 120,
    size: 24,
    font: fonts.bold,
    color: pdfColors.white,
  });

  drawHeading({
    page,
    text: userName,
    x: 72,
    y: height - 230,
    font: fonts.bold,
    size: 30,
  });

  drawWrappedText({
    page,
    text: `is recorded as having completed the Paladin Compliance training module "${moduleTitle}" for ${organizationName}.`,
    x: 72,
    y: height - 270,
    maxWidth: 468,
    font: fonts.regular,
    size: 14,
    lineHeight: 21,
    color: pdfColors.ink,
  });

  let y = height - 360;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Organization",
    value: organizationName,
    x: 72,
    y,
  });
  y -= 22;
  y = drawMetadataRow({
    page,
    fonts,
    label: "Module",
    value: moduleTitle,
    x: 72,
    y,
  });
  y -= 22;
  drawMetadataRow({
    page,
    fonts,
    label: "Record Date",
    value: formatPdfDate(completedAt),
    x: 72,
    y,
  });

  page.drawRectangle({
    x: 72,
    y: 138,
    width: 468,
    height: 96,
    color: pdfColors.paleBlue,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });

  drawWrappedText({
    page,
    text: "Training record note: This document records an internal training completion within the Paladin Compliance workspace. It is an organizational training record and does not represent professional licensure or external accreditation.",
    x: 94,
    y: 198,
    maxWidth: 424,
    font: fonts.regular,
    size: 10,
    lineHeight: 15,
    color: pdfColors.muted,
  });

  page.drawText("Generated by Paladin Compliance", {
    x: 72,
    y: 82,
    size: 9,
    font: fonts.bold,
    color: pdfColors.blue,
  });

  return pdf.save();
}

async function embedQrPng(pdf: PDFDocument, verificationUrl: string) {
  const dataUrl = await QRCode.toDataURL(verificationUrl, {
    color: {
      dark: "#020617",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
    margin: 2,
    width: 384,
  });
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Buffer.from(base64, "base64");

  return pdf.embedPng(bytes);
}
