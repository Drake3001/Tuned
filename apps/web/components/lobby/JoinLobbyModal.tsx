"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
};

// keep in sync with lobby-code alphabet (no I/O/0/1)
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;

export function JoinLobbyModal({ open, onClose, onJoin }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const normalized = code.trim().toUpperCase();
  const valid = CODE_RE.test(normalized);

  const submit = () => {
    if (!valid) {
      setError("enter a valid 6-character code");
      return;
    }
    onJoin(normalized);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-bold">join lobby</h2>
        <p className="mt-1 text-sm text-muted-foreground">enter the 6-character code</p>

        <input
          autoFocus
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 6));
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="ABC123"
          maxLength={6}
          className="mt-6 w-full rounded-lg border border-border bg-muted/40 px-4 py-3 text-center font-mono text-2xl uppercase tracking-[0.4em] tabular-nums outline-none focus:border-[var(--tuned-orange)]"
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="flex-[2] rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
            style={{
              background: "var(--tuned-orange)",
              color: "var(--tuned-orange-fg)",
            }}
          >
            join lobby
          </button>
        </div>
      </div>
    </div>
  );
}
