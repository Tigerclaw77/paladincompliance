import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import path from "node:path";
import test from "node:test";

// Minimal ZIP reader (central directory + deflate/stored) so tests need no deps.
function readZipEntries(buf) {
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  assert.ok(eocd >= 0, "not a zip");
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
    const lnlen = buf.readUInt16LE(lho + 26);
    const lelen = buf.readUInt16LE(lho + 28);
    const start = lho + 30 + lnlen + lelen;
    const raw = buf.subarray(start, start + csize);
    entries.set(name, () => (method === 0 ? raw : inflateRawSync(raw)));
    p += 46 + nlen + elen + clen;
  }
  return entries;
}

function docxParagraphs(buf) {
  const entries = readZipEntries(buf);
  assert.ok(entries.has("word/document.xml"), "missing word/document.xml");
  const xml = entries.get("word/document.xml")().toString("utf8");
  const parts = [xml];
  for (const [name, get] of entries) {
    if (/^word\/(footer|header)\d*\.xml$/.test(name)) parts.push(get().toString("utf8"));
  }
  return parts
    .flatMap((x) => x.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? [])
    .map((p) =>
      (p.match(/<w:t[^>]*>[^<]*<\/w:t>/g) ?? [])
        .map((t) => t.replace(/<[^>]+>/g, ""))
        .join("")
    )
    .filter(Boolean);
}

const DISCLAIMER = /not an audit|not accounting, tax|they are not legal advice|nature of this binder/i;
const BANNED = [
  /\bassurance\b/i,
  /Verification Status/,
  /QR Verification/,
  /Public Verification/,
  /Verification, Assurance/,
  /verified by Paladin/i,
  /certified by Paladin/i,
  /verification (statement|signal|page|record|status|identity)/i,
  /\bpublic verification\b/i,
];

async function binderFiles() {
  const ordered = (await readdir("binder_source_ordered")).filter((f) => f.endsWith(".docx")).map((f) => path.join("binder_source_ordered", f));
  const root = (await readdir(".")).filter((f) => /^Paladin_Compliance_.*\.docx$/.test(f));
  return [...ordered, ...root];
}

test("binder source documents carry no assurance/verification claims", async () => {
  const files = await binderFiles();
  assert.ok(files.length > 90, "expected the full binder source set");
  for (const file of files) {
    const paragraphs = docxParagraphs(await readFile(file));
    for (const text of paragraphs) {
      if (DISCLAIMER.test(text)) continue;
      for (const rx of BANNED) {
        assert.doesNotMatch(text, rx, `${file}: ${text.slice(0, 120)}`);
      }
    }
  }
});

test("binder file names no longer carry assurance/verification titles", async () => {
  for (const file of await binderFiles()) {
    assert.doesNotMatch(path.basename(file), /Assurance|Verification/i, file);
  }
});

test("front matter states the binder is a documented record, not assurance", async () => {
  const files = (await binderFiles()).filter((f) => /FM_Controlled_Document|FM-2_Controlled/.test(f));
  assert.ok(files.length >= 2);
  for (const file of files) {
    const text = docxParagraphs(await readFile(file)).join("\n");
    assert.match(text, /documented record of the\s+organization\u2019s own AI policies/);
    assert.match(text, /insurance coverage/);
  }
});

test("assembly order and architecture docs reference the renamed sources", async () => {
  const order = await readFile("binder_assembly_order.md", "utf8");
  const root = new Set(await readdir("."));
  const ordered = new Set(await readdir("binder_source_ordered"));
  for (const m of order.matchAll(/`((?:\d{3}_[^`]+|Paladin_Compliance_[^`]+)\.docx)`/g)) {
    assert.ok(ordered.has(m[1]) || root.has(m[1]), `assembly order references missing file ${m[1]}`);
  }
});

test("Appendix A-1 expenditure record exists as DOCX, in assembled binders, and as XLSX/CSV templates", async () => {
  const a1 = docxParagraphs(await readFile("binder_source_ordered/401_A_A-1_AI_Governance_Expenditure_Record.docx")).join("\n");
  for (const term of ["Annual AI Governance Expenditure Record", "Vendor / Payee", "Purpose", "Amount (USD)", "Annual Summary", "unaudited"]) {
    assert.ok(a1.includes(term), `A-1 missing ${term}`);
  }
  for (const f of ["Paladin_Compliance_Core_Governance_Binder_PRINT.docx", "Paladin_Compliance_Master_Governance_Binder.docx"]) {
    const text = docxParagraphs(await readFile(f)).join("\n");
    assert.ok(text.includes("A-1 Annual AI Governance Expenditure Record"), f);
  }
  const xlsx = readZipEntries(await readFile("public/templates/Paladin_AI_Governance_Expenditure_Record.xlsx"));
  const wb = xlsx.get("xl/workbook.xml")().toString("utf8");
  for (const sheet of ["Expenditure Log", "Annual Summary", "Categories"]) assert.ok(wb.includes(sheet), sheet);
  const csv = await readFile("public/templates/Paladin_AI_Governance_Expenditure_Log.csv", "utf8");
  assert.match(csv, /^Date \(YYYY-MM-DD\),Category,Vendor \/ Payee,Purpose,Amount \(USD\)/);
});

test("generated binder PDF source uses registry-record wording and includes the spend record", async () => {
  const src = await readFile("src/lib/paladin/pdf/binder.ts", "utf8");
  assert.doesNotMatch(src, /"Verification (Record|Statement|URL|Status)"/);
  assert.doesNotMatch(src, /verification profile/i);
  assert.match(src, /AI Policy & Evidence Binder/);
  assert.match(src, /Annual AI Governance Expenditure Record/);
  assert.match(src, /not an audit, certification, assurance, or verification/);
});

test("signed-in and customer-facing source avoids legacy assurance wording", async () => {
  const banned = /Public Verification|Verification Status\b|Verification ID|Organization verified|Verified Organization|Coverage (Through|Status|State|Active)|Select Annual Coverage|Add HIPAA Coverage|HIPAA verification badge|Training Completion Attestation/;
  async function walk(dir) {
    const out = [];
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...(await walk(full)));
      else if (/\.(tsx?)$/.test(e.name)) out.push(full);
    }
    return out;
  }
  for (const file of await walk("src")) {
    assert.doesNotMatch(await readFile(file, "utf8"), banned, file);
  }
});
