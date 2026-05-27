"use client";

import { useState } from "react";

type Mode = "BATTLE_ROYALE" | "ROUND_BASED";
type Scoring = "COLOR_ACCURACY" | "SPEED";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (code: string) => void;
};

export function CreateLobbyModal({ open, onClose, onCreated }: Props) {
  const [mode, setMode] = useState<Mode>("BATTLE_ROYALE");
  const [scoring, setScoring] = useState<Scoring>("COLOR_ACCURACY");
  const [livesInitial, setLivesInitial] = useState(3);
  const [roundsTotal, setRoundsTotal] = useState(5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/lobby/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          scoringMode: scoring,
          livesInitial: mode === "BATTLE_ROYALE" ? livesInitial : undefined,
          roundsTotal: mode === "ROUND_BASED" ? roundsTotal : undefined,
          maxPlayers,
        }),
      });
      if (!res.ok) throw new Error(`create failed (${res.status})`);
      const { lobby } = (await res.json()) as { lobby: { code: string } };
      onCreated(lobby.code);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-bold">new lobby</h2>
        <p className="mt-1 text-sm text-muted-foreground">configure the match</p>

        <div className="mt-6 space-y-5">
          <Section label="format">
            <Toggle
              value={mode}
              onChange={setMode}
              options={[
                ["BATTLE_ROYALE", "battle royale"],
                ["ROUND_BASED", "round-based"],
              ]}
            />
          </Section>
          <Section label="scoring">
            <Toggle
              value={scoring}
              onChange={setScoring}
              options={[
                ["COLOR_ACCURACY", "color accuracy"],
                ["SPEED", "hit the square"],
              ]}
            />
          </Section>
          {mode === "BATTLE_ROYALE" ? (
            <Section label="lives per player">
              <NumberInput value={livesInitial} onChange={setLivesInitial} min={1} max={5} />
            </Section>
          ) : (
            <Section label="rounds total">
              <NumberInput value={roundsTotal} onChange={setRoundsTotal} min={1} max={20} />
            </Section>
          )}
          <Section label="max players">
            <NumberInput value={maxPlayers} onChange={setMaxPlayers} min={2} max={8} />
          </Section>
        </div>

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
            disabled={submitting}
            className="flex-[2] rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
            style={{
              background: "var(--tuned-orange)",
              color: "var(--tuned-orange-fg)",
            }}
          >
            {submitting ? "creating…" : "create lobby"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-1 text-sm">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="flex-1 rounded-md px-3 py-1.5"
          style={
            value === key
              ? { background: "var(--tuned-orange)", color: "var(--tuned-orange-fg)" }
              : undefined
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="rounded-md px-3 py-1 hover:bg-muted"
      >
        −
      </button>
      <span className="w-12 text-center font-mono tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="rounded-md px-3 py-1 hover:bg-muted"
      >
        +
      </button>
    </div>
  );
}
