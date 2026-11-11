# Tracking GA4 di website Bagas

Dokumen ini menjelaskan cara kerja pelacakan klik di website, cara melacak tombol atau interaksi baru, dan cara mengatur GTM supaya datanya sampai ke GA4.

- Developer yang menambah tombol atau event: baca **Cara kerja** dan **Cara melacak hal baru**.
- Yang mengatur GTM dan GA4 untuk pertama kali: langsung ke **Tutorial Google Tag Manager dari awal**.

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

## Tutorial Google Tag Manager dari awal

Kode website hanya mengirim event ke `dataLayer`. GTM yang memutuskan event mana dikirim ke GA4 dan dengan parameter apa. Bagian ini menuntun pengaturan dari nol sampai data muncul di laporan GA4.

Nama menu di bawah mengikuti tampilan GTM dan GA4 berbahasa Inggris (November 2026). Kalau Google mengubah letak menunya, cari dengan nama yang sama.

### Konsep dasar GTM

| Istilah | Artinya | Di proyek ini |
|---|---|---|
| **Account** | Wadah paling atas, biasanya satu per bisnis | Budak Kantor AI |
| **Container** | Satu set pengaturan untuk satu situs. Punya ID `GTM-…` | `GTM-TSRKC4DG` |
| **Tag** | Kode yang dijalankan GTM, misalnya "kirim event ke GA4" | Google Tag, GA4 Event |
| **Trigger** | Kapan tag dijalankan | Saat halaman dibuka, saat ada event `ui_click` |
| **Variable** | Nilai yang dibaca GTM, misalnya isi `click_name` dari `dataLayer` | `DLV - click_name`, dst. |
| **Workspace / Version** | Draf perubahan. Belum aktif sebelum di-**Publish** | – |

Alurnya: website mendorong `{event: "ui_click", click_name: "kalimat_sakti", …}` ke `dataLayer`, **trigger** Custom Event `ui_click` menyala, **tag** GA4 Event berjalan dan mengirim event beserta parameter yang dibaca lewat **variable**.

### Langkah 0 – Yang perlu disiapkan

