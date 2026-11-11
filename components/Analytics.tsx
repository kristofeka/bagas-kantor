"use client";

import Script from "next/script";
import { useEffect } from "react";
import { GTM_ID, startAutoTrack } from "../lib/analytics";

// Memuat GTM (hanya di build produksi, supaya klik saat develop di localhost tidak masuk GA4)
// dan menyalakan pelacak klik otomatis.
export default function Analytics() {
  useEffect(() => startAutoTrack(), []);
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <>
      <Script id="gtm" src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());`}
      </Script>
    </>
  );
}
