// Disalin dari src/stock/catalog.ts (kanvas 1080x1920). Hanya titik yang dipakai web.

export type PoseId =
  | "lipat-tangan"
  | "menunjuk"
  | "santai"
  | "panik"
  | "angkat-bahu"
  | "main-hp"
  | "lelah"
  | "jalan"
  | "wfh"
  | "batik"
  | "akhir-pekan"
  | "pulang-motor"
  | "piyama"
  | "mengetik"
  | "jempol"
  | "topang-dagu";

export type Pose = {
  label: string;
  eyeL: [number, number];
  eyeR: [number, number];
  skin: string;
  scale: number;
};

export const POSES: Record<PoseId, Pose> = {
  "lipat-tangan": { label: "Lipat tangan", eyeL: [472, 907], eyeR: [607, 907], skin: "#E2AE7E", scale: 1 },
  menunjuk: { label: "Menunjuk", eyeL: [450, 738], eyeR: [630, 738], skin: "#DFAB7E", scale: 1.33 },
  santai: { label: "Santai", eyeL: [450, 738], eyeR: [628, 738], skin: "#DEA57B", scale: 1.32 },
  panik: { label: "Panik", eyeL: [450, 738], eyeR: [628, 738], skin: "#D7A077", scale: 1.32 },
  "angkat-bahu": { label: "Angkat bahu", eyeL: [452, 740], eyeR: [625, 740], skin: "#D49D77", scale: 1.28 },
  "main-hp": { label: "Main HP", eyeL: [452, 740], eyeR: [626, 740], skin: "#D09672", scale: 1.29 },
  lelah: { label: "Lelah", eyeL: [440, 780], eyeR: [626, 780], skin: "#E0AC7D", scale: 1.38 },
  jalan: { label: "Pulang", eyeL: [476, 665], eyeR: [605, 665], skin: "#C88F6E", scale: 0.96 },
  wfh: { label: "WFH", eyeL: [430, 640], eyeR: [660, 640], skin: "#D8A17B", scale: 1.7 },
  batik: { label: "Batik Jumat", eyeL: [445, 485], eyeR: [635, 485], skin: "#D7A17E", scale: 1.41 },
  "akhir-pekan": { label: "Akhir pekan", eyeL: [448, 562], eyeR: [675, 560], skin: "#DBA67A", scale: 1.68 },
  "pulang-motor": { label: "Naik motor", eyeL: [417, 625], eyeR: [625, 625], skin: "#D29E76", scale: 1.54 },
  piyama: { label: "Piyama", eyeL: [394, 712], eyeR: [655, 709], skin: "#D8A17B", scale: 1.93 },
  mengetik: { label: "Mengetik", eyeL: [406, 865], eyeR: [656, 865], skin: "#D7A67B", scale: 1.85 },
  jempol: { label: "Jempol", eyeL: [427, 750], eyeR: [659, 750], skin: "#D9A275", scale: 1.72 },
  "topang-dagu": { label: "Bosan", eyeL: [350, 740], eyeR: [662, 740], skin: "#D9A678", scale: 2.31 },
};

export const POSE_IDS = Object.keys(POSES) as PoseId[];

// Gambar 768x1376 ditampilkan cover di kanvas 1080x1920: lebar 1080, tinggi 1935, geser -7,5.
const CANVAS_W = 1080;
const CANVAS_H = 1935;
const SHIFT_Y = 7.5;
// Satuan dunia per satuan wajah. Jarak antar mata (135) menjadi 0,27.
export const K = 0.002;

export const poseLayout = (id: PoseId) => {
  const pose = POSES[id];
  const w = (CANVAS_W * K) / pose.scale;
  const h = (CANVAS_H * K) / pose.scale;
  const toLocal = ([x, y]: [number, number]): [number, number] => [
    (x / CANVAS_W - 0.5) * w,
    (0.5 - (y + SHIFT_Y) / CANVAS_H) * h,
  ];
  const eyeL = toLocal(pose.eyeL);
  const eyeR = toLocal(pose.eyeR);
  const mid: [number, number] = [(eyeL[0] + eyeR[0]) / 2, (eyeL[1] + eyeR[1]) / 2];
  return { w, h, eyeL, eyeR, mid, skin: pose.skin };
};
