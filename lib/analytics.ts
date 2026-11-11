// Pelacakan GA4 lewat Google Tag Manager.
// Semua event dikirim ke window.dataLayer; tag GA4 di GTM yang meneruskannya ke Google Analytics.
// Panduan lengkap: docs/tracking.md

export const GTM_ID = "GTM-TSRKC4DG";

type Value = string | number | boolean | undefined;
export type TrackParams = Record<string, Value>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Kirim satu event. Pakai ini untuk interaksi yang bukan tombol/link HTML, misalnya klik di scene 3D.
export const track = (event: string, params: TrackParams = {}) => {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

const clean = (text: string | null | undefined) => text?.replace(/\s+/g, " ").trim().slice(0, 100) || undefined;

// Nama klik: data-track, lalu aria-label, lalu teks tombol.
const nameOf = (el: HTMLElement) =>
  clean(el.dataset.track) ?? clean(el.getAttribute("aria-label")) ?? clean(el.textContent) ?? el.tagName.toLowerCase();

// Pelacak otomatis: setiap klik pada <button>, <a>, atau elemen ber-data-track dikirim sebagai event "ui_click".
// Tombol baru otomatis ikut terlacak tanpa kode tambahan. Atribut opsional:
//   data-track="nama_stabil"     nama event yang tidak berubah walau teks tombol berubah
//   data-track-value="..."       nilai tambahan, misalnya status baru sebuah toggle
//   data-track-area="header"     dipasang di pembungkus, menandai bagian halaman
//   data-track-ignore            jangan lacak elemen ini
export const startAutoTrack = () => {
  const onClick = (event: MouseEvent) => {
    const el = (event.target as Element | null)?.closest<HTMLElement>("button, a, [data-track]");
    if (!el || el.closest("[data-track-ignore]")) return;
    const href = el instanceof HTMLAnchorElement ? el.href : undefined;
    let outbound: boolean | undefined;
    if (href) {
      try {
        outbound = new URL(href).host !== window.location.host;
      } catch {}
    }
    track("ui_click", {
      click_name: nameOf(el),
      click_text: clean(el.textContent),
      click_value: el.dataset.trackValue,
      click_area: el.closest<HTMLElement>("[data-track-area]")?.dataset.trackArea,
      click_element: el.tagName.toLowerCase(),
      link_url: href,
      outbound,
    });
  };
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
};
