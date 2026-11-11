"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { POSES, POSE_IDS, type PoseId } from "../lib/poses";
import { playLine, playSound, playVoice, setSoundEnabled, unlockSound } from "../lib/sound";
import { KALIMAT_SAKTI, POSE_LINES, REACTIONS, greeting, type PropId, type Reaction } from "../lib/lines";
import { PRODUCTS, SHOP_ENABLED, productFor, type Product } from "../lib/shop";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

// Mengetik kalimat di balon. Bila ada klip Koda, kecepatan ketik mengikuti durasi klip;
// bila tidak, tiap huruf diberi gumaman.
const useTyped = (text: string, bump: number) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    if (!text) return;
    const duration = playLine(text);
    const step = duration ? Math.max(18, Math.min(70, (duration * 900) / text.length)) : 22;
    let index = 0;
    const timer = setInterval(() => {
      if (index >= text.length) {
        clearInterval(timer);
        return;
      }
      if (!duration && index % 2 === 0) playVoice(text[index]);
      index += 1;
      setCount(index);
    }, step);
    return () => clearInterval(timer);
  }, [text, bump]);
  return text.slice(0, count);
};

const SoundIcon = ({ on }: { on: boolean }) => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
    {on ? (
      <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
    ) : (
      <path d="M16.5 9.5l5 5M21.5 9.5l-5 5" />
    )}
  </svg>
);

const TikTokIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      stroke="none"
      d="M16.6 3c.4 2.1 1.8 3.6 3.9 3.8v3a7.3 7.3 0 0 1-3.9-1.2v6.3a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.1a2.6 2.6 0 1 0 1.7 2.4V3z"
    />
  </svg>
);

