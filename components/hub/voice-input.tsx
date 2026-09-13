"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Say it instead of typing it.
 *
 * The browser already ships a speech recogniser, so this is the platform
 * feature rather than a dependency, an API key, or audio uploaded anywhere:
 * nothing leaves the machine except through the browser's own service, and
 * there is no recording to store.
 *
 * It is wired to real inputs, not to a transcript box. The words land in the
 * field as you speak them and then the form is submitted for you, so saying
 * "bookshelf" runs the actual search and saying "a lamp for my desk" actually
 * adds the row to your list. Nothing here is decorative — remove this button
 * and the only thing that changes is that you have to type.
 *
 * Chromium and Safari implement it; Firefox does not, so the button hides
 * itself rather than sitting there dead.
 */

type Alternative = { transcript: string };
type Result = ArrayLike<Alternative> & { isFinal: boolean };
type SpeechEvent = { resultIndex: number; results: ArrayLike<Result> };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Set a field's value so React notices.
 *
 * Assigning `.value` on a controlled input is invisible to React — it tracks
 * the last value it rendered and skips the change. Going through the prototype
 * setter and dispatching a real input event is what the field would see from a
 * keystroke, so controlled and uncontrolled inputs both behave.
 */
function writeValue(el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Speech support does not change while the page is open; nothing to subscribe to. */
const neverChanges = () => () => {};

export function VoiceInput({
  targetId,
  submitOnFinish = false,
  label = "Speak",
}: {
  /** id of the input this fills. */
  targetId: string;
  /** Submit the input's form once the sentence is finished. */
  submitOnFinish?: boolean;
  label?: string;
}) {
  // A fact about the browser rather than state: false on the server and during
  // hydration, then whatever this browser actually supports.
  const supported = useSyncExternalStore(neverChanges, () => recognitionCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => () => rec.current?.abort(), []);

  const stop = () => {
    rec.current?.stop();
    setListening(false);
  };

  const start = () => {
    if (listening) return stop();
    const Ctor = recognitionCtor();
    const field = document.getElementById(targetId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!Ctor || !field) return;

    const r = new Ctor();
    r.lang = document.documentElement.lang || "en-CA";
    r.interimResults = true; // words appear as they are said, not in one lump
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let text = "";
      let done = false;
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
        if (e.results[i].isFinal) done = true;
      }
      const value = text.trim().replace(/[.。]$/, "");
      writeValue(field, value);
      if (done && value) {
        setListening(false);
        r.stop();
        if (submitOnFinish) field.form?.requestSubmit();
      }
    };

    r.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone blocked. Allow it in the address bar."
          : e.error === "no-speech"
            ? "Didn't catch that."
            : "Voice input failed.",
      );
      setListening(false);
    };

    r.onend = () => setListening(false);

    rec.current = r;
    setError(null);
    setListening(true);
    r.start();
  };

  if (!supported) return null;

  return (
    <>
      <button
        type="button"
        onClick={start}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : label}
        title={listening ? "Stop listening" : label}
        className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm border px-3.5 text-[15px] font-semibold transition-colors duration-100 ${
          listening
            ? "border-accent bg-accent text-on-accent"
            : "border-border-strong bg-surface text-ink hover:bg-surface-2"
        }`}
      >
        <MicIcon listening={listening} />
        <span className="hidden sm:inline">{listening ? "Listening…" : label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {listening ? "Listening" : error ?? ""}
      </span>
      {error && <p className="basis-full text-[13px] text-accent">{error}</p>}
    </>
  );
}

function MicIcon({ listening }: { listening: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={`size-[18px] ${listening ? "animate-pulse" : ""}`}
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
