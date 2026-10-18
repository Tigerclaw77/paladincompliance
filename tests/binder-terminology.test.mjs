import assert from "node:assert/strict";
import test from "node:test";
import { binderFiles, scan } from "../scripts/scan-binder-terminology.mjs";

test("all binder DOCX files (source, assembled Master/Reference/Core/Digital/Print) avoid Paladin claim language", async () => {
  const files = await binderFiles();
  assert.ok(files.length >= 95, `expected at least 95 DOCX files, found ${files.length}`);
  for (const name of ["Master_Governance_Binder", "Governance_Reference_Library", "Core_Governance_Binder.docx", "Core_Governance_Binder_DIGITAL", "Core_Governance_Binder_PRINT"]) {
    assert.ok(files.some((f) => f.includes(name)), `missing assembled file ${name}`);
  }
  const { hits } = await scan(files);
  assert.deepEqual(
    hits.map((h) => `${h.file}: [${h.label}] ${h.text.slice(0, 100)}`),
    []
  );
});
