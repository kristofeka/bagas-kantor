# Tracking GA4 di website Bagas

Dokumen ini menjelaskan cara kerja pelacakan klik di website, cara melacak tombol atau interaksi baru, dan cara mengatur GTM supaya datanya sampai ke GA4.

## Ringkasnya

- Setiap klik pada `<button>` atau `<a>` **otomatis** terlacak sebagai event `ui_click`. Tombol baru tidak perlu kode tambahan.
- Interaksi yang bukan tombol HTML (misalnya klik barang di scene 3D) dikirim manual dengan `track()`.
- Semua event masuk ke `window.dataLayer`. GTM yang meneruskannya ke GA4.

```
Klik tombol/link ──► startAutoTrack() ──┐
                                        ├──► window.dataLayer ──► GTM ──► GA4
Klik di scene 3D ──► track("prop_click")┘
```

## File yang terlibat

| File | Isi |
|---|---|
| `lib/analytics.ts` | `GTM_ID`, fungsi `track()` dan `startAutoTrack()`. Satu-satunya tempat logika tracking. |
| `components/Analytics.tsx` | Memuat skrip GTM dan menyalakan `startAutoTrack()`. Dipasang sekali di `app/layout.tsx`. |
| `app/layout.tsx` | Merender `<Analytics />` di setiap halaman. |
| `components/Experience.tsx` | Contoh pemakaian: atribut `data-track` di tombol utama dan `track("prop_click")` di `onPick`. |

## Cara kerja

### 1. Pemuatan GTM

`components/Analytics.tsx` memuat `https://www.googletagmanager.com/gtm.js?id=GTM-TSRKC4DG` lalu menjalankan inisialisasi `gtag('js', new Date())`, sesuai snippet dari GTM.

Skrip GTM **hanya dimuat di build produksi** (`NODE_ENV === "production"`), yaitu di Vercel, termasuk preview deployment. Saat `npm run dev` di localhost, GTM tidak dimuat sehingga klik saat develop tidak masuk ke laporan GA4. Event tetap masuk ke `window.dataLayer`, jadi tetap bisa dicek di console.

### 2. Pelacak klik otomatis

`startAutoTrack()` memasang **satu** listener klik di `document` (fase capture). Saat ada klik, listener mencari elemen terdekat yang cocok dengan `button, a, [data-track]`, lalu mengirim:

```js
{
  event: "ui_click",
  click_name: "kalimat_sakti",      // nama klik (lihat urutan di bawah)
  click_text: "Minta kalimat sakti", // teks yang terlihat di tombol
  click_value: "lelah",             // dari data-track-value, bila ada
  click_area: "footer",             // dari data-track-area terdekat, bila ada
  click_element: "button",          // "button" atau "a"
  link_url: "https://…",            // khusus link
  outbound: true                    // khusus link: true bila menuju situs lain
}
```

Karena memakai satu listener untuk seluruh halaman (event delegation), tombol yang ditambahkan kapan pun, termasuk yang baru muncul setelah halaman dimuat seperti isi pop-up, otomatis ikut terlacak.

`click_name` diambil dari sumber pertama yang ada:

1. atribut `data-track`
2. atribut `aria-label`
3. teks di dalam tombol
4. nama tag (`button` / `a`)

### 3. Event manual

Untuk interaksi yang tidak berupa tombol atau link HTML, panggil `track()` langsung:

```ts
import { track } from "../lib/analytics";

track("prop_click", { item: "mug", pose: "lelah", line_text: "Kopi ketiga…" });
```

## Cara melacak hal baru

### Tombol atau link baru: tidak perlu apa-apa

```tsx
<button onClick={…}>Download wallpaper</button>
```

Otomatis terkirim sebagai `ui_click` dengan `click_name: "Download wallpaper"`.

### Beri nama tetap dengan `data-track` (disarankan)

Teks tombol bisa berubah (misalnya "Suara: nyala" jadi "Suara: mati"), sehingga laporan GA4 terpecah. Beri nama yang tetap:

```tsx
<button data-track="download_wallpaper">Download wallpaper</button>
```

Aturan penamaan: huruf kecil, kata dipisah garis bawah, maksimal sekitar 40 karakter. Contoh: `kalimat_sakti`, `sosmed_tiktok`, `buka_barang_bagas`.

### Bedakan tombol sejenis dengan `data-track-value`

Kalau banyak tombol punya fungsi sama, pakai satu nama dan bedakan nilainya:

```tsx
{POSE_IDS.map((id) => (
  <button data-track="mood" data-track-value={id}>…</button>
))}
```

Di GA4 semuanya tercatat sebagai `click_name = mood`, dengan `click_value` berisi pose yang dipilih. Untuk toggle, isi `data-track-value` dengan **status sesudah diklik**, seperti tombol suara (`data-track-value={sound ? "mati" : "nyala"}`).

### Tandai bagian halaman dengan `data-track-area`

Pasang di elemen pembungkus. Semua tombol di dalamnya mendapat `click_area` yang sama:

```tsx
<header data-track-area="header">…</header>
<footer data-track-area="footer">…</footer>
<section data-track-area="barang_bagas">…</section>
```

