import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell, GlassCard, Meter } from "@/components/bridge/Chrome";
import { CONCEPTS } from "@/lib/bridge-content";
import { fetchProfile, fetchProgress } from "@/lib/bridge-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Bridge" },
      { name: "description", content: "Your six Bridge modules and current SQL concept flow." },
      { property: "og:title", content: "Dashboard — Bridge" },
      { property: "og:description", content: "Learn, Practice, Apply, Build, Explore, Evidence." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const { data: progress = [] } = useQuery({ queryKey: ["progress"], queryFn: fetchProgress });

  const answered = progress.filter((p) => p.answered).length;
  const transferred = progress.filter((p) => p.transferred).length;
  const mastery = Math.round((transferred / CONCEPTS.length) * 100);

  const modules = [
    { name: "Learn", note: "Concepts & theory", meta: `${answered} / 5 concepts`, pct: (answered / 5) * 100, to: "/concept/select" as const },
    { name: "Practice", note: "Drills & repetition", meta: `${progress.reduce((a, p) => a + p.attempts, 0)} attempts`, pct: Math.min(100, progress.reduce((a, p) => a + p.attempts, 0) * 10), to: "/concept/groupby" as const },
    { name: "Apply", note: "Real schemas", meta: `${transferred} / 5 transferred`, pct: (transferred / 5) * 100, to: "/concept/join" as const },
    { name: "Build", note: "Projects & capstones", meta: transferred >= 3 ? "unlocked" : "locked", pct: transferred >= 3 ? 20 : 0, to: "/concept/subqueries" as const },
    { name: "Explore", note: "Self-directed", meta: "open", pct: 25, to: "/concept/nulls" as const },
    { name: "Evidence", note: "Proof of skill", meta: `${transferred} demonstrated`, pct: mastery, to: "/evidence" as const },
  ];

  const next = CONCEPTS.find((c) => !progress.some((p) => p.concept_id === c.id && p.transferred));

  return (
    <AppShell name={profile?.display_name ?? "Student"}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            SQL Pathway · 6 modules
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {profile?.display_name ? `${profile.display_name}'s dashboard` : "Your dashboard"}
          </h1>
        </div>
        <div className="lg:ml-auto lg:text-right">
          <p className="text-sm text-muted-foreground">Transfer mastery</p>
          <p className="font-display text-2xl font-semibold">
            <span className="text-brand">{mastery}</span>
            <span className="text-lg text-muted-foreground">/100</span>
          </p>
        </div>
      </div>

      {!profile?.onboarded && (
        <Link
          to="/profile"
          className="mt-6 block rounded-2xl border border-accent/25 bg-accent/10 p-4 text-sm"
        >
          Finish your profile — course, semester and skill level — so problems match where you are.
        </Link>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.name}
            to={m.to}
            className="rounded-2xl border border-white/60 bg-card/65 p-4 shadow-sm backdrop-blur-xl transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{m.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{m.meta}</span>
            </div>
            <div className="mt-3">
              <Meter pct={m.pct} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{m.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={
                    n === 1
                      ? "rounded-full bg-brand px-2.5 py-1 font-semibold text-primary-foreground"
                      : "rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground"
                  }
                >
                  {n}
                </span>
              ))}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              Concept flow · {next?.name ?? "all concepts transferred"}
            </span>
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">
            {next ? `Next up · ${next.name}` : "Every concept demonstrated"}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {next?.blurb ?? "Revisit any concept to keep the evidence fresh."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              to="/concept/$conceptId"
              params={{ conceptId: next?.id ?? "join" }}
              className="rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
            >
              Start the loop
            </Link>
            <Link
              to="/evidence"
              className="rounded-xl border border-border bg-card/70 px-4 py-2.5 text-sm font-medium text-muted-foreground"
            >
              See evidence
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Evidence</h3>
            <span className="font-mono text-[11px] text-muted-foreground">5 concepts</span>
          </div>
          <div className="mt-4 space-y-3">
            {CONCEPTS.map((c) => {
              const row = progress.find((p) => p.concept_id === c.id);
              const state = row?.transferred
                ? { label: "Transferred", cls: "text-verify", pct: 100 }
                : row?.answered
                  ? { label: "Answered only", cls: "text-brand", pct: 55 }
                  : { label: "Not started", cls: "text-muted-foreground", pct: 6 };
              return (
                <Link
                  key={c.id}
                  to="/concept/$conceptId"
                  params={{ conceptId: c.id }}
                  className="block rounded-xl border border-white/60 bg-card/70 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className={`font-mono text-[11px] ${state.cls}`}>{state.label}</span>
                  </div>
                  <div className="mt-2">
                    <Meter pct={state.pct} />
                  </div>
                </Link>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
