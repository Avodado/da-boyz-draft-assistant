import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(root, "app.html.gz");
let html = zlib.gunzipSync(fs.readFileSync(appPath)).toString("utf8");

const replacements = [
  ['<small>v0.13.0 • 2026 market + injury refresh</small>', '<small>v0.13.1 • Aug. 28 draft-day data overlay</small>'],
  ['<strong>v0.13.0 refreshes the current 2026 PPR market, injury availability, and situation evidence while retaining source provenance.</strong>', '<strong>v0.13.1 adds the Aug. 28 draft-day ADP and availability overlay while preserving the validated model and simulation behavior.</strong>'],
  ['A fresh v0.13.0 autosave has been created.', 'A fresh v0.13.1 autosave has been created.'],
  ['const CURRENT_BUILD="v0.13.0"', 'const CURRENT_BUILD="v0.13.1"']
];

for (const [before, after] of replacements) {
  if (!html.includes(before)) throw new Error(`Missing release marker: ${before}`);
  html = html.replace(before, after);
}

fs.writeFileSync(appPath, zlib.gzipSync(Buffer.from(html), { level: 9, mtime: 0 }));
console.log(JSON.stringify({ build: "v0.13.1", bytes: fs.statSync(appPath).size }, null, 2));
