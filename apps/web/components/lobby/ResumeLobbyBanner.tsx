"use client";

import Link from "next/link";
import { useActiveLobby } from "@/lib/hooks/useActiveLobby";

export function ResumeLobbyBanner() {
  const { activeLobby, loading } = useActiveLobby();

  if (loading || !activeLobby) {
    return null;
  }

  const label =
    activeLobby.status === "IN_GAME" ? "Resume match" : "Return to lobby";

  return (
    <Link
      href={`/lobby/${activeLobby.code}`}
      className="rounded-md px-3 py-1.5 text-sm font-medium transition hover:opacity-90"
      style={{
        background: "var(--tuned-orange)",
        color: "var(--tuned-orange-fg)",
      }}
    >
      {label}
    </Link>
  );
}
