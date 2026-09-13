"use client";

import { useRouter } from "next/navigation";
import { setDevUser } from "@/lib/hub/dev-login";
import { fieldClass } from "./ui";

/**
 * Viewing the demo as a different seeded student.
 *
 * Lives in Settings, not the header. Every student sees a different board —
 * different matches, different feasible pickup times, a different contested
 * item — so switching is how you show the matcher working, but it is still
 * demo furniture and doesn't belong on the first screen a stranger sees.
 */
export function UserSwitcher({
  users,
  currentUserId,
}: {
  users: { id: string; label: string }[];
  currentUserId: string;
}) {
  const router = useRouter();

  return (
    <label className="block">
      <span className="sr-only">Viewing as</span>
      <select
        key={currentUserId}
        defaultValue={currentUserId}
        onChange={(e) => {
          setDevUser(e.target.value);
          router.refresh();
        }}
        className={fieldClass}
      >
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.label}
          </option>
        ))}
      </select>
    </label>
  );
}
