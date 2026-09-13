"use client";

import { useId, useRef, useState } from "react";
import { Field } from "./form-fields";
import { btnTertiary } from "./ui";

// Photos are shrunk in the browser before they're sent: phone photos are
// several MB, server actions cap request bodies at 1MB, and listings live in
// memory, so a ~1200px JPEG data URL is small enough to carry on the listing.
const MAX_EDGE = 1200;
const QUALITY = 0.82;

async function toDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function PhotoField({ name = "photo", defaultValue = null }: { name?: string; defaultValue?: string | null }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("That file isn’t an image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setPhoto(await toDataUrl(file));
    } catch {
      setError("Couldn’t read that photo. Try a JPEG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setPhoto(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Field label="Photo" hint="Optional. One clear shot of the item helps it go faster." htmlFor={inputId}>
      {/* The file input has no name, so the raw file is never submitted —
          only the resized copy in the hidden input below. */}
      <input type="hidden" name={name} value={photo ?? ""} />
      <div className="flex items-center gap-4">
        <label
          htmlFor={inputId}
          className="grid size-24 shrink-0 cursor-pointer place-items-center overflow-hidden border border-rule-strong bg-paper-sunk hover:border-[var(--amber)] sm:size-28"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimize
            <img src={photo} alt="Selected photo" className="size-full object-cover" />
          ) : (
            <span className="t-eyebrow text-ink-3">{busy ? "Loading…" : "+ Add"}</span>
          )}
        </label>
        <div className="flex flex-col items-start gap-2 text-[13px]">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="sr-only"
          />
          <label htmlFor={inputId} className={`${btnTertiary} cursor-pointer`}>
            {photo ? "Choose a different photo" : "Upload a photo"}
          </label>
          {photo && (
            <button type="button" onClick={clear} className={btnTertiary}>
              Remove photo
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-[13px] text-signal">{error}</p>}
    </Field>
  );
}