Area yang sudah dipakai: `header`, `footer`, `balon`, `barang_bagas`.

### Elemen klik yang bukan `<button>` atau `<a>`

Listener hanya mengenali `<button>`, `<a>`, dan elemen ber-`data-track`. Kalau ada `<div onClick>`, tambahkan `data-track` supaya ikut terlacak. Lebih baik lagi, ganti dengan `<button>` karena juga lebih ramah keyboard dan pembaca layar.

```tsx
<div data-track="kartu_produk" onClick={…}>…</div>
```

### Jangan lacak elemen tertentu dengan `data-track-ignore`

```tsx
<button data-track-ignore>…</button>
<div data-track-ignore>…semua tombol di dalam sini tidak dilacak…</div>
```

### Interaksi non-HTML (scene 3D, keyboard, timer)

Barang di meja dirender di dalam `<canvas>`, jadi tidak bisa ditangkap listener klik. Panggil `track()` di handler-nya, seperti di `onPick` pada `components/Experience.tsx`:

```ts
const onPick = (id: PropId) => {
  const reaction = next(id, REACTIONS[id]);
  track("prop_click", { item: id, pose: reaction.pose, line_text: reaction.line });
  react(reaction);
};
```

Untuk event manual baru, pakai nama event huruf kecil dengan garis bawah (`video_play`, `quiz_selesai`), dan daftarkan di GTM (lihat bawah).

## Daftar event saat ini

| Event | Kapan | Parameter |
|---|---|---|
| `ui_click` | Klik tombol atau link mana pun | `click_name`, `click_text`, `click_value`, `click_area`, `click_element`, `link_url`, `outbound` |
| `prop_click` | Klik barang atau Bagas di scene 3D | `item`, `pose`, `line_text` |

Nama `data-track` yang sudah dipakai:

| `click_name` | Tombol | `click_value` |
|---|---|---|
| `toggle_suara` | Tombol suara di header | status baru: `nyala` / `mati` |
| `sosmed_tiktok` | Link TikTok | – |
| `sosmed_instagram` | Link Instagram | – |
| `kalimat_sakti` | Tombol "Minta kalimat sakti" | – |
| `mood` | Chip mood di bawah | id pose, mis. `lelah` |
| `buka_barang_bagas` | Tombol "Barang Bagas" (afiliasi, masih disembunyikan) | – |
| `tutup_barang_bagas` | Tombol tutup daftar Barang Bagas | – |
| `afiliasi_balon` | Kartu produk di balon | id barang, mis. `mug` |
| `afiliasi_daftar` | Tombol toko di daftar Barang Bagas | id barang |

Nilai `item` pada `prop_click`: `bagas`, `laptop`, `mug`, `hp`, `jam`, `kalender`, `tanaman`.

## Pengaturan di GTM (sekali saja)

Kode website hanya mengirim event ke `dataLayer`. Supaya sampai ke GA4, buat ini di container `GTM-TSRKC4DG`:

1. **Google Tag** berisi Measurement ID GA4 (`G-…`), trigger *Initialization – All Pages*.
2. **Variables → User-Defined → Data Layer Variable**, satu untuk tiap parameter: `click_name`, `click_text`, `click_value`, `click_area`, `click_element`, `link_url`, `outbound`, `item`, `pose`, `line_text`.
3. **Triggers → Custom Event**, satu untuk `ui_click` dan satu untuk `prop_click`. Atau satu trigger dengan regex `^(ui_click|prop_click)$`.
4. **Tags → Google Analytics: GA4 Event**: Event Name `{{Event}}`, Event Parameters diisi variabel dari langkah 2, trigger dari langkah 3.
5. **Submit / Publish** container.
6. Di GA4: **Admin → Custom definitions → Create custom dimension** (scope *Event*) untuk parameter yang ingin muncul di laporan, minimal `click_name`, `click_value`, `click_area`, dan `item`.

Event manual baru cukup ditambahkan ke trigger di langkah 3, dan parameter barunya dibuatkan variabel di langkah 2.

## Cara mengecek

**Di localhost** (GTM tidak dimuat, tapi `dataLayer` terisi). Jalankan `npm run dev`, klik beberapa tombol, lalu di console browser:

```js
dataLayer.filter((e) => e.event)
```

**Di situs Vercel:**

- GTM → **Preview**, masukkan URL situs, lalu klik tombol. Event `ui_click` / `prop_click` dan tag GA4 yang terpicu akan muncul.
- GA4 → **Admin → DebugView** selama mode Preview aktif.
- Laporan GA4 biasa (Reports → Engagement → Events) baru terisi setelah 24–48 jam. Custom dimension hanya berlaku untuk data sejak dimensi itu dibuat.

## Catatan

- Jangan memasukkan data pribadi (email, nama, nomor HP) ke `data-track`, `data-track-value`, atau parameter `track()`. Kebijakan GA4 melarangnya.
- `click_text` dan `line_text` dipotong maksimal 100 karakter.
- ID GTM ada di `lib/analytics.ts` (`GTM_ID`). Kalau container berganti, cukup ubah di sana.
