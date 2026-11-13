import type { PropId } from "./lines";
import { PROP_COLORS, PROP_IDS, type Product } from "./shop";

// Membaca daftar produk afiliasi dari Google Sheet. Hanya dipanggil di server (app/page.tsx).
// Panduan: docs/afiliasi.md
// Alamat sheet diisi di environment variable AFFILIATE_SHEET_URL (Vercel → Settings → Environment Variables).

// Berapa detik sekali website membaca ulang sheet.
export const SHEET_REFRESH_SECONDS = 300;

// Terima link sheet biasa (yang di-copy dari tombol Share) dan ubah jadi link unduhan CSV.
export const toCsvUrl = (raw: string) => {
  const url = raw.trim();
  if (url.includes("/spreadsheets/d/e/") || url.includes("output=csv") || url.includes("format=csv")) return url;
  const id = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
  if (!id) return url;
  // Link dari tombol Share tidak memuat gid. Tanpa gid, Google memberi tab pertama.
  // Jangan menebak gid=0: tab hasil impor atau tab baru punya nomor lain.
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1];
  const base = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
  return gid ? `${base}&gid=${gid}` : base;
};

// Pembaca CSV kecil yang mengerti tanda kutip, koma, dan baris baru di dalam sel.
export const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
};

const YES = new Set(["true", "ya", "yes", "1", "aktif", "on", "✓", "v"]);

const isLink = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

// Ubah isi sheet jadi daftar produk aktif. Baris yang tidak lengkap dilewati dan dicatat di log server.
export const parseProducts = (csv: string): Product[] => {
  const [header, ...rows] = parseCsv(csv);
  if (!header) return [];
  const col = (name: string) => header.findIndex((cell) => cell.trim().toLowerCase() === name);
  const at = (row: string[], name: string) => (col(name) >= 0 ? (row[col(name)] ?? "").trim() : "");

  const products: Product[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    const prop = at(row, "barang").toLowerCase() as PropId;
    if (!prop && !at(row, "link")) return;
    if (!YES.has(at(row, "aktif").toLowerCase())) return;
    const problem = !PROP_IDS.includes(prop)
      ? `barang "${prop}" tidak dikenal (pilihan: ${PROP_IDS.join(", ")})`
      : !at(row, "nama")
        ? "kolom nama kosong"
        : !isLink(at(row, "link"))
          ? "kolom link kosong atau bukan alamat http(s)"
          : at(row, "gambar") && !isLink(at(row, "gambar"))
            ? "kolom gambar bukan alamat http(s)"
            : null;
    if (problem) {
      console.warn(`[afiliasi] Baris ${line} dilewati: ${problem}`);
      return;
    }
    products.push({
      prop,
      name: at(row, "nama"),
      note: at(row, "catatan"),
      price: at(row, "harga"),
      store: at(row, "toko") || "toko",
      url: at(row, "link"),
      image: at(row, "gambar"),
      color: PROP_COLORS[prop],
    });
  });
  return products;
};

// Dipanggil di server. Bila sheet belum diatur atau gagal dibaca, hasilnya kosong
// sehingga fitur afiliasi otomatis tersembunyi; situs tetap jalan.
export const loadProducts = async (): Promise<Product[]> => {
  const raw = process.env.AFFILIATE_SHEET_URL;
  if (!raw) return [];
  try {
    const response = await fetch(toCsvUrl(raw), { next: { revalidate: SHEET_REFRESH_SECONDS } });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || type.includes("text/html")) {
      console.warn(`[afiliasi] Sheet tidak bisa dibaca (status ${response.status}). Pastikan aksesnya "Anyone with the link".`);
      return [];
    }
    return parseProducts(await response.text());
  } catch (error) {
    console.warn("[afiliasi] Gagal membaca sheet:", error);
    return [];
  }
};
