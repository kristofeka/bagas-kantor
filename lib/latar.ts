// Latar di belakang Bagas: berganti mengikuti pose, dan warnanya mengikuti jam WIB.
// Gambar disalin dari stock video (public/stock/latar, 768x1376) ke public/latar sebagai WebP.

import type { PoseId } from "./poses";
import { wibNow } from "./lines";

export type LatarId =
  | "ruang-meeting"
  | "pantry"
  | "kamar-kos"
  | "krl"
  | "parkiran-motor"
  | "ruang-wfh"
  | "lift-kantor"
  | "warteg"
  | "ruang-hrd"
  | "kafe"
  | "rooftop"
  | "halte-ojol"
  | "ruang-server"
  | "lobi-kantor";

type Latar = {
  // Batas bawah lantai di gambar, sebagai pecahan tinggi gambar (0 di atas, 1 di bawah).
  floorEnd: number;
  // Warna lantai di dekat batas itu, untuk lantai 3D di depannya.
  floor: string;
  // Latar luar ruangan: jam dinding disembunyikan.
  outdoor?: boolean;
  // Geser gambar ke atas (+) atau bawah (-) dalam satuan dunia 3D, bila bagian pentingnya terpotong.
  shift?: number;
};

// Kanvas video 1080x1920 berasal dari gambar 1376 px yang digeser 7,5: pecahan = (y + 7,5) / 1935.
const fromCanvas = (y: number) => (y + 7.5) / 1935;

export const LATAR: Record<LatarId, Latar> = {
  "ruang-meeting": { floorEnd: fromCanvas(1500), floor: "#E0BB8E" },
  pantry: { floorEnd: fromCanvas(1680), floor: "#EEDEC7" },
  "kamar-kos": { floorEnd: fromCanvas(1500), floor: "#C79071" },
  krl: { floorEnd: fromCanvas(1500), floor: "#927D6D", outdoor: true },
  "parkiran-motor": { floorEnd: fromCanvas(1880), floor: "#9B8677", outdoor: true, shift: -0.9 },
  "ruang-wfh": { floorEnd: fromCanvas(1497), floor: "#C79378" },
  "lift-kantor": { floorEnd: fromCanvas(1497), floor: "#A59385" },
  warteg: { floorEnd: fromCanvas(1497), floor: "#CA9376" },
  "ruang-hrd": { floorEnd: fromCanvas(1500), floor: "#CAB69F" },
  kafe: { floorEnd: fromCanvas(1500), floor: "#B68967" },
  rooftop: { floorEnd: fromCanvas(1500), floor: "#E5DDD1", outdoor: true, shift: -0.7 },
  "halte-ojol": { floorEnd: fromCanvas(1500), floor: "#94877B", outdoor: true },
  "ruang-server": { floorEnd: fromCanvas(1500), floor: "#3A343A" },
  "lobi-kantor": { floorEnd: fromCanvas(1500), floor: "#CFBFAF" },
};

export const LATAR_IDS = Object.keys(LATAR) as LatarId[];

// null berarti ruang kantor 3D bawaan (meja, jendela, papan gabus).
export const POSE_LATAR: Record<PoseId, LatarId | null> = {
  "lipat-tangan": null,
  mengetik: null,
  menunjuk: "lift-kantor",
  santai: "pantry",
  panik: "ruang-server",
  "angkat-bahu": "ruang-hrd",
  "main-hp": "halte-ojol",
  lelah: "krl",
  jalan: "lobi-kantor",
  wfh: "ruang-wfh",
  batik: "warteg",
  "akhir-pekan": "kafe",
  "pulang-motor": "parkiran-motor",
  piyama: "kamar-kos",
  jempol: "ruang-meeting",
  "topang-dagu": "rooftop",
};

export type Suasana = "pagi" | "siang" | "senja" | "malam";

export const suasanaFor = (hours: number): Suasana => {
  if (hours >= 5 && hours < 10) return "pagi";
  if (hours >= 10 && hours < 16) return "siang";
  if (hours >= 16 && hours < 18) return "senja";
  return "malam";
};

// Jam WIB sekarang, atau ?jam=20 di URL untuk mencoba suasana lain.
export const currentSuasana = (): Suasana => {
  let hours = wibNow().hours;
  try {
    const override = new URLSearchParams(window.location.search).get("jam");
    if (override !== null && /^\d{1,2}$/.test(override)) hours = Number(override) % 24;
  } catch {}
  return suasanaFor(hours);
};

export type SuasanaLook = {
  // Warna pengali untuk latar, dinding, dan lantai.
  tint: string;
  // Warna pengali untuk Bagas (lebih ringan dari latar supaya wajah tetap jelas).
  bagas: string;
  ambient: number;
  sun: number;
  // Langit di jendela kantor 3D.
  sky: string;
  orb: string;
  orbY: number;
  stars: boolean;
  // Cahaya lampu gantung.
  glow: number;
  // Warna latar kanvas di luar ruangan.
  clear: string;
};

export const SUASANA: Record<Suasana, SuasanaLook> = {
  pagi: {
    tint: "#FFF8EC",
    bagas: "#FFFFFF",
    ambient: 2.5,
    sun: 1.2,
    sky: "#CFE9F7",
    orb: "#FFF6C8",
    orbY: 0.05,
    stars: false,
    glow: 0.08,
    clear: "#F4E3C4",
  },
  siang: {
    tint: "#FFFFFF",
    bagas: "#FFFFFF",
    ambient: 2.4,
    sun: 1.1,
    sky: "#BFE3F5",
    orb: "#FFF3B8",
    orbY: 0.22,
    stars: false,
    glow: 0.05,
    clear: "#F1DDBA",
  },
  senja: {
    tint: "#FFD7B5",
    bagas: "#FFEBDA",
    ambient: 2.1,
    sun: 0.9,
    sky: "#F3A25C",
    orb: "#FFE0A3",
    orbY: -0.12,
    stars: false,
    glow: 0.3,
    clear: "#E9C49C",
  },
  malam: {
    tint: "#7E89B6",
    bagas: "#C6CADF",
    ambient: 1.35,
    sun: 0.5,
    sky: "#2A3554",
    orb: "#F4EFD8",
    orbY: 0.18,
    stars: true,
    glow: 0.6,
    clear: "#5E6584",
  },
};
