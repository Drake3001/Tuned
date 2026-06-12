"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { isAdmin } from "@/lib/auth/roles";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-sm text-muted-foreground">…</span>;
  }

  if (!session?.user?.userId) {
    return (
      <button
        type="button"
        onClick={() => signIn("keycloak")}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        sign in
      </button>
    );
  }

  const username = session.user.username ?? "player";
  const admin = isAdmin(session.user.roles);

  return (
    <div className="flex items-center gap-3 text-sm">
      {admin && (
        <span
          className="rounded-md border border-border px-2 py-0.5 font-mono text-xs uppercase tracking-wide"
          style={{ color: "var(--tuned-orange)" }}
        >
          admin
        </span>
      )}
      <Link
        href={`/u/${username}`}
        className="hover:underline"
        style={{ color: "var(--tuned-orange)" }}
      >
        {username}
      </Link>
      <button
        type="button"
        onClick={() => signOut()}
        className="text-muted-foreground hover:text-foreground"
      >
        sign out
      </button>
    </div>
  );
}
