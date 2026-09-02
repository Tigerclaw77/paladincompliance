import { rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";

export const letterPageSize: [number, number] = [612, 792];

export const pdfColors = {
  amber: rgb(0.78, 0.66, 0.36),
  blue: rgb(0.12, 0.23, 0.54),
  border: rgb(0.82, 0.86, 0.92),
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.37, 0.43, 0.52),
  paleBlue: rgb(0.93, 0.96, 1),
  slate: rgb(0.06, 0.09, 0.16),
  white: rgb(1, 1, 1),
};

export type PdfFonts = {
  bold: PDFFont;
  regular: PDFFont;
};

export function drawPageChrome({
  fonts,
  page,
  pageNumber,
  title,
}: {
  fonts: PdfFonts;
  page: PDFPage;
  pageNumber: number;
  title: string;
}) {
  const { height, width } = page.getSize();

  page.drawRectangle({
    x: 36,
    y: 36,
    width: width - 72,
    height: height - 72,
    borderColor: pdfColors.border,
    borderWidth: 1,
  });

  page.drawText("Paladin Compliance", {
    x: 54,
    y: height - 58,
    size: 9,
    font: fonts.bold,
    color: pdfColors.blue,
  });

  page.drawText(title, {
    x: 54,
    y: height - 74,
    size: 8,
    font: fonts.regular,
    color: pdfColors.muted,
  });

  page.drawText(String(pageNumber), {
    x: width - 66,
    y: 52,
    size: 9,
    font: fonts.regular,
    color: pdfColors.muted,
  });
}

export function drawHeading({
  color = pdfColors.ink,
  font,
  page,
  size = 24,
  text,
  x,
  y,
}: {
  color?: RGB;
  font: PDFFont;
  page: PDFPage;
  size?: number;
  text: string;
  x: number;
  y: number;
}) {
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color,
  });
}

export function drawWrappedText({
  color = pdfColors.ink,
  font,
  lineHeight = 16,
  maxWidth,
  page,
  size = 11,
  text,
  x,
  y,
}: {
  color?: RGB;
  font: PDFFont;
  lineHeight?: number;
  maxWidth: number;
  page: PDFPage;
  size?: number;
  text: string;
  x: number;
  y: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, size);

    if (candidateWidth > maxWidth && line) {
      page.drawText(line, {
        x,
        y: currentY,
        size,
        font,
        color,
      });
      currentY -= lineHeight;
      line = word;
      return;
    }

    line = candidate;
  });

  if (line) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color,
    });
    currentY -= lineHeight;
  }

  return currentY;
}

export function drawMetadataRow({
  fonts,
  label,
  page,
  value,
  x,
  y,
}: {
  fonts: PdfFonts;
  label: string;
  page: PDFPage;
  value: string;
  x: number;
  y: number;
}) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 8,
    font: fonts.bold,
    color: pdfColors.muted,
  });

  return drawWrappedText({
    page,
    text: value,
    x,
    y: y - 16,
    maxWidth: 460,
    font: fonts.regular,
    size: 11,
    lineHeight: 15,
  });
}

export function formatPdfDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
