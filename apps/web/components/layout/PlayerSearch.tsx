"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson } from "@/lib/api/client";

type Hit = { username: string; avatarUrl: string | null };

export function PlayerSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // debounced search
  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      fetchJson<{ users: Hit[] }>(`/api/users/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          if (!cancelled) setHits(r.users);
        })
        .catch(() => {
          if (!cancelled) setHits([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [q]);

  // close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const go = (username: string) => {
    const name = username.trim();
    if (!name) return;
    setOpen(false);
    setQ("");
    setHits([]);
    router.push(`/u/${encodeURIComponent(name)}`);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(hits[0]?.username ?? q);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="search players…"
        className="w-40 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm outline-none transition focus:w-52 focus:border-border/80"
        aria-label="search players"
      />
      {open && hits.length > 0 && (
        <ul className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
          {hits.map((h) => (
            <li key={h.username}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(h.username);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{
                    background: "var(--tuned-orange)",
                    color: "var(--tuned-orange-fg)",
                  }}
                >
                  {h.username[0]?.toUpperCase()}
                </span>
                <span className="truncate">{h.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
