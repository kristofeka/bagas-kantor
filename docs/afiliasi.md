# Mengatur link afiliasi lewat Google Sheet

Produk afiliasi di website diatur dari satu Google Sheet. Mengisi link atau menyalakan dan mematikan produk tidak perlu mengubah kode, commit, atau deploy ulang.

- Perubahan di sheet tampil di website paling lambat **5 menit** kemudian.
- Kalau sheet kosong, belum diatur, atau gagal dibaca, fitur afiliasi otomatis **tersembunyi** dan website tetap jalan seperti biasa.

## Yang tampil di website

- **Kartu di balon.** Setelah pengunjung mengklik barang di meja dan Bagas selesai bicara, kartu produk untuk barang itu muncul di bawah balon. Yang tampil adalah baris aktif paling atas untuk barang itu. Kalau barang itu punya lebih dari satu produk aktif, di bawah kartu muncul link "Lihat N pilihan lainnya".
- **Halaman barang** di `/barang/<barang>`, mis. `/barang/mug`. Isinya semua produk aktif untuk barang itu, dengan tab untuk pindah ke barang lain. Produk paling atas diberi badge "Pilihan Bagas". Link halaman ini bisa dipasang langsung di caption atau link bio.
- **Tombol "Barang Bagas"** di samping tombol kalimat sakti. Isinya satu baris per barang yang punya produk aktif, mengarah ke halaman barangnya. Tombol ini hanya muncul kalau ada minimal satu produk aktif.

## Setup pertama (sekali saja)

### 1. Buat sheet dari template

1. Buka [sheets.new](https://sheets.new) untuk membuat spreadsheet baru. Beri nama, mis. "Afiliasi Meja Bagas".
2. **File → Import → Upload**, pilih file [`docs/afiliasi-template.csv`](afiliasi-template.csv) dari repo ini.
3. Pilih **Replace current sheet**, lalu **Import data**.

Sheet sekarang berisi satu baris untuk tiap barang, semuanya masih nonaktif.

### 2. Bagikan sheet supaya bisa dibaca website

1. Klik **Share** (kanan atas).
2. Di **General access**, ubah jadi **Anyone with the link** dengan peran **Viewer**.
3. Klik **Copy link**, lalu **Done**.

Isi sheet jadi bisa dilihat siapa pun yang punya link-nya. Jangan isi data rahasia di sheet ini. Link afiliasi sendiri memang akan terlihat publik di website.

### 3. Sambungkan sheet ke Vercel

1. Buka proyek di Vercel → **Settings → Environment Variables**.
2. **Key**: `AFFILIATE_SHEET_URL`. **Value**: tempel link sheet dari langkah 2 (link biasa dari tombol Share, tidak perlu diubah).
3. Centang **Production** dan **Preview**, lalu **Save**.
4. Buka **Deployments**, klik **⋯** pada deployment teratas → **Redeploy**. Ini hanya perlu sekali, supaya website membaca variabel baru.

Link dari tombol Share membaca **tab pertama** di sheet. Kalau produk ada di tab lain, buka tab itu lalu copy link dari address bar browser (yang berakhiran `#gid=…`).

## Isi kolom

| Kolom | Wajib | Isi |
|---|---|---|
| `barang` | Ya | Barang di meja: `mug`, `laptop`, `hp`, `tanaman`, `kalender`, `jam`, atau `bagas` (klik ke Bagas sendiri). |
| `aktif` | Ya | `TRUE` untuk tampil, `FALSE` untuk sembunyi. Juga diterima: `ya`, `1`, `aktif`. Lebih praktis jadikan checkbox: pilih kolom ini → **Insert → Checkbox**. |
| `nama` | Ya | Nama produk, mis. "Mug enamel kantor". |
| `catatan` | Tidak | Komentar Bagas yang tampil di daftar. |
| `harga` | Tidak | Angka saja, mis. `33250`, `33.250`, atau `Rp 33250`, otomatis tampil "Rp33.250". Teks bebas seperti "mulai Rp30rb" ditampilkan apa adanya. Kosongkan kalau tidak mau menampilkan harga. |
| `toko` | Tidak | Nama toko di tombol, mis. "Shopee". Muncul sebagai "Lihat di Shopee". |
| `link` | Ya | Link afiliasi lengkap, diawali `https://`. |
| `gambar` | Tidak | Link foto produk (`https://…`). Kalau kosong, tampil kotak warna. |

Nama kolom di baris pertama harus persis seperti tabel di atas. Urutan kolom boleh diubah.

## Pekerjaan sehari-hari

- **Menyalakan produk**: isi `link`, lalu centang `aktif`.
- **Mematikan sementara**: hilangkan centang `aktif`. Link tidak perlu dihapus.
- **Ganti produk**: ubah `nama`, `link`, dan kolom lain di baris yang sama.
- **Lebih dari satu produk untuk satu barang**: tambah baris dengan `barang` yang sama (disarankan 1–10). Semua tampil di halaman `/barang/<barang>`; kartu di balon memakai baris aktif paling atas.
- **Urutan di halaman barang** mengikuti urutan baris di sheet. Taruh produk andalan di baris paling atas.

## Kalau produk tidak muncul

| Gejala | Penyebab |
|---|---|
| Baru diubah tapi belum berubah di website | Tunggu sampai 5 menit, lalu muat ulang halaman. |
| Tidak ada produk sama sekali | `AFFILIATE_SHEET_URL` belum diisi atau belum di-redeploy setelah diisi; atau akses sheet belum **Anyone with the link**. |
| Satu baris tidak muncul | `aktif` bukan TRUE, `nama` kosong, `link` kosong atau tidak diawali `https://`, atau `barang` salah ketik. Baris seperti ini dilewati dan dicatat di **Vercel → Logs** dengan awalan `[afiliasi]`. |
| Foto tidak tampil | Link `gambar` harus langsung ke file gambar dan bisa dibuka publik. |

## Tracking

Klik link afiliasi otomatis tercatat di GA4 sebagai `ui_click` dengan `click_name` `afiliasi_balon` (kartu di balon) atau `afiliasi_halaman` (halaman barang). `click_value` berisi nama barang; untuk halaman barang ditambah urutan produk, mis. `mug:3`. Klik link "Lihat N pilihan lainnya" tercatat sebagai `lihat_barang_lain`. Lihat [tracking.md](tracking.md).

## Untuk developer

- `lib/affiliate-sheet.ts`: membaca sheet sebagai CSV di server (`loadProducts`) dan memvalidasi tiap baris. `SHEET_REFRESH_SECONDS` mengatur jeda baca ulang.
- `app/page.tsx`: memanggil `loadProducts()` dengan `revalidate = 300`, lalu mengirim produk ke `<Experience products={…} />`.
- `app/barang/[slug]/page.tsx`: halaman per barang, juga `revalidate = 300`. Nama dan sapaan tiap barang ada di `PROP_PAGES` (`lib/shop.ts`).
- Untuk mencoba di lokal tanpa sheet, isi `AFFILIATE_SHEET_URL` di `.env.local` dengan URL `data:text/csv,...` berisi CSV contoh. File ini tidak ikut di-commit.
- `lib/shop.ts`: tipe `Product`, daftar barang yang sah, dan warna cadangan.
- Menguji di localhost: jalankan dengan `AFFILIATE_SHEET_URL="<link sheet>" npm run dev`.
