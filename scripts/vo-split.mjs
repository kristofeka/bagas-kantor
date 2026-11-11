// Memotong audio batch Koda menjadi satu klip per kalimat.
// Pakai: node web/scripts/vo-split.mjs <nomor-batch> <file-audio>
// Hasil: web/public/vo/<id>.mp3 dan entri di web/lib/vo.json (teks kalimat → file, durasi).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const [, , batchArg, input] = process.argv;
const batchNo = Number(batchArg);
const root = new URL("../../", import.meta.url);
const batches = JSON.parse(readFileSync(new URL("content/web-vo/lines.json", root), "utf8"));
const lines = batches[batchNo - 1];
if (!lines || !input) throw new Error("Pakai: vo-split.mjs <nomor-batch> <file-audio>");

const probe = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString(),
  );
const total = probe(input);

// Cari semua jeda hening, lalu ambil jeda terpanjang sebanyak (jumlah kalimat - 1) sebagai batas.
const detect = spawnSync("ffmpeg", ["-i", input, "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"]);
const log = detect.stderr.toString();
const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
let gaps = starts.map((start, i) => ({ start, end: ends[i] ?? total })).filter((gap) => gap.start > 0.2 && gap.end < total - 0.2);
if (gaps.length < lines.length - 1) {
  throw new Error(`Hanya ${gaps.length} jeda untuk ${lines.length} kalimat. Buat ulang batch ini.`);
}
// Batas kalimat dicari dengan mencocokkan teks ke waktu per kata dari Whisper
// (content/web-vo/whisper/b<batch>.json), lalu digeser ke jeda hening terdekat.
const words = JSON.parse(readFileSync(new URL(`content/web-vo/whisper/b${batchNo}.json`, root), "utf8"));
const norm = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
const heard = [];
for (const word of words) for (const ch of norm(word.text)) heard.push({ ch, start: word.startMs / 1000, end: word.endMs / 1000 });
const want = [];
lines.forEach((line, index) => { for (const ch of norm(line)) want.push({ ch, line: index }); });
const n = want.length, m = heard.length;
const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
for (let i = 0; i <= n; i++) cost[i][0] = i;
for (let j = 0; j <= m; j++) cost[0][j] = j;
for (let i = 1; i <= n; i++)
  for (let j = 1; j <= m; j++)
    cost[i][j] = Math.min(cost[i - 1][j - 1] + (want[i - 1].ch === heard[j - 1].ch ? 0 : 1.2), cost[i - 1][j] + 1, cost[i][j - 1] + 1);
const span = lines.map(() => ({ start: Infinity, end: -Infinity, hits: 0, chars: 0 }));
want.forEach((w) => span[w.line].chars++);
for (let i = n, j = m; i > 0 && j > 0; ) {
  const same = want[i - 1].ch === heard[j - 1].ch;
  if (cost[i][j] === cost[i - 1][j - 1] + (same ? 0 : 1.2)) {
    if (same) {
      const s = span[want[i - 1].line];
      s.start = Math.min(s.start, heard[j - 1].start);
      s.end = Math.max(s.end, heard[j - 1].end);
      s.hits++;
    }
    i--; j--;
  } else if (cost[i][j] === cost[i - 1][j] + 1) i--;
  else j--;
}
// Kalimat yang tidak terucap di audio dilewati (tetap memakai gumaman di website).
const spoken = [];
span.forEach((s, index) => {
  const ratio = s.hits / s.chars;
  if (ratio < 0.35) console.log(`TIDAK ADA di audio, dilewati: ${lines[index]}`);
  else {
    spoken.push(index);
    if (ratio < 0.6) console.log(`PERIKSA kalimat ${index + 1}: hanya ${(ratio * 100).toFixed(0)}% cocok — ${lines[index]}`);
  }
});
const cuts = [];
for (let k = 0; k < spoken.length - 1; k++) {
  const index = spoken[k];
  const mid = (span[index].end + span[spoken[k + 1]].start) / 2;
  const best = gaps
    .map((gap) => ({ ...gap, length: gap.end - gap.start, off: Math.abs((gap.start + gap.end) / 2 - mid) }))
    .filter((gap) => gap.off < 1.2)
    .sort((x, y) => y.length - x.length)[0];
  if (!best) throw new Error(`Tidak ada jeda dekat batas kalimat ${index + 1}/${index + 2}.`);
  cuts.push(best);
}
console.log(`Jeda batas terpendek ${Math.min(...cuts.map((cut) => cut.length)).toFixed(2)} d`);

const outDir = new URL("web/public/vo/", root);
mkdirSync(outDir, { recursive: true });
const manifestUrl = new URL("web/lib/vo.json", root);
const manifest = existsSync(manifestUrl) ? JSON.parse(readFileSync(manifestUrl, "utf8")) : {};

spoken.forEach((lineIndex, index) => {
  const line = lines[lineIndex];
  const from = index === 0 ? 0 : cuts[index - 1].end - 0.08;
  const to = index === spoken.length - 1 ? total : cuts[index].start + 0.12;
  const id = `b${batchNo}-${String(lineIndex + 1).padStart(2, "0")}`;
  const file = fileURLToPath(new URL(`${id}.mp3`, outDir));
  execFileSync("ffmpeg", [
    "-y", "-v", "error", "-ss", String(Math.max(0, from)), "-to", String(to), "-i", input,
    "-af", "silenceremove=start_periods=1:start_threshold=-45dB,afade=t=in:d=0.02,loudnorm=I=-16:TP=-1.5",
    "-ac", "1", "-ar", "44100", "-b:a", "80k", file,
  ]);
  manifest[line] = { file: `/vo/${id}.mp3`, duration: Number(probe(file).toFixed(2)) };
  console.log(id, manifest[line].duration, line);
});
writeFileSync(manifestUrl, JSON.stringify(manifest, null, 2) + "\n");
