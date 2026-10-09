"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
export function HeroMedia({ videoUrl }: { videoUrl?: string }) {
  const [enabled, setEnabled] = useState(false),
    [failed, setFailed] = useState(false),
    [posterFailed, setPosterFailed] = useState(false),
    [playing, setPlaying] = useState(false),
    [paused, setPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const query = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 767px)",
    );
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const update = () =>
      setEnabled(
        !query.matches &&
          !connection?.saveData &&
          !["slow-2g", "2g"].includes(connection?.effectiveType || ""),
      );
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <>
      <div
        className="bg-brand-950 pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {!posterFailed && (
          <Image
            src="/Images/hero/hero-led-screen.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
            onError={() => setPosterFailed(true)}
          />
        )}
        {enabled && videoUrl && !failed && (
          <video
            ref={video}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={
              posterFailed ? undefined : "/Images/hero/hero-led-screen.jpeg"
            }
            className={`absolute inset-0 h-full w-full object-cover ${playing ? "opacity-100" : "opacity-0"}`}
            onPlaying={() => setPlaying(true)}
            onError={() => setFailed(true)}
          >
            <source
              src={videoUrl}
              type="video/mp4"
              onError={() => setFailed(true)}
            />
          </video>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/25" />
      </div>
      {enabled && videoUrl && !failed && playing && (
        <button
          type="button"
          className="absolute right-5 bottom-4 z-20 rounded-lg border border-white/50 bg-black/50 px-3 py-2 text-sm text-white"
          onClick={() => {
            if (!video.current) return;
            if (paused) {
              void video.current
                .play()
                .then(() => setPaused(false))
                .catch(() => setFailed(true));
            } else {
              video.current.pause();
              setPaused(true);
            }
          }}
        >
          {paused ? "Play background video" : "Pause background video"}
        </button>
      )}
    </>
  );
}
