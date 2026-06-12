"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/auth/roles";
import { fetchJson } from "@/lib/api/client";
import type { RGB } from "@/lib/game/color";

type PreviewData = {
  day: string;
  seed: string;
  targets: RGB[];
};

export function AdminDailyPreview() {
  const { data: session, status } = useSession();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roles = session?.user?.roles;
  const showPreview = status === "authenticated" && isAdmin(roles);

  useEffect(() => {
    if (!showPreview) {
      setPreview(null);
      setError(null);
      return;
    }

    fetchJson<PreviewData>("/api/admin/daily-preview")
      .then(setPreview)
      .catch((e: unknown) => {
        setPreview(null);
        setError(e instanceof Error ? e.message : "failed to load preview");
      });
  }, [showPreview]);

  if (!showPreview) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 pb-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            admin · daily preview
          </h2>
          {preview && (
            <span className="font-mono text-xs text-muted-foreground">{preview.day} UTC</span>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {preview && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">seed</p>
              <p className="font-mono text-lg" style={{ color: "var(--tuned-orange)" }}>
                {preview.seed}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preview.targets.map((rgb, i) => (
                <div
                  key={i}
                  title={`rgb(${rgb.join(", ")})`}
                  className="h-10 w-10 rounded-md border border-border"
                  style={{ backgroundColor: `rgb(${rgb.join(", ")})` }}
                />
              ))}
            </div>
          </div>
        )}
        {!preview && !error && (
          <p className="mt-3 text-sm text-muted-foreground">loading preview…</p>
        )}
      </div>
    </section>
  );
}
