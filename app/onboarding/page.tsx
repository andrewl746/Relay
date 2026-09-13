"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/hub/logo";
import { btnPrimary, fieldClass } from "@/components/hub/ui";

const LOCATIONS = ['northdale', 'beechwood', 'king-st', 'university-ave', 'lakeshore'];
const WINDOWS = ['morning', 'afternoon', 'evening'] as const;

const UNIVERSITIES = [
  'University of Waterloo',
  'MIT',
  'Stanford University',
  'University of Toronto',
  'UC Berkeley',
  'Georgia Tech',
  'Carnegie Mellon',
  'University of Michigan',
  'Other',
];

const chip = (on: boolean) =>
  `min-h-11 rounded-sm border px-3 text-[14px] font-semibold capitalize transition-colors duration-100 ${
    on
      ? 'border-accent bg-accent text-on-accent'
      : 'border-border-strong bg-surface text-ink-2 hover:border-ink-3 hover:text-ink'
  }`;

export default function OnboardingPage() {
  const router = useRouter();
  const [university, setUniversity] = useState('');
  const [location, setLocation] = useState('');
  const [windows, setWindows] = useState<Set<string>>(new Set());

  const toggleWindow = (w: string) => {
    setWindows(prev => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  };

  const ready = university && location && windows.size > 0;

  return (
    <div className="flex min-h-screen flex-col bg-bg font-sans text-ink">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[var(--page-max)] items-center px-5 py-4 sm:px-6">
          <Logo className="h-8 bg-ink" />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-6 sm:py-20">
        <div className="w-full max-w-[520px] rounded-md border border-border bg-surface p-6 shadow-[var(--lift)] sm:p-8">
          <h1 className="text-[clamp(28px,4vw,34px)] leading-tight font-semibold tracking-[-0.02em]">
            Set up your account
          </h1>
          <p className="mt-2 text-[15px] text-ink-2">
            Set your university, neighbourhood, and when you&rsquo;re free so we can match you with pickups.
          </p>

          <div className="mt-7">
            <label htmlFor="demo-university" className="mb-1.5 block text-[14px] font-semibold">
              University
            </label>
            <select
              id="demo-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>Select your university</option>
              {UNIVERSITIES.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-1.5 block text-[14px] font-semibold">Neighbourhood</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  aria-pressed={location === loc}
                  onClick={() => setLocation(loc)}
                  className={chip(location === loc)}
                >
                  {loc.replace('-', ' ')}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-1.5 block text-[14px] font-semibold">Pickup windows</legend>
            <div className="flex gap-2">
              {WINDOWS.map(w => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={windows.has(w)}
                  onClick={() => toggleWindow(w)}
                  className={`${chip(windows.has(w))} flex-1`}
                >
                  {w}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            onClick={() => router.push('/')}
            disabled={!ready}
            className={`${btnPrimary} mt-8 w-full`}
          >
            Continue
          </button>

          {!ready && (
            <p className="mt-3 text-center text-[13px] text-ink-2">Fill in all three to continue.</p>
          )}
        </div>
      </main>
    </div>
  );
}
