import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, GlassCard } from "@/components/bridge/Chrome";
import { fetchProfile, saveProfile } from "@/lib/bridge-data";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile setup — Bridge" },
      {
        name: "description",
        content: "Tell Bridge your course, semester, subjects, interests and current skill level.",
      },
      { property: "og:title", content: "Profile setup — Bridge" },
      { property: "og:description", content: "Set up your Bridge student profile." },
    ],
  }),
  component: ProfilePage,
});

const SUBJECTS = ["DBMS", "Operating Systems", "Data Structures", "Networks", "Web Development"];
const INTERESTS = ["Backend", "Data analytics", "Product", "Machine learning", "Startups"];
const LEVELS = ["Just starting", "Comfortable with basics", "Can write joins", "Confident"];

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [displayName, setDisplayName] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState<string>(LEVELS[1] ?? "");

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setCourse(profile.course ?? "");
    setSemester(profile.semester ?? "");
    setSubjects(profile.subjects ?? []);
    setInterests(profile.interests ?? []);
    setLevel(profile.skill_level ?? LEVELS[1] ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      saveProfile({
        display_name: displayName,
        course,
        semester,
        subjects,
        interests,
        skill_level: level,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <AppShell name={displayName || "Student"}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Step 0</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This shapes the scenarios Bridge puts in front of you. Nothing here is graded.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <h2 className="font-display text-lg font-semibold">Where you're studying</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Name
              </span>
              <input
                className="input-glass mt-1.5"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Maya Rao"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Course
              </span>
              <input
                className="input-glass mt-1.5"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="B.Tech Computer Science"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Semester
              </span>
              <input
                className="input-glass mt-1.5"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="Semester 5"
              />
            </label>
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Current SQL level
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <Chip key={l} active={level === l} onClick={() => setLevel(l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="font-display text-lg font-semibold">Subjects & interests</h2>
          <div className="mt-4">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Subjects this semester
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Chip
                  key={s}
                  active={subjects.includes(s)}
                  onClick={() => toggle(subjects, setSubjects, s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <div className="mt-5">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              What you want to build towards
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((s) => (
                <Chip
                  key={s}
                  active={interests.includes(s)}
                  onClick={() => toggle(interests, setInterests, s)}
                >
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="mt-7 w-full rounded-xl gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-brand/30 disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save and continue"}
          </button>
        </GlassCard>
      </div>
    </AppShell>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full gradient-brand px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
          : "rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
      }
    >
      {children}
    </button>
  );
}
