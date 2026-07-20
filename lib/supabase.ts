import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = Boolean(supabase);

export async function saveCase(caseType: "zakat" | "faraid", madhhab: string, input: object, result: object) {
  if (!supabase) return saveLocal("cases", { case_type: caseType, madhhab, input_data: input, result_data: result, verification_status: "unverified" });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in before saving.");
  const { error } = await supabase.from("cases").insert({
    user_id: user.id,
    case_type: caseType,
    madhhab: normalizeMadhhab(madhhab),
    title: caseType === "zakat" ? "Zakat calculation" : "Farā’iḍ case",
    input_data: input,
    result_data: result,
  });
  if (error) throw error;
  return { local: false };
}

export async function saveAppointment(payload: Record<string, unknown>) {
  if (!supabase) return saveLocal("appointments", payload);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in before booking.");
  const { error } = await supabase.from("appointments").insert({ user_id: user.id, ...payload });
  if (error) throw error;
  return { local: false };
}

export async function listRecords() {
  if (!supabase) {
    return {
      cases: readLocal("cases"),
      appointments: readLocal("appointments"),
    };
  }
  const [{ data: cases }, { data: appointments }] = await Promise.all([
    supabase.from("cases").select("*").order("created_at", { ascending: false }),
    supabase.from("appointments").select("*").order("created_at", { ascending: false }),
  ]);
  return { cases: cases ?? [], appointments: appointments ?? [] };
}

function normalizeMadhhab(value: string) {
  return value.toLowerCase().replaceAll("'", "").replace("shafi’i", "shafii");
}

function saveLocal(bucket: string, payload: object) {
  const records = readLocal(bucket);
  records.unshift({ id: crypto.randomUUID(), ...payload, created_at: new Date().toISOString() });
  window.localStorage.setItem(`mizan-${bucket}`, JSON.stringify(records.slice(0, 40)));
  return { local: true };
}

function readLocal(bucket: string): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(window.localStorage.getItem(`mizan-${bucket}`) ?? "[]");
}
