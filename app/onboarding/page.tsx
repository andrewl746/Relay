"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <div className="min-h-screen bg-[var(--chassis)] text-[var(--text-primary)] flex items-center justify-center px-4">
      {/* Dot grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #E4E7EB 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-[520px]">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-bold tracking-[-0.03em] mb-2">
          CONFIGURE YOUR NODE
        </h1>
        <p className="text-[var(--text-muted)] mb-10 text-[15px]">
          Set your university, location, and availability so the routing engine can match you.
        </p>

        {/* University */}
        <div className="mb-8">
          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] block mb-3">
            University
          </label>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full rounded-[2px] border border-[var(--bezel)] bg-[#1E2028] px-3 py-3 text-[15px] text-[var(--text-primary)] font-[family-name:var(--font-ui)] appearance-none cursor-pointer focus:border-[var(--active-route)]"
          >
            <option value="" disabled>Select your university</option>
            {UNIVERSITIES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className="mb-8">
          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] block mb-3">
            Neighbourhood
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LOCATIONS.map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(loc)}
                className={`rounded-[2px] border px-3 py-2.5 text-[13px] font-semibold transition-all duration-75 font-[family-name:var(--font-data)] ${
                  location === loc
                    ? 'border-[var(--secured)] bg-[var(--secured)] text-white'
                    : 'border-[var(--bezel)] bg-[var(--panel)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Pickup Windows */}
        <div className="mb-10">
          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] block mb-3">
            Pickup Windows
          </label>
          <div className="flex gap-2">
            {WINDOWS.map(w => (
              <button
                key={w}
                type="button"
                onClick={() => toggleWindow(w)}
                className={`flex-1 rounded-[2px] border px-4 py-3 text-[14px] font-bold uppercase tracking-wide transition-all duration-75 ${
                  windows.has(w)
                    ? 'border-[var(--active-route)] bg-[var(--active-route)] text-white'
                    : 'border-[var(--bezel)] bg-[var(--panel)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => router.push('/')}
          disabled={!ready}
          className="w-full min-h-12 rounded-[2px] bg-[var(--active-route)] text-[15px] font-bold text-white tracking-wide transition-all duration-75 hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ACTIVATE
        </button>

        {!ready && (
          <p className="mt-3 text-center text-[12px] text-[var(--text-muted)] font-[family-name:var(--font-data)]">
            Select all fields to continue
          </p>
        )}
      </div>
    </div>
  );
}