1. Akun Google yang sama untuk GTM dan GA4.
2. Akses ke container `GTM-TSRKC4DG` di [tagmanager.google.com](https://tagmanager.google.com). Container ini sudah ada dan kodenya sudah terpasang di website, jadi tidak perlu memasang snippet lagi.
3. Akses Editor atau Administrator ke properti GA4 di [analytics.google.com](https://analytics.google.com).

> Kalau suatu saat perlu membuat container baru: di GTM klik **Create Account**, isi nama akun dan negara, isi **Container name** dengan domain situs, pilih **Web**, lalu **Create**. Salin ID `GTM-…` yang muncul ke `GTM_ID` di `lib/analytics.ts`. Snippet yang ditampilkan GTM tidak perlu ditempel manual; `components/Analytics.tsx` sudah memuatnya.

### Langkah 1 – Buat properti GA4 dan ambil Measurement ID

Lewati bagian ini kalau properti GA4 untuk situs ini sudah ada.

1. Buka GA4 → **Admin** (ikon roda gigi kiri bawah) → **Create** → **Property**.
2. Isi **Property name** (mis. "Meja Bagas"), **Reporting time zone** Indonesia, **Currency** Rupiah. Klik **Next**, isi info bisnis, lalu **Create**.
3. Pilih platform **Web**. Isi **Website URL** dengan domain Vercel situs ini dan **Stream name** "Website Bagas". Biarkan **Enhanced measurement** menyala. Klik **Create stream**.
4. Salin **Measurement ID** yang berbentuk `G-XXXXXXXXXX`. ID ini dipakai di langkah berikutnya.

Kalau properti sudah ada: **Admin → Data collection and modification → Data streams** → pilih stream web → salin **Measurement ID**.

> Abaikan petunjuk GA4 untuk memasang kode gtag.js di website. Pemasangan dilakukan lewat GTM.

### Langkah 2 – Variable: simpan Measurement ID

Supaya Measurement ID cukup ditulis sekali:

1. GTM → container `GTM-TSRKC4DG` → **Variables** → bagian **User-Defined Variables** → **New**.
2. Beri nama `CONST - GA4 Measurement ID`.
3. **Variable Configuration** → **Constant** → isi **Value** dengan `G-XXXXXXXXXX`.
4. **Save**.

### Langkah 3 – Tag: Google Tag (pemasangan GA4 dasar)

Tag ini menyambungkan situs ke GA4 dan otomatis mengirim `page_view`.

1. **Tags** → **New** → nama `GA4 - Google Tag`.
2. **Tag Configuration** → **Google Tag**.
3. **Tag ID**: klik ikon blok `+` dan pilih `{{CONST - GA4 Measurement ID}}`.
4. **Triggering** → pilih **Initialization - All Pages**.
5. **Save**.

### Langkah 4 – Variable: baca parameter dari dataLayer

Buat satu **Data Layer Variable** untuk tiap parameter yang dikirim website.

1. **Variables** → **User-Defined Variables** → **New**.
2. **Variable Configuration** → **Data Layer Variable**.
3. **Data Layer Variable Name**: nama parameter persis seperti di kode, mis. `click_name`. **Data Layer Version**: Version 2.
4. Beri nama variabel `DLV - click_name`, lalu **Save**.
5. Ulangi untuk semua parameter berikut:

| Nama variabel GTM | Data Layer Variable Name |
|---|---|
| `DLV - click_name` | `click_name` |
| `DLV - click_text` | `click_text` |
| `DLV - click_value` | `click_value` |
| `DLV - click_area` | `click_area` |
| `DLV - click_element` | `click_element` |
| `DLV - link_url` | `link_url` |
| `DLV - outbound` | `outbound` |
| `DLV - item` | `item` |
| `DLV - pose` | `pose` |
| `DLV - line_text` | `line_text` |

Tips: aktifkan juga variabel bawaan GTM di **Variables → Built-In Variables → Configure**, centang **Event**. Variabel `{{Event}}` berisi nama event (`ui_click` / `prop_click`) dan dipakai di langkah 6.

### Langkah 5 – Trigger: tangkap event dari website

1. **Triggers** → **New** → nama `CE - Bagas events`.
2. **Trigger Configuration** → **Custom Event**.
3. **Event name**: `^(ui_click|prop_click)$`, lalu centang **Use regex matching**.
4. **This trigger fires on**: **All Custom Events**.
5. **Save**.

Nanti kalau ada event manual baru, misalnya `video_play`, cukup tambahkan ke regex: `^(ui_click|prop_click|video_play)$`.

### Langkah 6 – Tag: GA4 Event

1. **Tags** → **New** → nama `GA4 - Event - Bagas events`.
2. **Tag Configuration** → **Google Analytics** → **Google Analytics: GA4 Event**.
3. **Measurement ID**: `{{CONST - GA4 Measurement ID}}`.
4. **Event Name**: `{{Event}}`. Dengan begitu nama event di GA4 sama dengan nama di kode (`ui_click`, `prop_click`), dan satu tag cukup untuk semua event.
5. Buka **Event Parameters** → **Add parameter**, lalu isi:

| Event Parameter | Value |
|---|---|
| `click_name` | `{{DLV - click_name}}` |
| `click_text` | `{{DLV - click_text}}` |
| `click_value` | `{{DLV - click_value}}` |
| `click_area` | `{{DLV - click_area}}` |
| `click_element` | `{{DLV - click_element}}` |
| `link_url` | `{{DLV - link_url}}` |
| `outbound` | `{{DLV - outbound}}` |
| `item` | `{{DLV - item}}` |
| `pose` | `{{DLV - pose}}` |
| `line_text` | `{{DLV - line_text}}` |

   Parameter yang kosong untuk event tertentu (mis. `item` pada `ui_click`) tidak masalah.
6. **Triggering** → pilih `CE - Bagas events`.
7. **Save**.

### Langkah 7 – Uji dengan Preview

Jangan Publish sebelum diuji.

1. Di GTM, klik **Preview** (kanan atas).
2. Masukkan URL situs di Vercel, lalu **Connect**. Situs terbuka di tab baru dengan panel kecil "Tag Assistant Connected".
3. Di situs: klik **Minta kalimat sakti**, sebuah chip mood, tombol suara, dan mug di meja.
4. Kembali ke tab **Tag Assistant**. Di kolom kiri muncul daftar event. Klik `ui_click`:
   - Tab **Tags**: `GA4 - Event - Bagas events` ada di **Tags Fired**.
   - Tab **Variables**: `DLV - click_name` berisi `kalimat_sakti`, dan seterusnya.
5. Klik `prop_click` dan pastikan `DLV - item` berisi `mug`.
6. Di GA4 → **Admin → Data display → DebugView**, event yang sama muncul dalam beberapa detik beserta parameternya.

Kalau tag ada di **Tags Not Fired**, lihat bagian *Kalau ada masalah* di bawah.

### Langkah 8 – Publish

1. Kembali ke GTM, klik **Submit** (kanan atas).
2. **Version name**: mis. `GA4 + tracking klik Bagas`. **Version description**: ringkasan perubahan.
3. Klik **Publish**.

Sejak saat ini semua pengunjung situs mulai tercatat. Setiap perubahan GTM berikutnya juga harus di-Preview lalu di-Publish lagi.

### Langkah 9 – Custom dimension di GA4

Parameter event baru bisa dipakai di laporan GA4 setelah didaftarkan sebagai custom dimension.

1. GA4 → **Admin → Data display → Custom definitions** → **Create custom dimension**.
2. Isi seperti tabel di bawah, **Scope**: **Event**, lalu **Save**. Ulangi untuk tiap baris.

| Dimension name | Event parameter |
|---|---|
| Nama klik | `click_name` |
| Nilai klik | `click_value` |
| Area klik | `click_area` |
| URL link | `link_url` |
| Barang | `item` |
| Pose Bagas | `pose` |

`click_text`, `click_element`, `outbound`, dan `line_text` boleh ikut didaftarkan kalau perlu. Properti GA4 gratis punya batas 50 custom dimension per properti.

Custom dimension hanya berlaku untuk data **sejak dibuat**, tidak mundur ke data lama. Daftarkan secepatnya setelah Publish.

### Langkah 10 – Melihat hasil di GA4

- **Reports → Engagement → Events**: jumlah `ui_click` dan `prop_click`. Data biasanya muncul 24–48 jam setelah Publish.
- **Tombol mana yang paling sering diklik**: **Explore** → **Free form** → Dimensions: *Event name*, *Nama klik*, *Nilai klik* → Metrics: *Event count* → filter *Event name* = `ui_click`.
- **Barang favorit di meja**: Free form dengan dimensi *Barang*, filter *Event name* = `prop_click`.
- **Klik ke TikTok dan Instagram**: filter *Nama klik* berisi `sosmed_`.

### Kalau ada masalah

| Gejala | Penyebab dan solusi |
|---|---|
| Tag Assistant tidak tersambung | Matikan ad blocker di tab itu. Pastikan yang dibuka situs Vercel, bukan localhost (GTM tidak dimuat di `npm run dev`). |
| Event `ui_click` tidak muncul di Tag Assistant | Cek di console: `dataLayer.filter(e => e.event)`. Kalau kosong, tombolnya bukan `<button>`/`<a>` dan tidak punya `data-track`, atau ada `data-track-ignore`. |
| Event muncul, tapi tag ada di **Tags Not Fired** | Regex di trigger salah ketik atau **Use regex matching** belum dicentang. |
| Variabel `DLV - …` bernilai `undefined` | **Data Layer Variable Name** tidak persis sama dengan nama parameter di kode (huruf besar/kecil berpengaruh). |
| DebugView kosong | Tunggu 1–2 menit. Pastikan Measurement ID di `CONST - GA4 Measurement ID` benar dan perangkat yang dipakai memang sedang dalam mode Preview. |
| Laporan Events kosong | Normal sampai 48 jam setelah Publish. Pastikan container sudah di-**Publish**, bukan hanya di-Preview. |
| Laporan menampilkan "(not set)" untuk custom dimension | Data itu tercatat sebelum dimensi dibuat, atau event tersebut memang tidak membawa parameter itu (mis. `item` pada `ui_click`). |

### Ringkasan isi container

Setelah semua langkah selesai, container `GTM-TSRKC4DG` berisi:

- **Tags**: `GA4 - Google Tag`, `GA4 - Event - Bagas events`
- **Triggers**: `CE - Bagas events` (+ bawaan *Initialization - All Pages*)
- **Variables**: `CONST - GA4 Measurement ID`, 10 × `DLV - …`, bawaan `Event`

### Menambah event atau parameter baru

1. Di kode: tombol baru tidak perlu apa-apa. Untuk event manual baru, panggil `track("nama_event", {...})`.
2. Di GTM: tambahkan nama event ke regex trigger `CE - Bagas events` (langkah 5). Kalau ada parameter baru, buat `DLV - …` (langkah 4) dan tambahkan ke tag GA4 Event (langkah 6).
3. **Preview** → uji → **Submit/Publish**.
4. Di GA4: daftarkan parameter baru sebagai custom dimension (langkah 9).
5. Perbarui tabel *Daftar event saat ini* di dokumen ini.

## Cara mengecek di localhost

GTM tidak dimuat saat `npm run dev`, tapi `dataLayer` tetap terisi. Klik beberapa tombol, lalu di console browser:

```js
dataLayer.filter((e) => e.event)
```

## Catatan

- Jangan memasukkan data pribadi (email, nama, nomor HP) ke `data-track`, `data-track-value`, atau parameter `track()`. Kebijakan GA4 melarangnya.
- `click_text` dan `line_text` dipotong maksimal 100 karakter.
- ID GTM ada di `lib/analytics.ts` (`GTM_ID`). Kalau container berganti, cukup ubah di sana.
