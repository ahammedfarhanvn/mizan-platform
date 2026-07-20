import { createClient } from "@supabase/supabase-js";
import type { AppointmentRecord, CaseRecord, CaseType, KnowledgeArticle, MasalaQuestionRecord, ProfileRecord, QaziRecord, VerificationStatus } from "./models";
import { normalizeMadhhab } from "./models";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && key && !url.includes("your-project") && !key.includes("your-public")
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
export const hasSupabase = Boolean(supabase);

function client() {
  if (!supabase) throw new Error("The Supabase backend is not configured for this deployment.");
  return supabase;
}

async function currentUserId() {
  const { data, error } = await client().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

export async function getProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await client().from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as ProfileRecord | null;
}

export async function updateProfileRecord(payload: Partial<ProfileRecord>) {
  const userId = await currentUserId();
  const { data, error } = await client().from("profiles").upsert({ id: userId, ...payload, updated_at: new Date().toISOString() }).select("*").single();
  if (error) throw error;
  return data as ProfileRecord;
}

export async function createCase(payload: {
  caseType: CaseType;
  madhhab: string;
  title: string;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  currency?: string;
  status?: VerificationStatus;
}) {
  const userId = await currentUserId();
  const { data, error } = await client().from("cases").insert({
    user_id: userId,
    case_type: payload.caseType,
    madhhab: normalizeMadhhab(payload.madhhab),
    title: payload.title.trim() || (payload.caseType === "zakat" ? "Zakat calculation" : "Farā’iḍ case"),
    currency: payload.currency || "INR",
    input_data: payload.input,
    result_data: payload.result,
    verification_status: payload.status || "unverified",
  }).select("*").single();
  if (error) throw error;
  await logCaseEvent(data.id, "created", { status: data.verification_status });
  return data as CaseRecord;
}

export async function updateCase(caseId: string, patch: Partial<Pick<CaseRecord, "title" | "input_data" | "result_data" | "verification_status" | "reviewer_note">>) {
  await currentUserId();
  const { data, error } = await client().from("cases").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", caseId).select("*").single();
  if (error) throw error;
  await logCaseEvent(caseId, "updated", { fields: Object.keys(patch), status: patch.verification_status });
  return data as CaseRecord;
}

export async function requestCaseReview(caseId: string) {
  return updateCase(caseId, { verification_status: "review_requested" });
}

export async function listCases(caseType?: CaseType): Promise<CaseRecord[]> {
  await currentUserId();
  let query = client().from("cases").select("*").order("updated_at", { ascending: false });
  if (caseType) query = query.eq("case_type", caseType);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as CaseRecord[];
}

export async function getCase(caseId: string): Promise<CaseRecord | null> {
  await currentUserId();
  const { data, error } = await client().from("cases").select("*").eq("id", caseId).maybeSingle();
  if (error) throw error;
  return data as CaseRecord | null;
}

export async function deleteCase(caseId: string) {
  await currentUserId();
  const { error } = await client().from("cases").delete().eq("id", caseId);
  if (error) throw error;
}

async function logCaseEvent(caseId: string, eventType: string, eventData: Record<string, unknown>) {
  const userId = await currentUserId();
  const { error } = await client().from("case_events").insert({ case_id: caseId, actor_id: userId, event_type: eventType, event_data: eventData });
  if (error && !error.message.includes("case_events")) throw error;
}

export async function listQazis(): Promise<QaziRecord[]> {
  const { data, error } = await client().from("qazis").select("*").eq("verification_status", "verified").order("name");
  if (error) throw error;
  return (data || []) as QaziRecord[];
}

export async function createAppointment(payload: {
  qaziId: string;
  caseId?: string | null;
  consultationType: string;
  consultationMode: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
  shareConsent: boolean;
}) {
  const userId = await currentUserId();
  const { data, error } = await client().from("appointments").insert({
    user_id: userId,
    qazi_id: payload.qaziId,
    case_id: payload.caseId || null,
    consultation_type: payload.consultationType,
    consultation_mode: payload.consultationMode,
    preferred_date: payload.preferredDate,
    preferred_time: payload.preferredTime || null,
    notes: payload.notes || null,
    share_consent: payload.shareConsent,
  }).select("*").single();
  if (error) throw error;
  return data as AppointmentRecord;
}

export async function listAppointments(): Promise<AppointmentRecord[]> {
  await currentUserId();
  const { data, error } = await client().from("appointments").select("*, qazi:qazis(id,name,institution,city,state)").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as AppointmentRecord[];
}

export async function cancelAppointment(id: string) {
  await currentUserId();
  const { error } = await client().from("appointments").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const { data, error } = await client().from("knowledge_articles").select("*").eq("published", true).order("title");
  if (error) throw error;
  return (data || []) as KnowledgeArticle[];
}

export async function submitMasalaQuestion(payload: { madhhab: string; subject: string; language: string; question: string; context?: Record<string, unknown>; matchedArticle?: KnowledgeArticle | null }) {
  const userId = await currentUserId();
  const { data, error } = await client().from("masala_questions").insert({
    user_id: userId,
    madhhab: normalizeMadhhab(payload.madhhab),
    subject: payload.subject,
    language: payload.language,
    question: payload.question,
    context_data: payload.context || {},
    matched_article_id: payload.matchedArticle?.id || null,
    answer_data: null,
    status: payload.matchedArticle ? "answered" : "submitted",
  }).select("*").single();
  if (error) throw error;
  return data as MasalaQuestionRecord;
}

export async function listMasalaQuestions(): Promise<MasalaQuestionRecord[]> {
  await currentUserId();
  const { data, error } = await client().from("masala_questions").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as MasalaQuestionRecord[];
}

export async function exportAccountData() {
  const userId = await currentUserId();
  const [profile, cases, appointments, questions] = await Promise.all([getProfile(userId), listCases(), listAppointments(), listMasalaQuestions()]);
  return { exported_at: new Date().toISOString(), profile, cases, appointments, masala_questions: questions };
}
