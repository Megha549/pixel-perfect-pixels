import { supabase } from "@/integrations/supabase/client";
import type { ConceptId } from "@/lib/bridge-content";

export interface Profile {
  id: string;
  display_name: string | null;
  course: string | null;
  semester: string | null;
  subjects: string[];
  interests: string[];
  skill_level: string | null;
  onboarded: boolean;
}

export interface ProgressRow {
  concept_id: string;
  answered: boolean;
  transferred: boolean;
  attempts: number;
  last_misconception: string | null;
}

export async function fetchProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, course, semester, subjects, interests, skill_level, onboarded")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ id: auth.user.id, display_name: auth.user.email?.split("@")[0] ?? null })
    .select("id, display_name, course, semester, subjects, interests, skill_level, onboarded")
    .single();
  if (insertError) throw insertError;
  return created as Profile;
}

export async function saveProfile(patch: Partial<Profile>) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("profiles")
    .update({ ...patch, onboarded: true })
    .eq("id", auth.user.id);
  if (error) throw error;
}

export async function fetchProgress(): Promise<ProgressRow[]> {
  const { data, error } = await supabase
    .from("concept_progress")
    .select("concept_id, answered, transferred, attempts, last_misconception");
  if (error) throw error;
  return (data ?? []) as ProgressRow[];
}

export async function recordProgress(
  conceptId: ConceptId,
  patch: Partial<Omit<ProgressRow, "concept_id">>,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("concept_progress")
    .upsert(
      { user_id: auth.user.id, concept_id: conceptId, ...patch },
      { onConflict: "user_id,concept_id" },
    );
  if (error) throw error;
}
