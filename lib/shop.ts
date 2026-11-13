import type { PropId } from "./lines";

// Produk afiliasi diatur di Google Sheet (lihat docs/afiliasi.md), bukan di kode.
// File ini hanya berisi tipe dan warna cadangan; aman dipakai di browser.

export type Product = {
  prop: PropId;
  name: string;
  note: string;
  price: string;
  store: string;
  url: string;
  image: string;
  color: string;
};

export const PROP_IDS: PropId[] = ["bagas", "laptop", "mug", "hp", "jam", "kalender", "tanaman"];

// Warna kotak produk bila kolom gambar di sheet kosong.
export const PROP_COLORS: Record<PropId, string> = {
  bagas: "#c9d6e4",
  laptop: "#c9d6e4",
  mug: "#f3c9a8",
  hp: "#d9d2ee",
  jam: "#efe2bf",
  kalender: "#f2d6d0",
  tanaman: "#cfe3c4",
};
