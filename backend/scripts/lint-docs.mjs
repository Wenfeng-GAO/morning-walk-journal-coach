import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(process.cwd(), "..");
const requiredFiles = [
  path.join(rootDir, "docs/integration/ios-shortcut-contract.md"),
  path.join(rootDir, "docs/integration/sample-shortcut-payloads.json")
];

let failed = false;

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required doc file: ${file}`);
    failed = true;
  }
}

if (!failed) {
  const payloadPath = path.join(rootDir, "docs/integration/sample-shortcut-payloads.json");
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));

  if (!payload.startSession || !payload.answerTurnAudio) {
    console.error("sample-shortcut-payloads.json must contain startSession and answerTurnAudio");
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("Docs lint passed");
