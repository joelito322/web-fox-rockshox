// Local-only research outputs. Published GLBs and their contracts are never removed.
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  renameSync,
  symlinkSync,
} from "node:fs";
import { join, relative, dirname, resolve, extname } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const apply = process.argv.includes("--apply"),
  root = resolve(".");
const reports = new Set([
  "adversarial-review.json",
  "audit-after.json",
  "audit-before.json",
  "bore-review.json",
  "browser-review.json",
  "card-review.json",
  "cloud-after.json",
  "cloud-before.json",
  "contour-review.json",
  "detail-review.json",
  "general-review.json",
  "inspection.json",
  "linkage-review.json",
  "motion-review.json",
  "overlay-review.json",
  "passage-review.json",
  "preservation.json",
  "render-review.json",
  "rollback.json",
  "sides-review.json",
  "transition.json",
  "validation.json",
  "structure-validation.json",
  "views-review.json",
]);
const media = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".pdf",
  ".mp4",
  ".webm",
  ".mov",
  ".avif",
  ".tif",
  ".tiff",
]);
const candidates = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (path !== "models/local" && entry.name !== "__pycache__" && !entry.name.startsWith(".local-")) walk(path);
      continue;
    }
    let kind = null;
    const parts = path.split("/"),
      version = parts[1],
      tail = parts.slice(2).join("/");
    if (
      path.startsWith("models/reference-set/exports/") ||
      extname(path) === ".blend"
    )
      kind = "experiments";
    else if (
      parts.includes("evidence") &&
      media.has(extname(path).toLowerCase())
    )
      kind = "captures";
    else if (media.has(extname(path).toLowerCase())) kind = "references";
    else if (reports.has(entry.name)) kind = "validation";
    if (kind)
      candidates.push({
        from: path,
        to: join("models/local", kind, version, kind === "references" || kind === "captures" ? tail.replace(/^(references|evidence)\//, "") : tail),
        kind,
        bytes: lstatSync(path).size,
        sha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
      });
  }
}
walk("models");
if (apply) {
  mkdirSync("models/local", { recursive: true });
  const trackedResult = spawnSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  if (trackedResult.status !== 0) throw Error("Cannot inspect tracked archive paths");
  const tracked = new Set(trackedResult.stdout.split("\0"));
  const manifestPath = "models/local-archive.json",
    previous = existsSync(manifestPath)
      ? JSON.parse(readFileSync(manifestPath))
      : [];
  const merged = new Map(previous.map((x) => [x.from, x]));
  for (const c of candidates) {
    mkdirSync(dirname(c.to), { recursive: true });
    if (existsSync(c.to)) {
      if (
        createHash("sha256").update(readFileSync(c.to)).digest("hex") !==
        c.sha256
      )
        throw Error("Conflicting local archive: " + c.to);
      throw Error(
        "Archive target already exists; inspect before replacing: " + c.to,
      );
    }
    renameSync(c.from, c.to);
    if (!tracked.has(c.from)) symlinkSync(relative(dirname(c.from), c.to), c.from);
    merged.set(c.from, c);
  }
  writeFileSync(
    manifestPath,
    JSON.stringify(
      [...merged.values()].sort((a, b) => a.from.localeCompare(b.from)),
      null,
      2,
    ) + "\n",
  );
  // Leave tracked removals unstaged. Never mutate the Git index.

}
console.log(
  JSON.stringify(
    {
      mode: apply ? "archived-locally" : "dry-run",
      files: candidates.length,
      bytes: candidates.reduce((n, c) => n + c.bytes, 0),
      groups: [...new Set(candidates.map((c) => c.kind))].map((kind) => ({
        kind,
        files: candidates.filter((c) => c.kind === kind).length,
        bytes: candidates
          .filter((c) => c.kind === kind)
          .reduce((n, c) => n + c.bytes, 0),
      })),
    },
    null,
    2,
  ),
);
