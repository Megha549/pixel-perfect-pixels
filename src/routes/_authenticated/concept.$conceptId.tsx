import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, GlassCard } from "@/components/bridge/Chrome";
import { SqlEditor } from "@/components/bridge/SqlEditor";
import {
  checkQuery,
  diagnose,
  getConcept,
  type Diagnosis,
  type ConceptId,
} from "@/lib/bridge-content";
import { fetchProfile, recordProgress } from "@/lib/bridge-data";

export const Route = createFileRoute("/_authenticated/concept/$conceptId")({
  head: () => ({
    meta: [
      { title: "Concept flow — Bridge" },
      {
        name: "description",
        content:
          "Answer, apply, get diagnosed, get the fix, then verify transfer on a brand-new SQL problem.",
      },
      { property: "og:title", content: "Concept flow — Bridge" },
      {
        property: "og:description",
        content: "The Learn → Apply → Diagnose → Fix → Verify loop for one SQL concept.",
      },
    ],
  }),
  component: ConceptFlow,
});

type Stage = "academic" | "apply" | "diagnosing" | "misconception" | "fix" | "verify" | "done";

const STAGE_STEP: Record<Stage, number> = {
  academic: 1,
  apply: 2,
  diagnosing: 3,
  misconception: 3,
  fix: 4,
  verify: 5,
  done: 5,
};

