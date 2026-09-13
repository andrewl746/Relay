"use client";

import { useRouter } from "next/navigation";
import { setDevUser } from "@/lib/hub/dev-login";

const SIGN_IN = "__sign-in";

export function UserSwitcher({
  users,
  currentUserId,
}: {
  users: { id: string; label: string }[];
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Viewing as</span>
      <select
        key={currentUserId}
        defaultValue={currentUserId}
        onChange={(e) => {
          if (e.target.value === SIGN_IN) {
            router.push("/login");
            return;
          }
          setDevUser(e.target.value);
          router.refresh();
        }}
        className="h-11 max-w-[6.5rem] truncate rounded-1 border border-rule-strong bg-paper-raised pr-7 pl-3 text-[13px] font-semibold text-ink sm:max-w-[16rem]"
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
        <option value={SIGN_IN}>Sign in with Google…</option>
      </select>
    </label>
  );
}
