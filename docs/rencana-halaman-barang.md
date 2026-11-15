# Rencana: banyak link afiliasi per barang

Ditulis 15 Nov 2026. Tinjauan pertama: **Rabu, 25 Nov 2026**, bareng tinjauan Instagram.

## Masalah

Klik link afiliasi di website sangat sedikit. Dugaan penyebabnya:

1. Tiap barang hanya punya 1 produk. Kalau pengunjung tidak suka produk itu, tidak ada pilihan lain.
2. Kartu produk baru muncul setelah pengunjung mengklik barang di scene 3D dan menunggu Bagas selesai bicara. Banyak pengunjung yang tidak sampai ke tahap itu.
3. Tidak ada link yang bisa dibagikan langsung dari konten TikTok/IG.

## Yang sudah jadi (PR #6 dan #7)

- Label "link afiliasi" di kartu balon diganti dengan harga dan nama toko.
- Halaman `/barang/<barang>` berisi semua produk aktif untuk satu barang, dengan tab antar barang dan badge "Pilihan Bagas" untuk produk di baris teratas.
- Link "Lihat N pilihan lainnya" di bawah kartu balon.
- Modal "Barang Bagas" diringkas jadi satu baris per barang.
- Event GA4 baru: `afiliasi_halaman`, `lihat_barang_lain`, `buka_halaman_barang`, `tab_barang`, `balik_ke_meja`.

Cara mengisi produk ada di [afiliasi.md](afiliasi.md).

## Langkah berikutnya

### 1. Isi produk, mulai dari mug

- [ ] Cari 5–10 mug di **Shopee Affiliate → Penawaran Produk**. Urutkan berdasarkan komisi dan terlaris.
- [ ] Pilih yang bervariasi supaya tiap pengunjung punya opsi:
  - murah (di bawah Rp30rb), misalnya enamel blirik
  - lucu atau bertulisan, cocok dengan tema budak kantor
  - tumbler atau termos untuk yang bawa kopi dari rumah
  - mug custom nama
  - satu barang "nyeleneh", misalnya mug pemanas USB
- [ ] Syarat tiap produk: rating 4,8 ke atas, terjual ratusan atau lebih, dan foto produknya jelas.
- [ ] Isi sheet. Kolom `gambar` wajib diisi supaya kartu tidak berupa kotak warna. `catatan` ditulis dengan suara Bagas, satu kalimat.
- [ ] Taruh produk andalan (komisi paling bagus dan paling laris) di baris paling atas. Produk ini tampil di balon dan dapat badge "Pilihan Bagas".

### 2. Barang lain, bertahap

Setelah mug jalan, lanjutkan dengan urutan: laptop (stand, keyboard), hp (powerbank, stand), tanaman, kalender, jam, dan outfit Bagas. Targetnya 3–5 produk per barang sebelum 25 Nov.

### 3. Bawa trafik ke halaman barang

- [ ] Pasang link `/barang/mug` di link bio Instagram dan TikTok.
- [ ] Di video yang memperlihatkan mug atau kopi, tambah CTA di caption: "Mug Bagas ada di link bio."
- [ ] Untuk video berikutnya, tulis di naskah satu momen yang menonjolkan barang di meja, supaya ada alasan alami untuk CTA.

### 4. Ukur

Data diambil dari GA4, event `ui_click`:

| Pertanyaan | Lihat |
|---|---|
| Berapa orang membuka halaman barang? | page view `/barang/*` |
| Dari mana mereka datang? | `lihat_barang_lain` (balon), `buka_halaman_barang` (modal), atau sumber trafik langsung (link bio) |
| Produk mana yang paling banyak diklik? | `afiliasi_halaman` per `click_value`, misalnya `mug:1`, `mug:3` |
| Apakah kartu balon masih berguna? | `afiliasi_balon` dibanding `afiliasi_halaman` |

Cocokkan juga dengan laporan klik dan komisi di dashboard Shopee Affiliate.

## Keputusan di tinjauan 25 Nov

- Produk yang tidak pernah diklik selama 10 hari: ganti.
- Produk di urutan bawah yang kliknya lebih banyak dari urutan atas: naikkan ke atas.
- Kalau hampir semua klik datang dari link bio, tambah halaman barang untuk tema video lain.
- Kalau klik dari balon tetap kecil, pertimbangkan kartu produk tampil lebih cepat (tanpa menunggu Bagas selesai bicara).

## Ide nanti (belum dikerjakan)

- Kolom `label` di sheet untuk badge seperti "Paling murah" atau "Favorit Bagas".
- Urutkan produk berdasarkan harga di halaman barang.
- Halaman `/barang` yang berisi semua barang, sebagai halaman link bio.
- Gambar OG per halaman barang supaya link terlihat menarik saat dibagikan di WhatsApp.
