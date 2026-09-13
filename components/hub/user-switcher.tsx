"use client";

import { useRouter } from "next/navigation";
import { setDevUser } from "@/lib/hub/dev-login";

const SIGN_IN = "__sign-in";
const SIGN_OUT = "__sign-out";

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
          if (e.target.value === SIGN_OUT) {
            // A real navigation, not fetch — the response is a redirect and
            // this is the request that needs to carry the cleared cookie.
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "/auth/signout";
            document.body.appendChild(form);
            form.submit();
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
        <option value={SIGN_IN}>Sign in with a school email…</option>
        <option value={SIGN_OUT}>Sign out</option>
      </select>
    </label>
  );
}
