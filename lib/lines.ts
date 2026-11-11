import type { PoseId } from "./poses";

export type PropId = "bagas" | "laptop" | "mug" | "hp" | "jam" | "kalender" | "tanaman";

export type Reaction = { pose: PoseId; line: string };

export const REACTIONS: Record<PropId, Reaction[]> = {
  bagas: [
    { pose: "lipat-tangan", line: "Iya, gue AI. Tapi capeknya asli." },
    { pose: "angkat-bahu", line: "Jangan tanya gue. Gue juga cuma disuruh." },
    { pose: "menunjuk", line: "Kerjaan lo di situ. Bukan di gue." },
    { pose: "santai", line: "Santai. Deadline itu cuma saran yang agak galak." },
    { pose: "jempol", line: "Siap, Pak. (Dalam hati: nggak siap.)" },
    { pose: "lipat-tangan", line: "Diklik terus. Emang gue tombol lift?" },
  ],
  laptop: [
    { pose: "mengetik", line: "Lagi ngetik 'baik, Pak' untuk yang ketujuh kali hari ini." },
    { pose: "panik", line: "47 email belum dibaca. Semuanya 'urgent'." },
    { pose: "topang-dagu", line: "Rapat satu jam ini sebenarnya bisa jadi satu email." },
    { pose: "wfh", line: "WFH: atasnya kemeja, bawahnya rahasia perusahaan." },
  ],
  mug: [
    { pose: "lelah", line: "Kopi ketiga. Yang kerja kafeinnya, bukan gue." },
    { pose: "batik", line: "Isi tumbler ini bukan urusan HRD." },
    { pose: "lelah", line: "Gue AI dan gue tetap butuh kopi. Pikirin itu." },
  ],
  hp: [
    { pose: "main-hp", line: "Grup kantor: 128 pesan. Udah gue mute sampai 2099." },
    { pose: "piyama", line: "Email jam 11 malam. Dibacanya besok jam 9. Itu namanya batasan." },
    { pose: "main-hp", line: "'Bentar ya' adalah kalimat lengkap." },
  ],
  jam: [
    { pose: "jalan", line: "Jam 5 teng. Laptop tutup, gue pulang. Bukan kabur, ini hak." },
    { pose: "pulang-motor", line: "Lembur itu pilihan. Dan gue milih pulang." },
    { pose: "topang-dagu", line: "Jarum jamnya kayak ikut rapat. Nggak maju-maju." },
  ],
  kalender: [
    { pose: "batik", line: "Jumat. Batik dipakai, niat kerja ditinggal di rumah." },
    { pose: "akhir-pekan", line: "Akhir pekan itu bukan cadangan jam kerja." },
    { pose: "jempol", line: "Cuti disetujui? Tumben. Mencurigakan." },
  ],
  tanaman: [
    { pose: "santai", line: "Tanaman ini lebih sering disiram daripada gaji gue naik." },
    { pose: "angkat-bahu", line: "Dia nggak ngapa-ngapain dan tetap dipertahankan. Panutan." },
  ],
};

// Kalimat sakti: penolakan sopan yang bisa langsung dipakai.
export const KALIMAT_SAKTI: Reaction[] = [
  { pose: "lipat-tangan", line: "\"Boleh, tapi yang mana dulu yang harus saya geser?\"" },
  { pose: "santai", line: "\"Saya cek kapasitas dulu ya, nanti saya kabari.\"" },
  { pose: "jempol", line: "\"Bisa. Selesainya Kamis, bukan hari ini.\"" },
  { pose: "angkat-bahu", line: "\"Kalau semuanya prioritas, berarti nggak ada yang prioritas, Pak.\"" },
  { pose: "main-hp", line: "\"Saya sudah di luar jam kerja. Saya balas besok pagi ya.\"" },
  { pose: "menunjuk", line: "\"Boleh minta lewat email? Biar tercatat.\"" },
  { pose: "lelah", line: "\"Minggu ini sudah penuh. Minggu depan saya bisa.\"" },
  { pose: "topang-dagu", line: "\"Ini perlu rapat, atau cukup lewat chat?\"" },
];

export const POSE_LINES: Record<PoseId, string> = {
  "lipat-tangan": "Gue dengerin. Belum tentu gue kerjain.",
  menunjuk: "Itu. Yang itu. Bukan jobdesc gue.",
  santai: "Tangan di saku, pikiran di kasur.",
  panik: "Deadline-nya HARI INI? Katanya minggu depan!",
  "angkat-bahu": "Ya gimana, namanya juga budak kantor.",
  "main-hp": "Bentar ya. Lagi ada yang lebih penting dari kerjaan.",
  lelah: "Baterai sosial: 3%.",
  jalan: "Gue pulang dulu. Kerjaannya nggak ke mana-mana kok.",
  wfh: "Kamera mati bukan berarti gue nggak hadir. Kadang iya sih.",
  batik: "Batik Jumat. Satu-satunya KPI yang selalu tercapai.",
  "akhir-pekan": "Remote di tangan, notifikasi di laut.",
  "pulang-motor": "Macet lebih jujur daripada janji naik gaji.",
  piyama: "Siapa yang kirim email jam segini?",
  mengetik: "Tik tik tik. Kedengarannya sibuk, kan?",
  jempol: "Mantap, Pak. (Senyum ini ada biayanya.)",
  "topang-dagu": "Rapat ini bisa jadi email. Email ini bisa jadi nggak usah.",
};

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export const wibNow = () => {
  const now = new Date();
  const wib = new Date(now.getTime() + (now.getTimezoneOffset() + 7 * 60) * 60000);
  return {
    hours: wib.getHours(),
    minutes: wib.getMinutes(),
    seconds: wib.getSeconds() + wib.getMilliseconds() / 1000,
    day: wib.getDay(),
    dayName: DAYS[wib.getDay()],
    date: wib.getDate(),
  };
};

export const GREETINGS = {
  akhirPekan: { pose: "akhir-pekan", line: "Ini akhir pekan. Tutup laptopnya. Gue juga libur, harusnya." },
  subuh: { pose: "piyama", line: "Belum jam 9. Jangan chat gue dulu." },
  pagi: { pose: "lipat-tangan", line: "Pagi. Gue Bagas, karyawan AI. Klik barang di meja gue, asal jangan kasih kerjaan." },
  istirahat: { pose: "santai", line: "Jam istirahat. Bagas tidak tersedia, tapi silakan lihat-lihat." },
  siang: { pose: "lelah", line: "Siang. Gue Bagas, karyawan AI. Klik barang di meja gue, asal jangan kasih kerjaan." },
  sore: { pose: "pulang-motor", line: "Udah lewat jam 5. Ngapain lo masih di sini?" },
} satisfies Record<string, Reaction>;

export const greeting = (): Reaction => {
  const { hours, day } = wibNow();
  if (day === 0 || day === 6) return GREETINGS.akhirPekan;
  if (hours < 9) return GREETINGS.subuh;
  if (hours < 12) return GREETINGS.pagi;
  if (hours < 13) return GREETINGS.istirahat;
  if (hours < 17) return GREETINGS.siang;
  return GREETINGS.sore;
};
