import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, GlassCard, Meter } from "@/components/bridge/Chrome";
import { CONCEPTS } from "@/lib/bridge-content";
import { fetchProfile, fetchProgress } from "@/lib/bridge-data";

export const Route = createFileRoute("/_authenticated/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — Bridge" },
      {
        name: "description",
        content:
          "Which SQL concepts you have truly transferred to real problems versus merely answered correctly.",
      },
      { property: "og:title", content: "Evidence — Bridge" },
      {
        property: "og:description",
        content: "A track record of demonstrated SQL ability, not a score.",
      },
    ],
  }),
  component: Evidence,
});

function Evidence() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: progress = [] } = useQuery({ queryKey: ["progress"], queryFn: fetchProgress });

  const transferred = progress.filter((p) => p.transferred).length;

  return (
    <AppShell name={profile?.display_name ?? "Student"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Track record
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Evidence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answered correctly is not the same as demonstrated on an unfamiliar problem.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brand" />
            Answered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-verify" />
            Transferred
          </span>
        </div>
      </div>

      <GlassCard className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {transferred} of {CONCEPTS.length} concepts demonstrated
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">SQL / DBMS</span>
        </div>
        <div className="mt-5 space-y-3">
          {CONCEPTS.map((c) => {
            const row = progress.find((p) => p.concept_id === c.id);
            const state = row?.transferred
              ? { label: "Transferred", cls: "text-verify", pct: 100 }
              : row?.answered
                ? { label: "Answered only", cls: "text-brand", pct: 55 }
                : { label: "Not started", cls: "text-muted-foreground", pct: 6 };
            return (
              <div key={c.id} className="rounded-2xl border border-white/60 bg-card/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                  </div>
                  <span className={`font-mono text-[11px] ${state.cls}`}>{state.label}</span>
                </div>
                <div className="mt-3">
                  <Meter pct={state.pct} />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {row?.attempts ? `${row.attempts} attempt(s)` : "no attempts yet"}
                    {row?.last_misconception ? ` · last diagnosis: ${row.last_misconception}` : ""}
                  </span>
                  <Link
                    to="/concept/$conceptId"
                    params={{ conceptId: c.id }}
                    className="text-xs font-semibold text-brand"
                  >
                    {row?.transferred ? "Revisit" : "Run the loop"} →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </AppShell>
  );
}
