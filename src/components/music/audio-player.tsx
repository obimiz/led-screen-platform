"use client";
import { useEffect, useRef, useState } from "react";
export function MusicPlayer({
  src,
  title,
  downloadUrl = "",
}: {
  src: string;
  title: string;
  downloadUrl?: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  useEffect(() => {
    const audio = ref.current;
    const pauseOther = (event: Event) => {
      if (event.target instanceof HTMLMediaElement && event.target !== audio)
        audio?.pause();
    };
    document.addEventListener("play", pauseOther, true);
    return () => {
      document.removeEventListener("play", pauseOther, true);
      audio?.pause();
    };
  }, [src]);
  return (
    <div className="mt-4 space-y-2">
      <audio
        key={src}
        ref={ref}
        src={src}
        controls
        controlsList={downloadUrl ? undefined : "nodownload"}
        preload="metadata"
        aria-label={`Listen to ${title}`}
        className="w-full min-w-0"
        onLoadStart={() => {
          setError(false);
          setDuration(0);
        }}
        onLoadedMetadata={(e) => {
          setError(false);
          const n = e.currentTarget.duration;
          setDuration(Number.isFinite(n) ? n : 0);
        }}
        onError={() => setError(true)}
      />
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="inline-flex rounded-lg bg-[#DD2421] px-4 py-2.5 text-sm font-bold text-white"
          aria-label={`Download ${title}`}
        >
          Download audio
        </a>
      )}
      {duration > 0 && (
        <p className="text-xs text-slate-500">
          Duration: {Math.floor(duration / 60)}:
          {String(Math.floor(duration % 60)).padStart(2, "0")}
        </p>
      )}
      {error && (
        <p role="status" className="text-sm text-red-700">
          Audio is unavailable. Refresh the page or try again later.
        </p>
      )}
    </div>
  );
}
