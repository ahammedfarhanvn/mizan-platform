"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileCheck2,
  GitBranch,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, StatCard } from "../../components/app-shell";
import { useAuth } from "../../components/auth-provider";
import type { AppointmentRecord, CaseRecord, KnowledgeArticle, MasalaQuestionRecord } from "../../lib/models";
import { getRoleDefinition } from "../../lib/roles";
import { listAppointments, listCases, listKnowledgeArticles, listMasalaQuestions } from "../../lib/supabase";

type Activity = { id: string; title: string; detail: string; date: string; href: string; kind: "case" | "appointment" | "question" };

function isBusinessCase(record: CaseRecord) {
  const input = record.input_data || {};
  return record.case_type === "zakat" && ["business", "receivables", "inventory"].some(key => Number(input[key] || 0) > 0);
}

function RoleWorkspaceContent() {
  const params = useSearchParams();
  const { profile } = useAuth();
  const role = useMemo(() => getRoleDefinition(profile.role), [profile.role]);
  const isMalayalam = profile.language.trim().toLowerCase() === "malayalam";
  const query = (params.get("search") || "").trim().toLowerCase();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [questions, setQuestions] = useState<MasalaQuestionRecord[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [caseRows, appointmentRows, questionRows, articleRows] = await Promise.all([listCases(), listAppointments(), listMasalaQuestions(), listKnowledgeArticles()]);
      setCases(caseRows); setAppointments(appointmentRows); setQuestions(questionRows); setArticles(articleRows); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load this workspace."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const focusCases = useMemo(() => {
    if (profile.role === "Family representative") return cases.filter(record => record.case_type === "faraid");
    if (profile.role === "Business owner") return cases.filter(isBusinessCase);
    if (profile.role === "Mahallu / institution") return cases;
    if (profile.role === "Scholar / Qazi") return cases.filter(record => record.verification_status === "review_requested");
    return cases;
  }, [cases, profile.role]);

  const activities = useMemo<Activity[]>(() => {
    const rows: Activity[] = [
      ...cases.map(record => ({ id: record.id, title: record.title, detail: `${record.case_type === "zakat" ? "Zakat" : "Farā’iḍ"} · ${record.verification_status.replaceAll("_", " ")}`, date: record.updated_at, href: record.case_type === "zakat" ? `/zakat/?case=${record.id}` : `/faraid/?case=${record.id}`, kind: "case" as const })),
      ...appointments.map(record => ({ id: record.id, title: record.qazi?.name ? `Consultation with ${record.qazi.name}` : record.consultation_type, detail: `Consultation · ${record.status}`, date: record.updated_at, href: "/qazi/", kind: "appointment" as const })),
      ...questions.map(record => ({ id: record.id, title: record.question, detail: `${record.subject} · ${record.status}`, date: record.created_at, href: "/masail/", kind: "question" as const })),
    ];
    return rows.filter(row => !query || `${row.title} ${row.detail}`.toLowerCase().includes(query)).sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);
  }, [cases, appointments, questions, query]);

  const capabilityLabels = isMalayalam ? role.capabilitiesMalayalam : role.capabilities;
  const reviewCount = cases.filter(record => record.verification_status === "review_requested").length;
  const openAppointments = appointments.filter(record => !["completed", "cancelled"].includes(record.status)).length;

  const focusTitle = profile.role === "Student"
    ? (isMalayalam ? "പ്രസിദ്ധീകരിച്ച പഠനസാമഗ്രികൾ" : "Published learning collection")
    : profile.role === "Business owner"
      ? (isMalayalam ? "ബിസിനസ് സമ്പത്ത് ഉൾപ്പെട്ട കണക്കുകൾ" : "Business-wealth calculations")
      : profile.role === "Family representative"
        ? (isMalayalam ? "കുടുംബ അനന്തരാവകാശ കേസുകൾ" : "Family inheritance cases")
        : profile.role === "Scholar / Qazi"
          ? (isMalayalam ? "നിങ്ങൾ പരിശോധനയ്ക്ക് അയച്ച കേസുകൾ" : "Cases you sent for review")
          : (isMalayalam ? "ഈ അക്കൗണ്ടിന്റെ കേസ് രജിസ്റ്റർ" : "This account’s case register");

  return <AppShell title={isMalayalam ? role.hubMalayalam : role.hubLabel} eyebrow={isMalayalam ? role.malayalam : role.label} actions={<Link className="primary-button compact" href={role.primaryAction.href}>{isMalayalam ? role.primaryAction.malayalam : role.primaryAction.label}<ArrowRight/></Link>}>
    <section className="role-workspace-intro heritage-panel">
      <div><span className="ornament-badge"><Sparkles/></span><span className="eyebrow"><ShieldCheck/>{isMalayalam ? "സജീവ റോൾ" : "Active role"}</span><h2>{isMalayalam ? role.greetingMalayalam : role.greeting}</h2><p>{isMalayalam ? role.descriptionMalayalam : role.description}</p></div>
      <div className="capability-list"><small>{isMalayalam ? "ഈ പ്രവർത്തനകേന്ദ്രത്തിൽ" : "In this workspace"}</small>{capabilityLabels.map(item => <span key={item}><Check/>{item}</span>)}</div>
    </section>

    {query && <div className="search-result-banner"><Search/><span>{isMalayalam ? `“${params.get("search")}” എന്നതിനുള്ള സ്വകാര്യ പ്രവർത്തനഫലങ്ങൾ` : `Private workspace results for “${params.get("search")}”`}</span><Link href="/role/">{isMalayalam ? "തിരയൽ മായ്ക്കുക" : "Clear search"}</Link></div>}
    {error && <div className="form-error workspace-error">{error}<button onClick={load}>{isMalayalam ? "വീണ്ടും ശ്രമിക്കുക" : "Try again"}</button></div>}

    <div className="stat-grid role-stat-grid">
      <StatCard icon={WalletCards} label={isMalayalam ? "സ്വകാര്യ കേസുകൾ" : "Private cases"} value={String(cases.length)} detail={isMalayalam ? "ഈ അക്കൗണ്ടിന്റെ രേഖകൾ" : "Records owned by this account"}/>
      <StatCard icon={CalendarDays} label={isMalayalam ? "തുറന്ന കൺസൾട്ടേഷനുകൾ" : "Open consultations"} value={String(openAppointments)} detail={isMalayalam ? "അഭ്യർത്ഥിച്ചതോ സ്ഥിരീകരിച്ചതോ" : "Requested or confirmed"} tone="amber"/>
      <StatCard icon={Bot} label={isMalayalam ? "ചോദ്യചരിത്രം" : "Question history"} value={String(questions.length)} detail={isMalayalam ? "ഈ അക്കൗണ്ടിൽ സൂക്ഷിച്ചത്" : "Saved under this account"} tone="violet"/>
      <StatCard icon={FileCheck2} label={isMalayalam ? "പരിശോധന അഭ്യർത്ഥനകൾ" : "Review requests"} value={String(reviewCount)} detail={isMalayalam ? "അധികാരം അല്ല, അഭ്യർത്ഥനയുടെ നില" : "Request status, not reviewer authority"} tone="blue"/>
    </div>

    <div className="role-workspace-grid">
      <section className="heritage-card role-focus-panel">
        <div className="card-title-row"><div><small>{isMalayalam ? "റോൾ മുൻഗണന" : "Role priority"}</small><h3>{focusTitle}</h3></div><span>{profile.role === "Student" ? <BookOpen/> : profile.role === "Business owner" ? <BriefcaseBusiness/> : profile.role === "Family representative" ? <Users/> : <GitBranch/>}</span></div>
        {loading ? <div className="panel-loading">{isMalayalam ? "യഥാർത്ഥ രേഖകൾ ലോഡ് ചെയ്യുന്നു…" : "Loading real records…"}</div> : profile.role === "Student" ? <div className="knowledge-record-list">{articles.length ? articles.slice(0, 5).map(article => <Link href="/masail/" key={article.id}><span><BookOpen/></span><div><strong>{article.title}</strong><small>{article.category} · {article.confidence_label}</small></div><ArrowRight/></Link>) : <div className="real-empty compact-empty"><BookOpen/><strong>{isMalayalam ? "പഠനസാമഗ്രികൾ ലഭ്യമല്ല" : "No published articles available"}</strong><p>{isMalayalam ? "പ്രസിദ്ധീകരിച്ച വിജ്ഞാനശേഖരം ഇപ്പോൾ ശൂന്യമാണ്." : "The published knowledge collection is currently empty."}</p></div>}</div> : focusCases.length ? <div className="role-record-list">{focusCases.slice(0, 6).map(record => <Link key={record.id} href={record.case_type === "zakat" ? `/zakat/?case=${record.id}` : `/faraid/?case=${record.id}`}><span>{record.case_type === "zakat" ? <WalletCards/> : <GitBranch/>}</span><div><strong>{record.title}</strong><small>{record.case_type === "zakat" ? "Zakat" : "Farā’iḍ"} · {record.verification_status.replaceAll("_", " ")}</small></div><ArrowRight/></Link>)}</div> : <div className="real-empty compact-empty"><FileCheck2/><strong>{isMalayalam ? "യഥാർത്ഥ രേഖകളൊന്നുമില്ല" : "No real records yet"}</strong><p>{isMalayalam ? "ഒരു പ്രവർത്തനം ആരംഭിച്ചാൽ അതിന്റെ ഡാറ്റ ഇവിടെ പ്രത്യക്ഷപ്പെടും." : "Start a workflow and its saved database record will appear here."}</p><Link className="primary-button compact" href={role.primaryAction.href}>{isMalayalam ? role.primaryAction.malayalam : role.primaryAction.label}</Link></div>}
      </section>

      <section className="heritage-card account-activity-panel">
        <div className="card-title-row"><div><small>{isMalayalam ? "അക്കൗണ്ട് പ്രവർത്തനം" : "Account activity"}</small><h3>{isMalayalam ? "പുതിയ കേസുകൾ, ചോദ്യങ്ങൾ, കൺസൾട്ടേഷനുകൾ" : "Cases, questions and consultations"}</h3></div><span><CalendarDays/></span></div>
        {loading ? <div className="panel-loading">{isMalayalam ? "പ്രവർത്തനം ലോഡ് ചെയ്യുന്നു…" : "Loading activity…"}</div> : activities.length ? <div className="role-activity-list">{activities.map(item => <Link key={`${item.kind}-${item.id}`} href={item.href}><span className={item.kind}>{item.kind === "case" ? <FileCheck2/> : item.kind === "appointment" ? <CalendarDays/> : <Bot/>}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><time>{new Intl.DateTimeFormat(isMalayalam ? "ml-IN" : "en-IN", { day: "numeric", month: "short" }).format(new Date(item.date))}</time></Link>)}</div> : <div className="real-empty compact-empty"><Search/><strong>{query ? (isMalayalam ? "പൊരുത്തപ്പെടുന്ന ഫലങ്ങളില്ല" : "No matching results") : (isMalayalam ? "പ്രവർത്തനമൊന്നുമില്ല" : "No activity yet")}</strong><p>{query ? (isMalayalam ? "മറ്റൊരു തിരയൽ പരീക്ഷിക്കുക." : "Try a different workspace search.") : (isMalayalam ? "നിങ്ങളുടെ യഥാർത്ഥ ഡാറ്റ ഇവിടെ ക്രമത്തിൽ പ്രത്യക്ഷപ്പെടും." : "Your real data will appear here in chronological order.")}</p></div>}
      </section>
    </div>

    <section className="permission-boundary">
      <span><LockKeyhole/></span><div><strong>{isMalayalam ? "റോൾ, അനുമതി രണ്ടും വ്യത്യസ്തമാണ്" : "Role and authority are different"}</strong><p>{profile.role === "Scholar / Qazi" ? (isMalayalam ? "‘പണ്ഡിതൻ / ഖാസി’ എന്ന പ്രൊഫൈൽ തിരഞ്ഞെടുപ്പ് സ്വകാര്യ തയ്യാറെടുപ്പ് ഉപകരണങ്ങൾ മാത്രം ക്രമീകരിക്കുന്നു. മറ്റൊരാളുടെ കേസ് കാണാനോ അംഗീകരിക്കാനോ ഇത് അധികാരം നൽകില്ല." : "Selecting Scholar / Qazi only organises personal preparation tools. It does not grant access to another person’s case or permission to approve it.") : (isMalayalam ? "ഈ അക്കൗണ്ടിൽ സൃഷ്ടിച്ച രേഖകൾ മാത്രമാണ് കാണുന്നത്. മറ്റൊരു ഉപയോക്താവിന്റെ സ്വകാര്യ ഡാറ്റ ഈ റോൾ വെളിപ്പെടുത്തുകയില്ല." : "This workspace only reads records owned by the signed-in account. A profile role never exposes another user’s private data.")}</p></div><ShieldCheck/>
    </section>
  </AppShell>;
}

export default function RoleWorkspacePage() {
  return <Suspense fallback={<div className="auth-loading"><ShieldCheck/><span>Preparing role workspace…</span></div>}><RoleWorkspaceContent/></Suspense>;
}
