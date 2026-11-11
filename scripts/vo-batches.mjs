// Menyusun naskah VO website per batch untuk dibacakan Koda di AI Studio.
// Pakai: node web/scripts/vo-batches.mjs  → content/web-vo/batch-N.txt dan lines.json
import { mkdirSync, writeFileSync } from "node:fs";
import { GREETINGS, KALIMAT_SAKTI, POSE_LINES, REACTIONS } from "../lib/lines.ts";

const lines = [
  ...Object.values(GREETINGS).map((item) => item.line),
  ...Object.values(REACTIONS).flatMap((list) => list.map((item) => item.line)),
  ...KALIMAT_SAKTI.map((item) => item.line),
  ...Object.values(POSE_LINES),
];
const unique = [...new Set(lines)];
const SIZE = 12;
const out = new URL("../../content/web-vo/", import.meta.url);
mkdirSync(out, { recursive: true });
const batches = [];
for (let i = 0; i < unique.length; i += SIZE) batches.push(unique.slice(i, i + SIZE));
batches.forEach((batch, index) => {
  writeFileSync(new URL(`batch-${index + 1}.txt`, out), batch.join("\n\n") + "\n");
});
writeFileSync(new URL("lines.json", out), JSON.stringify(batches, null, 2));
console.log(`${unique.length} kalimat, ${batches.length} batch`);
