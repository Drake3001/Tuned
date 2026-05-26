"use client";

import { useState } from "react";

export function LobbyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-xl border border-border bg-card px-6 py-3 font-mono text-4xl tracking-[0.3em] hover:bg-muted"
      aria-label={`copy lobby code ${code}`}
    >
      {code}
      {copied && (
        <span
          className="ml-3 text-xs"
          style={{ color: "var(--tuned-orange)" }}
        >
          copied
        </span>
      )}
    </button>
  );
}
