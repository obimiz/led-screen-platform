"use client";
import { useEffect, useState } from "react";

const frames = ["IMAGE GRANT", "BRIGHTER IDEAS", "LIVE • CLEAR • BOLD"];

export function LiveLedDisplay() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setFrame((value) => (value + 1) % frames.length), 2200);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="relative flex h-full min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-brand-900"><div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(221,36,33,.75),transparent_22%),radial-gradient(circle_at_75%_75%,rgba(132,194,33,.6),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(40,20,107,.55),transparent_30%)]" /><div className="relative text-center"><p className="text-xs font-bold tracking-[0.3em] text-brand-200 uppercase">Live LED preview</p><p className="mt-3 text-2xl font-black tracking-widest text-white transition sm:text-4xl">{frames[frame]}</p></div></div>;
}
