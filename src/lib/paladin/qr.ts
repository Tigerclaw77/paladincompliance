import "server-only";

import QRCode from "qrcode";

type VerificationQrAssetInput = {
  generatedAt?: Date;
  organizationName: string;
  verificationUrl: string;
};

const qrColor = {
  dark: "#020617",
  light: "#ffffff",
};

export async function generateVerificationQrSvg(verificationUrl: string) {
  return QRCode.toString(verificationUrl, {
    color: qrColor,
    errorCorrectionLevel: "M",
    margin: 4,
    type: "svg",
    width: 512,
  });
}

export async function generateVerificationQrAssetSvg({
  generatedAt = new Date(),
  organizationName,
  verificationUrl,
}: VerificationQrAssetInput) {
  const qrSvg = await generateVerificationQrSvg(verificationUrl);
  const encodedQrSvg = Buffer.from(qrSvg).toString("base64");
  const generatedDate = formatGeneratedDate(generatedAt);
  const urlLines = splitSvgText(verificationUrl, 54);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="900" viewBox="0 0 720 900" role="img" aria-label="Paladin registry record QR code for ${escapeXml(
    organizationName
  )}">
  <rect width="720" height="900" fill="#ffffff"/>
  <rect x="44" y="38" width="632" height="824" rx="24" fill="#ffffff" stroke="#c6a85b" stroke-width="3"/>
  <rect x="44" y="38" width="632" height="96" rx="24" fill="#0f172a"/>
  <rect x="44" y="110" width="632" height="24" fill="#0f172a"/>
  <text x="360" y="88" text-anchor="middle" fill="#f8fafc" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800">Paladin Compliance</text>
  <image href="data:image/svg+xml;base64,${encodedQrSvg}" x="136" y="178" width="448" height="448"/>
  <text x="360" y="684" text-anchor="middle" fill="#0f172a" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="800">Registry record issued by Paladin Compliance</text>
  <text x="360" y="724" text-anchor="middle" fill="#1e3a8a" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(
    organizationName
  )}</text>
${urlLines
  .map(
    (line, index) =>
      `  <text x="360" y="${
        768 + index * 28
      }" text-anchor="middle" fill="#334155" font-family="Arial, Helvetica, sans-serif" font-size="20">${escapeXml(
        line
      )}</text>`
  )
  .join("\n")}
  <text x="360" y="842" text-anchor="middle" fill="#64748b" font-family="Arial, Helvetica, sans-serif" font-size="16">Generated ${escapeXml(
    generatedDate
  )}</text>
</svg>`;
}

export function formatGeneratedDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function splitSvgText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return [value];
  }

  const lines: string[] = [];
  let remaining = value;

  while (remaining.length > maxLength) {
    const splitIndex = Math.max(
      remaining.lastIndexOf("/", maxLength),
      remaining.lastIndexOf("-", maxLength)
    );
    const safeSplitIndex = splitIndex > 16 ? splitIndex + 1 : maxLength;

    lines.push(remaining.slice(0, safeSplitIndex));
    remaining = remaining.slice(safeSplitIndex);
  }

  if (remaining) {
    lines.push(remaining);
  }

  return lines.slice(0, 3);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
