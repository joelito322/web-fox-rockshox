// Local-only protection manifest for the exact state immediately before v24.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
let protectedRows = read("models/catalog-v20/protected-captures.json").filter(
  (r) => !r.file.includes("canyon-sender-cfr-high-pivot"),
);
for (const version of [20, 21, 22, 23]) {
  const captures = read(`models/catalog-v${version}/uploads.json`),
    slugs = captures.map((c) => c.file.split("--")[0]);
  protectedRows = protectedRows.filter(
    (r) => !slugs.some((slug) => r.file.includes(slug)),
  );
  for (const c of captures) {
    const file = `models/catalog-v${version}/exports/${c.file}`,
      sha256 = createHash("sha256").update(readFileSync(file)).digest("hex");
    if (sha256 !== c.sha256)
      throw Error(
        "Concurrent offline capture changed; wait for final preparation",
      );
    protectedRows.push({ file, sha256 });
  }
}
if (protectedRows.length !== 28)
  throw Error("Expected fourteen preserved frames/twenty-eight captures");
writeFileSync(
  "models/catalog-v24/protected-captures.json",
  JSON.stringify(protectedRows, null, 2) + "\n",
);
console.log(
  "Protected exact SHA of all twenty-eight other final frame captures.",
);
