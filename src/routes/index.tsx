import { createFileRoute, Link } from "@tanstack/react-router";

import { GlassCard, Glow, Mark } from "@/components/bridge/Chrome";
import { SqlEditor } from "@/components/bridge/SqlEditor";
import { CONCEPTS } from "@/lib/bridge-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bridge — good grades ≠ practical understanding" },
      {
        name: "description",
        content:
          "Bridge runs a Learn → Apply → Diagnose → Fix → Verify loop on SQL, diagnosing the misconception behind a wrong query instead of just marking it wrong.",
      },
      { property: "og:title", content: "Bridge — good grades ≠ practical understanding" },
      {
        property: "og:description",
        content: "Prove you can write the query, not just recite the definition. Five SQL concepts.",
      },
    ],
  }),
  component: Landing,
});

const LOOP = [
  { n: "1", t: "Learn", d: "Answer the academic question on the concept." },
  { n: "2", t: "Apply", d: "Face an unfamiliar, real-world scenario and write the query." },
  { n: "3", t: "Diagnose", d: "Bridge reads your query and names the likely misconception." },
  { n: "4", t: "Fix", d: "A targeted explanation plus a counterexample for that mistake." },
  { n: "5", t: "Verify", d: "A brand-new problem proves the understanding transferred." },
];

function Landing() {
  return (
    <div className="relative min-h-screen bg-surface text-ink">
      <Glow />
      <header className="sticky top-0 z-50 border-b border-white/50 bg-card/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Mark />
          <Link
            to="/auth"
            className="rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
          >
            Try the demo
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
              SQL / DBMS · 5 concepts
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Good grades ≠ practical understanding.
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
              You can define a JOIN and still write a query that silently deletes the customers you
              were asked to find. Bridge doesn't mark answers right or wrong — it diagnoses the
              misconception underneath, fixes it, then makes you prove the fix on a fresh problem.
            </p>
            <div className="mt-7 flex items-center gap-4">
              <Link
                to="/auth"
                className="rounded-xl gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
              >
                Try the JOIN demo
              </Link>
              <span className="font-mono text-xs text-muted-foreground">
                Knowing → Doing · no timer
              </span>
            </div>
          </div>

          <GlassCard>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground">
                Concept flow · JOINs
              </span>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
                Step 3 · Diagnosing
              </span>
            </div>
            <div className="mt-4">
              <SqlEditor
                readOnly
                value={
                  "-- customers with their spend (incl. 0)\nselect c.name, sum(o.amount) as total\nfrom customers c\njoin orders o on o.customer_id = c.id\ngroup by c.id, c.name"
                }
              />
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-foreground">
              AI diagnosis
            </p>
            <div className="mt-2 rounded-2xl border border-accent/20 bg-accent/10 p-4">
              <p className="text-sm">
                Your approach may be excluding customers without a matching order — did you mean for
                that to happen? An inner join removes them before you ever see them.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-medium text-destructive">
                  Misconception: unmatched rows dropped
                </span>
                <span className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Confidence 87%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            The loop, five steps
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {LOOP.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/60 bg-card/65 p-4 shadow-sm backdrop-blur-xl"
              >
                <span className="font-mono text-[11px] text-brand">0{s.n}</span>
                <p className="mt-1 font-display font-semibold">{s.t}</p>
                <p className="mt-2 text-xs text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Five SQL concepts in the MVP
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONCEPTS.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/60 bg-card/65 p-4 shadow-sm backdrop-blur-xl"
              >
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative border-t border-white/50 bg-card/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Mark />
          <span>Evidence of what you can do, not a score.</span>
        </div>
      </footer>
    </div>
  );
}
