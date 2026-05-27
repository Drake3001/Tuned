"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMockSession, signInMock, signOutMock } from "@/lib/mock/auth";

export function UserMenu() {
  const [session, setSession] = useState<{ username: string } | null>(null);

  useEffect(() => {
    setSession(getMockSession());
    const onUpdate = () => setSession(getMockSession());
    window.addEventListener("tuned:session", onUpdate);
    return () => window.removeEventListener("tuned:session", onUpdate);
  }, []);

  if (!session) {
    return (
      <button
        type="button"
        onClick={() => signInMock()}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
      >
        sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={`/u/${session.username}`}
        className="hover:underline"
        style={{ color: "var(--tuned-orange)" }}
      >
        {session.username}
      </Link>
      <button
        type="button"
        onClick={() => signOutMock()}
        className="text-muted-foreground hover:text-foreground"
      >
        sign out
      </button>
    </div>
  );
}