function ConceptFlow() {
  const { conceptId } = Route.useParams();
  const concept = getConcept(conceptId);
  if (!concept) throw notFound();

  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [stage, setStage] = useState<Stage>("academic");
  const [choice, setChoice] = useState<string | null>(null);
  const [academicFeedback, setAcademicFeedback] = useState<string | null>(null);
  const [query, setQuery] = useState(concept.apply.starter);
  const [verifyQuery, setVerifyQuery] = useState(concept.verify.starter);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function submitAcademic() {
    if (!choice) return;
    if (choice === concept.academic.correct) {
      setAcademicFeedback(null);
      await recordProgress(concept.id as ConceptId, { answered: true });
      qc.invalidateQueries({ queryKey: ["progress"] });
      setStage("apply");
    } else {
      setAcademicFeedback(
        `Not quite — and that's useful information. ${concept.academic.why} Read it again and pick once more.`,
      );
    }
  }

  async function runApply() {
    const ok = checkQuery(query, concept.apply.required);
    await recordProgress(concept.id as ConceptId, { answered: true, attempts: 1 });
    if (ok) {
      setStage("verify");
      return;
    }
    setStage("diagnosing");
    const d = await diagnose(concept, query);
    setDiagnosis(d);
    await recordProgress(concept.id as ConceptId, {
      answered: true,
      last_misconception: d.label,
    });
    qc.invalidateQueries({ queryKey: ["progress"] });
    setStage("misconception");
  }

  async function runVerify() {
    if (!checkQuery(verifyQuery, concept.verify.required)) {
      setVerifyError(
        "Close. This one is still missing the part that keeps the unmatched rows — try the pattern from the fix above.",
      );
      return;
    }
    setVerifyError(null);
    await recordProgress(concept.id as ConceptId, { answered: true, transferred: true });
    qc.invalidateQueries({ queryKey: ["progress"] });
    setStage("done");
  }

  const step = STAGE_STEP[stage];

  return (
    <AppShell name={profile?.display_name ?? "Student"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Concept flow · {concept.name}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {concept.blurb}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={
                n === step
                  ? "rounded-full bg-brand px-2.5 py-1 font-semibold text-primary-foreground"
                  : n < step
                    ? "rounded-full bg-verify/15 px-2.5 py-1 font-semibold text-verify"
                    : "rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground"
              }
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {stage === "academic" && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Step 1 · Academic question
              </span>
              <h2 className="mt-3 font-display text-xl font-semibold">{concept.academic.prompt}</h2>
              <div className="mt-4 space-y-2">
                {concept.academic.options.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setChoice(o.id)}
                    className={
                      choice === o.id
                        ? "w-full rounded-xl border border-brand bg-brand/10 px-4 py-3 text-left text-sm font-medium"
                        : "w-full rounded-xl border border-border bg-card/70 px-4 py-3 text-left text-sm text-muted-foreground"
                    }
                  >
                    {o.text}
                  </button>
                ))}
              </div>
              {academicFeedback && (
                <p className="mt-4 rounded-xl border border-caution/30 bg-caution/10 p-3 text-sm">
                  {academicFeedback}
                </p>
              )}
              <button
                onClick={submitAcademic}
                disabled={!choice}
                className="mt-5 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30 disabled:opacity-50"
              >
                Submit answer
              </button>
            </GlassCard>
          )}

          {(stage === "apply" || stage === "diagnosing") && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Step 2 · Apply it for real
              </span>
              <h2 className="mt-3 font-display text-xl font-semibold">{concept.apply.task}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{concept.apply.scenario}</p>
              <div className="mt-4">
                <SqlEditor value={query} onChange={setQuery} />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={runApply}
                  disabled={stage === "diagnosing"}
                  className="rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30 disabled:opacity-60"
                >
                  {stage === "diagnosing" ? "Reading your query…" : "Run query"}
                </button>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  Mistakes are the point here
                </span>
              </div>
            </GlassCard>
          )}

          {stage === "diagnosing" && (
            <GlassCard>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-accent-foreground">
                  Step 3 · Diagnosing
                </span>
                <span className="size-2 animate-pulse rounded-full bg-accent" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Comparing what you wrote with what the scenario actually needs…
              </p>
            </GlassCard>
          )}

          {(stage === "misconception" || stage === "fix") && diagnosis && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-accent-foreground">
                Step 3 · Likely misconception
              </span>
              <p className="mt-3 text-sm">{diagnosis.plainLanguage}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-medium text-destructive">
                  {diagnosis.label}
                </span>
                <span className="rounded-full bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Confidence {Math.round(diagnosis.confidence * 100)}%
                </span>
              </div>

              {stage === "misconception" && (
                <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/10 p-4">
                  <p className="text-sm font-medium">{diagnosis.followUp.question}</p>
                  <div className="mt-3 space-y-2">
                    {diagnosis.followUp.options.map((o) => (
                      <button
                        key={o}
                        onClick={() => setFollowUp(o)}
                        className={
                          followUp === o
                            ? "w-full rounded-xl border border-brand bg-card/80 px-4 py-2.5 text-left text-sm font-medium"
                            : "w-full rounded-xl border border-border bg-card/70 px-4 py-2.5 text-left text-sm text-muted-foreground"
                        }
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStage("fix")}
                    disabled={!followUp}
                    className="mt-4 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    Show me the fix
                  </button>
                </div>
              )}
            </GlassCard>
          )}

          {stage === "fix" && diagnosis && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Step 4 · Targeted fix
              </span>
              <p className="mt-3 text-sm">{diagnosis.explanation}</p>
              <div className="mt-4 rounded-2xl border border-caution/25 bg-caution/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-caution">
                  Counterexample · {diagnosis.counterexample.title}
                </p>
                <p className="mt-2 text-sm">{diagnosis.counterexample.body}</p>
              </div>
              <div className="mt-4">
                <SqlEditor readOnly value={diagnosis.counterexample.sql} filename="fix.sql" />
              </div>
              <button
                onClick={() => setStage("verify")}
                className="mt-5 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
              >
                Try a fresh problem
              </button>
            </GlassCard>
          )}

          {stage === "verify" && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Step 5 · Verify transfer
              </span>
              <h2 className="mt-3 font-display text-xl font-semibold">{concept.verify.task}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{concept.verify.scenario}</p>
              <div className="mt-4">
                <SqlEditor value={verifyQuery} onChange={setVerifyQuery} filename="verify.sql" />
              </div>
              {verifyError && (
                <p className="mt-4 rounded-xl border border-caution/30 bg-caution/10 p-3 text-sm">
                  {verifyError}
                </p>
              )}
              <button
                onClick={runVerify}
                className="mt-5 rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
              >
                Submit query
              </button>
            </GlassCard>
          )}

          {stage === "done" && (
            <GlassCard>
              <span className="font-mono text-[11px] uppercase tracking-widest text-verify">
                Transferred
              </span>
              <h2 className="mt-3 font-display text-2xl font-semibold">
                You've now demonstrated this, not just answered it.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {concept.name} is recorded as transferred in your evidence — you applied it to a
                problem you hadn't seen before.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/evidence"
                  className="rounded-xl gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30"
                >
                  View my evidence
                </Link>
                <Link
                  to="/dashboard"
                  className="rounded-xl border border-border bg-card/70 px-4 py-2.5 text-sm font-medium text-muted-foreground"
                >
                  Back to dashboard
                </Link>
              </div>
            </GlassCard>
          )}
        </div>

        <div className="space-y-4">
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">Schema</h3>
            <div className="mt-3 space-y-2">
              {concept.apply.schema.map((t) => (
                <p key={t} className="rounded-xl bg-muted px-3 py-2 font-mono text-[12px]">
                  {t}
                </p>
              ))}
              <p className="rounded-xl bg-muted px-3 py-2 font-mono text-[12px]">
                shipments(id, order_id, carrier, status)
              </p>
            </div>
          </GlassCard>
          <GlassCard>
            <h3 className="font-display text-lg font-semibold">How this works</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bridge never just says "wrong". It reads the shape of your query, names the
              misconception it suggests, fixes that specific idea, then asks you to prove it on a new
              problem.
            </p>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
