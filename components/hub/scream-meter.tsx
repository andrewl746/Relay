"use client";

import { useEffect, useRef, useState } from "react";
import {
  canBeUrgent,
  frameDb,
  loudness,
  SCREAM_SUSTAIN_FRAMES,
  tierForLoudness,
  urgencyLabel,
  urgencyTiers,
} from "@/lib/hub/urgency";

/**
 * SCREAM! — the seller screams into the mic and the loudest moment decides how
 * urgent the listing is. The mapping (dB → tier) lives in lib/hub/urgency.ts;
 * this only listens and draws the meter.
 *
 * Nothing is recorded or uploaded. The mic is opened for a couple of seconds,
 * read as loudness frames in the browser, and closed.
 */

const LISTEN_MS = 3000;

export function ScreamMeter({ expiresAt }: { expiresAt: string | null }) {
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState(0);
  const [peak, setPeak] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const eligible = canBeUrgent(expiresAt);
  const tier = peak === null ? null : tierForLoudness(peak);

  async function scream() {
    if (listening || !eligible) return;
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't use the microphone here.");
      return;
    }

    let stream: MediaStream;
    try {
      // Browser voice processing flattens volume, which is the one thing we
      // are measuring — turn all of it off.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      setError("Microphone blocked. Allow it in the address bar.");
      return;
    }

    const ctx = new AudioContext();
    await ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const frame = new Float32Array(analyser.fftSize);

    let loudest = 0;
    let raf = 0;
    const started = performance.now();

    const stop = () => {
      cancelAnimationFrame(raf);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      stopRef.current = null;
    };
    stopRef.current = stop;

    const recent: number[] = [];
    const tick = () => {
      analyser.getFloatTimeDomainData(frame);
      recent.push(loudness(frameDb(frame)));
      if (recent.length > SCREAM_SUSTAIN_FRAMES) recent.shift();
      // Only a sustained level counts; the peak is taken over the average.
      const now = recent.reduce((sum, v) => sum + v, 0) / SCREAM_SUSTAIN_FRAMES;
      loudest = Math.max(loudest, now);
      setLevel(now);
      if (performance.now() - started < LISTEN_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        stop();
        setLevel(0);
        setPeak(loudest);
        setListening(false);
      }
    };

    setPeak(null);
    setListening(true);
    raf = requestAnimationFrame(tick);
  }

  const fill = listening ? level : (peak ?? 0);

  return (
    <div className="mt-5 border-t border-rule pt-5">
      <input type="hidden" name="urgency" value={eligible && tier ? tier : ""} />

      <p className="font-semibold">Scream “AHHHH!”</p>
      <p className="text-[13px] text-ink-2">
        The louder you scream, the more urgently it has to go — and the higher it sits on the board.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={scream}
          disabled={!eligible || listening}
          aria-pressed={listening}
          className={`inline-flex min-h-12 items-center justify-center rounded-sm px-6 text-[18px] font-black tracking-wide text-on-accent transition-transform duration-75 disabled:cursor-not-allowed ${
            listening ? "scale-105 animate-pulse bg-accent" : "bg-accent hover:brightness-[1.08] active:scale-95"
          } ${!eligible ? "opacity-40" : ""}`}
        >
          SCREAM!
        </button>
        {tier && !listening && eligible && (
          <p className="text-[15px]">
            <span className="font-semibold">{urgencyLabel[tier]}</span>
            <button
              type="button"
              onClick={() => setPeak(null)}
              className="ml-3 text-[13px] text-ink-2 underline underline-offset-[3px] hover:text-ink"
            >
              Clear
            </button>
          </p>
        )}
        {listening && <p className="text-[15px] font-semibold text-accent">Listening…</p>}
      </div>

      {/* One band per tier, so the meter shows exactly where each cut-off is. */}
      <div className="mt-4" aria-hidden="true">
        <div className="relative h-3 overflow-hidden rounded-sm border border-border-strong bg-surface">
          <div
            className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-75"
            style={{ width: `${Math.round(fill * 100)}%` }}
          />
          {urgencyTiers.slice(1).map((t, i) => (
            <span
              key={t.value}
              className="absolute inset-y-0 w-px bg-ink/40"
              style={{ left: `${((i + 1) / urgencyTiers.length) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-1 grid text-[12px] text-ink-2" style={{ gridTemplateColumns: `repeat(${urgencyTiers.length}, 1fr)` }}>
          {urgencyTiers.map((t) => (
            <span key={t.value} className={`text-center ${tier === t.value && !listening ? "font-semibold text-ink" : ""}`}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <p role="status" aria-live="polite" className="mt-2 text-[13px]">
        {error ? (
          <span className="text-accent">{error}</span>
        ) : !eligible ? (
          <span className="text-ink-2">Only deadlines within a week can be urgent. Pick an earlier date to scream.</span>
        ) : tier && !listening ? (
          <span className="sr-only">Urgency set to {urgencyLabel[tier]}</span>
        ) : null}
      </p>
    </div>
  );
}
