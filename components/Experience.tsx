"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { POSES, POSE_IDS, type PoseId } from "../lib/poses";
import { playLine, playSound, playVoice, setSoundEnabled, unlockSound } from "../lib/sound";
import { KALIMAT_SAKTI, POSE_LINES, REACTIONS, greeting, type PropId, type Reaction } from "../lib/lines";

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

export default function Experience() {
  const [pose, setPose] = useState<PoseId>("lipat-tangan");
  const [line, setLine] = useState("");
  const [bump, setBump] = useState(0);
  const [refused, setRefused] = useState(0);
  const [sound, setSound] = useState(true);
  const cursor = useRef<Record<string, number>>({});
  const typed = useTyped(line, bump);

  const react = useCallback((reaction: Reaction) => {
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
      react(next(id, REACTIONS[id]));
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
          <button className="sound" onClick={toggleSound} aria-pressed={sound}>
            {sound ? "Suara: nyala" : "Suara: mati"}
          </button>
          <a href="https://www.tiktok.com/@budakkantor.ai" target="_blank" rel="noreferrer">
            TikTok
          </a>
          <a href="https://www.instagram.com/budakkantor.ai" target="_blank" rel="noreferrer">
            Instagram
          </a>
        </nav>
      </header>

      {line && (
        <div className="bubble" key={bump} aria-live="polite">
          <span aria-hidden="true">{typed}</span>
          <span className="sr-only">{line}</span>
        </div>
      )}

      <footer className="bottom">
        <div className="actions">
          <button className="sakti" onClick={onSakti}>
            Minta kalimat sakti
          </button>
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
