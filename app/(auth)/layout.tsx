import type { ReactNode } from "react";
import { PlainHeader } from "@/components/hub/plain-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col font-sans text-ink">
      <PlainHeader />

      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-6 sm:py-20">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
