// Scans every binder DOCX (source, assembled, and root) for claim language that
// Paladin must not make about itself. Paragraphs that deny the claim (a
// disclaimer) or discuss real insurance coverage are reported separately as
// "allowed context". Exit code 1 if any unexplained hit remains.
//   node scripts/scan-binder-terminology.mjs [--verbose]
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

function readZipEntries(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error("not a zip");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i += 1) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const lho = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nlen);
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const raw = buf.subarray(start, start + csize);
    entries.set(name, () => (method === 0 ? raw : inflateRawSync(raw)));
    p += 46 + nlen + elen + clen;
  }
  return entries;
}

export function docxParagraphs(buf) {
  const entries = readZipEntries(buf);
  const parts = [entries.get("word/document.xml")().toString("utf8")];
  for (const [name, get] of entries) {
    if (/^word\/(footer|header|footnotes)\d*\.xml$/.test(name)) parts.push(get().toString("utf8"));
  }
  return parts
    .flatMap((x) => x.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [])
    .map((p) => (p.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? []).map((t) => t.replace(/<[^>]+>/g, "")).join(""))
    .filter(Boolean);
}

export const BANNED = [
  ["assurance", /\bassurance\b/i],
  ["Paladin verifies/certifies/assures/guarantees", /\bPaladin(?:\s+Compliance)?(?:\u2019s)?\s+(?:verif|certif|assur|guarantee|approv|endors)/i],
  ["verified/certified by Paladin", /(?:verified|certified|approved|endorsed|assured|guaranteed)\s+by\s+Paladin/i],
  ["Paladin-verified/certified", /Paladin[- ](?:verified|certified|assured|approved)/i],
  ["verification product wording", /verification\s+(?:statement|signal|page|record|status|identity|badge|id)\b|public verification|QR verification/i],
  ["certification product wording", /(?:certificate|certification)\s+of\s+(?:compliance|coverage|verification)|training\s+certif|governance readiness certification\s+(?:issued|provided)/i],
  ["coverage verification", /coverage\s+verification|verified\s+coverage|Paladin\s+coverage/i],
  ["guaranteed compliance", /guarantee[sd]?\b[^.]{0,40}\bcompliance|compliance[^.]{0,20}\bguarantee/i],
  ["legal protection", /legal(?:ly)? protect|legal safe harbor|safe harbor/i],
  ["regulatory compliant claim", /\b(?:HIPAA|TRAIGA|SOC ?2|GDPR)[- ]compliant\b/i],
];

// A paragraph is allowed context when it negates the claim, or discusses real
// insurance coverage / third-party certifications held by others.
const ALLOWED = [
  // Evidence Review table row in section 3.4: the reviewer tests whether the
  // evidence population matches the workflow. It is the organization's own
  // scope check, not a Paladin or insurance coverage claim. Rename is optional.
  /^Coverage verification$/,
  /\bnot\b[^.]{0,120}\b(audit|certif|assur|verif|guarantee|legal advice|legal protection|compliance)/i,
  /\bno\b[^.]{0,60}\b(certif|assur|verif|guarantee)/i,
  /\b(neither|nor)\b[^.]{0,120}\b(certif|assur|verif|guarantee)/i,
  /\b(does not|do not|cannot|can not|never|without|rather than|instead of)\b[^.]{0,160}\b(certif|assur|verif|guarantee|compliance)/i,
  /insurance|insurer|underwrit|carrier|policy limits?/i,
  /\b(third[- ]party|vendor|external|independent)\b[^.]{0,160}\b(certif|attest|verif|audit)/i,
  /\b(SOC ?2|ISO ?27001|HITRUST)\b/i,
  /(verify|verified|verification)[^.]{0,80}\b(that|whether|vendor|before|with the|the vendor|independently|internally|accuracy|identity|facts)/i,
  /\b(should|must|may|can|to|will)\s+(?:be\s+)?(?:independently\s+)?verif(?:y|ied)/i,
];

export async function binderFiles(root = ".") {
  const out = [];
  const dir = path.join(root, "binder_source_ordered");
  try {
    for (const f of await readdir(dir)) if (f.endsWith(".docx")) out.push(path.join(dir, f));
  } catch {}
  for (const f of await readdir(root)) if (/^Paladin_Compliance_.*\.docx$/.test(f)) out.push(path.join(root, f));
  return out;
}

export async function scan(files) {
  const hits = [];
  const allowed = [];
  for (const file of files) {
    for (const text of docxParagraphs(await readFile(file))) {
      for (const [label, rx] of BANNED) {
        if (!rx.test(text)) continue;
        (ALLOWED.some((a) => a.test(text)) ? allowed : hits).push({ file, label, text: text.slice(0, 220) });
      }
    }
  }
  return { allowed, hits };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = await binderFiles();
  const { allowed, hits } = await scan(files);
  console.log(`Scanned ${files.length} DOCX files.`);
  console.log(`Allowed-context matches (negations, insurance, third-party): ${allowed.length}`);
  console.log(`Unexplained matches: ${hits.length}`);
  const show = process.argv.includes("--verbose") ? [...hits, ...allowed] : hits;
  for (const h of show) console.log(`- [${h.label}] ${path.basename(h.file)}: ${h.text}`);
  process.exit(hits.length ? 1 : 0);
}
