import type { PropId } from "./lines";

// Saklar fitur afiliasi. Nyalakan (true) setelah akun afiliasi terdaftar dan link asli sudah diisi.
export const SHOP_ENABLED = false;

// MOCKUP: produk dan link di bawah ini masih contoh. Ganti url dengan link afiliasi asli.
export type Product = {
  prop: PropId;
  name: string;
  note: string;
  price: string;
  store: string;
  url: string;
  color: string;
};

export const PRODUCTS: Product[] = [
  {
    prop: "mug",
    name: "Mug enamel kantor",
    note: "Kopi ketiga lebih sah kalau gelasnya lucu.",
    price: "Rp4x.xxx",
    store: "Shopee",
    url: "#",
    color: "#f3c9a8",
  },
  {
    prop: "laptop",
    name: "Laptop stand lipat",
    note: "Leher lo bukan aset perusahaan.",
    price: "Rp8x.xxx",
    store: "Tokopedia",
    url: "#",
    color: "#c9d6e4",
  },
  {
    prop: "hp",
    name: "Powerbank 10.000 mAh",
    note: "Buat bertahan di grup kantor sampai jam 5.",
    price: "Rp15x.xxx",
    store: "Shopee",
    url: "#",
    color: "#d9d2ee",
  },
  {
    prop: "tanaman",
    name: "Tanaman meja mini",
    note: "Satu-satunya rekan kerja yang nggak nambahin kerjaan.",
    price: "Rp3x.xxx",
    store: "Tokopedia",
    url: "#",
    color: "#cfe3c4",
  },
  {
    prop: "kalender",
    name: "Kalender meja 2027",
    note: "Buat nandain tanggal cuti duluan.",
    price: "Rp2x.xxx",
    store: "Shopee",
    url: "#",
    color: "#f2d6d0",
  },
  {
    prop: "jam",
    name: "Jam dinding minimalis",
    note: "Biar jelas kapan jam 5 teng.",
    price: "Rp6x.xxx",
    store: "Tokopedia",
    url: "#",
    color: "#efe2bf",
  },
];

export const productFor = (prop: PropId) => PRODUCTS.find((product) => product.prop === prop) ?? null;
