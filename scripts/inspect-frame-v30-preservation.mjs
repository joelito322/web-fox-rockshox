// Scoped redesign: all V10 surfaces are reconstructed; only the other 28 current captures must be byte-identical.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p)),
  sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const protectedCaptures = read(
  "models/catalog-v30/protected-captures.json",
).map((c) => ({ ...c, unchanged: sha(c.file) === c.sha256 }));
const historic = read("models/catalog-v13/uploads.json")
  .filter((c) => c.file.startsWith("santa-cruz-v10-8-my27"))
  .map((c) => ({
    file: c.file,
    unchanged: sha("models/catalog-v13/exports/" + c.file) === c.sha256,
  }));
const passed =
  protectedCaptures.length === 28 &&
  historic.length === 2 &&
  [...protectedCaptures, ...historic].every((c) => c.unchanged);
writeFileSync(
  "models/catalog-v30/preservation.json",
  JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      passed,
      protectedCaptures,
      historic,
      note: "Whole V10 exterior redesigned; no claim of local face preservation within that model.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    passed,
    protected: protectedCaptures.length,
    historical: historic.length,
  }),
);
if (!passed) process.exitCode = 1;
