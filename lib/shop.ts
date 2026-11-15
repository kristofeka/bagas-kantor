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

// Nama dan sapaan Bagas per barang, dipakai di halaman /barang/[slug].
export const PROP_PAGES: Record<PropId, { label: string; intro: string }> = {
  mug: { label: "Mug", intro: "Kopi ketiga lebih sah kalau gelasnya lucu. Pilih yang cocok sama meja lo." },
  laptop: { label: "Laptop & meja", intro: "Leher lo bukan aset perusahaan. Rawat sendiri." },
  hp: { label: "HP & gadget", intro: "Buat bertahan di grup kantor sampai jam 5 teng." },
  tanaman: { label: "Tanaman", intro: "Satu-satunya rekan kerja yang nggak nambahin kerjaan." },
  kalender: { label: "Kalender", intro: "Tandain tanggal cuti duluan, baru tanggal deadline." },
  jam: { label: "Jam", intro: "Biar jelas kapan jam 5 teng. Sisanya terserah lo." },
  bagas: { label: "Outfit Bagas", intro: "Seragam resmi budak kantor. Dipakai senin sampai jumat." },
};

export const isPropId = (value: string): value is PropId => (PROP_IDS as string[]).includes(value);

// Kelompokkan produk per barang, urut mengikuti urutan baris di sheet.
export const groupByProp = (products: Product[]) => {
  const groups = new Map<PropId, Product[]>();
  for (const product of products) groups.set(product.prop, [...(groups.get(product.prop) ?? []), product]);
  return groups;
};