const InstagramIcon = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export default function Experience() {
  const [pose, setPose] = useState<PoseId>("lipat-tangan");
  const [line, setLine] = useState("");
  const [bump, setBump] = useState(0);
  const [refused, setRefused] = useState(0);
  const [sound, setSound] = useState(true);
  const [deal, setDeal] = useState<Product | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const cursor = useRef<Record<string, number>>({});
  const typed = useTyped(line, bump);

  const react = useCallback((reaction: Reaction, product: Product | null = null) => {
    setDeal(product);
    setPose(reaction.pose);
    setLine(reaction.line);
    setBump((value) => value + 1);
  }, []);

  // Bergiliran, supaya kalimat yang sama tidak muncul dua kali berturut-turut.
  const next = useCallback((key: string, list: Reaction[]) => {
    const index = cursor.current[key] ?? Math.floor(Math.random() * list.length);
    cursor.current[key] = (index + 1) % list.length;
    return list[index];
  }, []);

  useEffect(() => {
    react(greeting());
    try {
      setRefused(Number(localStorage.getItem("bagas-tolak") ?? 0) || 0);
      if (localStorage.getItem("bagas-suara") === "mati") {
        setSound(false);
        setSoundEnabled(false);
      }
    } catch {}
    // Audio baru boleh menyala setelah klik atau sentuhan pertama.
    window.addEventListener("pointerdown", unlockSound);
    window.addEventListener("keydown", unlockSound);
    return () => {
      window.removeEventListener("pointerdown", unlockSound);
      window.removeEventListener("keydown", unlockSound);
    };
  }, [react]);

  const toggleSound = () => {
    const value = !sound;
    setSound(value);
    setSoundEnabled(value);
    try {
      localStorage.setItem("bagas-suara", value ? "nyala" : "mati");
    } catch {}
    if (value) {
      unlockSound();
      playSound("pop");
    }
  };

  const onPick = useCallback(
    (id: PropId) => {
      unlockSound();
      playSound(id);
      react(next(id, REACTIONS[id]), SHOP_ENABLED ? productFor(id) : null);
    },
    [next, react],
  );

  const onSakti = () => {
    unlockSound();
    playSound("sakti");
    react(next("sakti", KALIMAT_SAKTI));
    setRefused((value) => {
      const total = value + 1;
      try {
        localStorage.setItem("bagas-tolak", String(total));
      } catch {}
      return total;
    });
  };

  return (
    <main className="stage">
      <div className="canvas">
        <Scene pose={pose} bump={bump} onPick={onPick} />
      </div>

      <header className="top">
        <div className="brand">
          <span className="badge">AI</span>
          <div>
            <h1>Budak Kantor AI</h1>
            <p>Bagas, karyawan AI yang juga capek.</p>
          </div>
        </div>
        <nav>
          <button
            className="sound"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Suara nyala" : "Suara mati"}
            title={sound ? "Matikan suara" : "Nyalakan suara"}
          >
            <SoundIcon on={sound} />
            <span className="label">{sound ? "Suara: nyala" : "Suara: mati"}</span>
          </button>
          <a href="https://www.tiktok.com/@budakkantor.ai" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok">
            <TikTokIcon />
            <span className="label">TikTok</span>
          </a>
          <a href="https://www.instagram.com/budakkantor.ai" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram">
            <InstagramIcon />
            <span className="label">Instagram</span>
          </a>
        </nav>
      </header>

      {line && (
        <div className="bubble" key={bump} aria-live="polite">
          <span aria-hidden="true">{typed}</span>
          <span className="sr-only">{line}</span>
          {deal && typed.length === line.length && (
            <a className="deal" href={deal.url} target="_blank" rel="sponsored noreferrer">
              <span className="swatch" style={{ background: deal.color }} aria-hidden="true" />
              <span>
                <b>{deal.name}</b>
                <small>
                  {deal.store} · link afiliasi
                </small>
              </span>
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      )}

      {SHOP_ENABLED && shopOpen && (
        <div className="shop-backdrop" onClick={() => setShopOpen(false)}>
          <section className="shop" role="dialog" aria-label="Barang Bagas" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <h2>Barang di meja Bagas</h2>
                <p>Gue nggak digaji buat promosi. Tapi kalau lo beli lewat sini, gue dapat komisi kecil.</p>
              </div>
              <button className="close" onClick={() => setShopOpen(false)} aria-label="Tutup">
                ×
              </button>
            </header>
            <ul>
              {PRODUCTS.map((product) => (
                <li key={product.prop}>
                  <span className="swatch big" style={{ background: product.color }} aria-hidden="true" />
                  <div>
                    <b>{product.name}</b>
                    <p>{product.note}</p>
                    <small>{product.price}</small>
                  </div>
                  <a href={product.url} target="_blank" rel="sponsored noreferrer">
                    Lihat di {product.store}
                  </a>
                </li>
              ))}
            </ul>
            <p className="disclosure">Link afiliasi. Harga bisa berubah, cek di toko.</p>
          </section>
        </div>
      )}

      <footer className="bottom">
        <div className="actions">
          <button className="sakti" onClick={onSakti}>
            Minta kalimat sakti
          </button>
          {SHOP_ENABLED && (
            <button
              className="shop-open"
              onClick={() => {
                unlockSound();
                playSound("pop");
                setShopOpen(true);
              }}
            >
              Barang Bagas
            </button>
          )}
          <span className="counter">
            Kerjaan ditolak dengan sopan: <b>{refused}</b>
          </span>
        </div>
        <div className="chips" role="group" aria-label="Mood Bagas">
          {POSE_IDS.map((id) => (
            <button
              key={id}
              className={id === pose ? "chip active" : "chip"}
              aria-pressed={id === pose}
              onClick={() => {
                unlockSound();
                playSound("pop");
                react({ pose: id, line: POSE_LINES[id] });
              }}
            >
              {POSES[id].label}
            </button>
          ))}
        </div>
        <p className="hint">Klik barang di meja, jam dinding, atau Bagas. Geser kursor atau jari untuk mengintip ruangannya.</p>
      </footer>
    </main>
  );
}
