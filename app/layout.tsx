import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const display = Baloo_2({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display" });
const body = Nunito({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Budak Kantor AI — Meja Bagas",
  description:
    "Mampir ke meja Bagas, karyawan AI yang juga capek. Klik barang di mejanya dan ambil kalimat sakti untuk menolak kerjaan dengan sopan.",
};

export const viewport: Viewport = {
  themeColor: "#F1DDBA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
