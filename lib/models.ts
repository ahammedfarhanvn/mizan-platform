export type Madhhab = "hanafi" | "maliki" | "shafii" | "hanbali";
export type CaseType = "zakat" | "faraid";
export type VerificationStatus = "unverified" | "review_requested" | "approved" | "changes_requested" | "disputed";

export type ProfileRecord = {
  id: string;
  full_name: string | null;
  madhhab: Madhhab | null;
  preferred_language: string;
  region: string | null;
  account_role: string;
  onboarding_complete: boolean;
  notification_settings: Record<string, boolean>;
  created_at: string;
  updated_at: string;
};

export type CaseRecord = {
  id: string;
  user_id: string;
  case_type: CaseType;
  madhhab: Madhhab;
  title: string;
  currency: string;
  input_data: Record<string, unknown>;
  result_data: Record<string, unknown>;
  verification_status: VerificationStatus;
  reviewer_note: string | null;
  created_at: string;
  updated_at: string;
};

export type QaziRecord = {
  id: string;
  name: string;
  institution: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  languages: string[];
  madhhab_specialisations: string[];
  expertise: string[];
  consultation_modes: string[];
  public_contact: string | null;
  verification_status: "pending" | "verified" | "suspended";
  created_at: string;
};

export type AppointmentRecord = {
  id: string;
  user_id: string;
  qazi_id: string | null;
  case_id: string | null;
  consultation_type: string;
  consultation_mode: string;
  preferred_date: string | null;
  preferred_time: string | null;
  notes: string | null;
  share_consent: boolean;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  qazi?: Pick<QaziRecord, "id" | "name" | "institution" | "city" | "state"> | null;
};

export type KnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  keywords: string[];
  madhhab_scope: string[];
  summary: string;
  follow_up_questions: string[];
  source_label: string;
  source_reference: string;
  confidence_label: string;
  requires_review: boolean;
  published: boolean;
};

export type MasalaQuestionRecord = {
  id: string;
  user_id: string;
  madhhab: Madhhab;
  subject: string;
  language: string;
  question: string;
  context_data: Record<string, unknown>;
  matched_article_id: string | null;
  answer_data: Record<string, unknown> | null;
  status: "submitted" | "answered" | "referred" | "closed";
  created_at: string;
};

export function displayMadhhab(value: string | null | undefined) {
  const labels: Record<string, string> = { hanafi: "Hanafi", maliki: "Maliki", shafii: "Shafi'i", hanbali: "Hanbali" };
  return labels[normalizeMadhhab(value || "shafii")] || "Shafi'i";
}

export function normalizeMadhhab(value: string): Madhhab {
  const normalized = value.toLowerCase().replaceAll("'", "").replaceAll("’", "").replaceAll("ʿ", "").replace(/\s+/g, "");
  if (normalized.startsWith("hana")) return "hanafi";
  if (normalized.startsWith("mali")) return "maliki";
  if (normalized.startsWith("hanb")) return "hanbali";
  return "shafii";
}
