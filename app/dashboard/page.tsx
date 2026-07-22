"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  GitBranch,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { useAuth } from "../../components/auth-provider";
import { getRoleDefinition } from "../../lib/roles";
import { listAppointments, listCases, listMasalaQuestions } from "../../lib/supabase";
import type { AppointmentRecord, CaseRecord, MasalaQuestionRecord } from "../../lib/models";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function numeric(record: CaseRecord | undefined, key: string) {
  const value = record?.result_data?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function dateLabel(value: string, malayalam: boolean) {
  return new Intl.DateTimeFormat(malayalam ? "ml-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function statusLabel(value: string, malayalam: boolean) {
  if (!malayalam) return value.replaceAll("_", " ");
  const labels: Record<string, string> = {
    unverified: "ഡ്രാഫ്റ്റ്",
    review_requested: "പരിശോധന അഭ്യർത്ഥിച്ചു",
    approved: "അംഗീകരിച്ചു",
    changes_requested: "മാറ്റങ്ങൾ ആവശ്യമാണ്",
    disputed: "വിവാദത്തിലാണ്",
    requested: "അഭ്യർത്ഥിച്ചു",
    confirmed: "സ്ഥിരീകരിച്ചു",
    completed: "പൂർത്തിയായി",
    cancelled: "റദ്ദാക്കി",
  };
  return labels[value] || value.replaceAll("_", " ");
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [questions, setQuestions] = useState<MasalaQuestionRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const isMalayalam = profile.language.trim().toLowerCase() === "malayalam";
  const role = useMemo(() => getRoleDefinition(profile.role), [profile.role]);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const [caseRows, appointmentRows, questionRows] = await Promise.all([listCases(), listAppointments(), listMasalaQuestions()]);
      setCases(caseRows);
      setAppointments(appointmentRows);
      setQuestions(questionRows);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the workspace.");
    } finally { setLoadingData(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const zakatCases = cases.filter(record => record.case_type === "zakat");
  const faraidCases = cases.filter(record => record.case_type === "faraid");
  const latestZakat = zakatCases[0];
  const amountDue = numeric(latestZakat, "amountDue");
  const netWealth = numeric(latestZakat, "netZakatable");
  const eligible = Boolean(latestZakat?.result_data?.eligible);
  const reviewCount = cases.filter(record => record.verification_status === "review_requested").length;
  const approvedCount = cases.filter(record => record.verification_status === "approved").length;
  const openAppointments = appointments.filter(record => !["completed", "cancelled"].includes(record.status));
  const recentCases = cases.slice(0, 4);

  const quickActions = useMemo(() => {
    const common = {
      zakat: { href: "/zakat/", label: isMalayalam ? "സകാത്ത് കണക്കാക്കുക" : "Calculate Zakat", detail: isMalayalam ? "പുതിയ സ്വകാര്യ കണക്ക്" : "Start a private calculation", icon: Calculator, tone: "forest" },
      faraid: { href: "/faraid/", label: isMalayalam ? "അനന്തരാവകാശ കേസ്" : "Inheritance case", detail: isMalayalam ? "സ്വത്തും അവകാശികളും രേഖപ്പെടുത്തുക" : "Map estate and heirs", icon: GitBranch, tone: "copper" },
      question: { href: "/masail/", label: isMalayalam ? "ഒരു ചോദ്യം ചോദിക്കുക" : "Ask a question", detail: isMalayalam ? "പരിശോധിച്ച വിജ്ഞാനം തിരയുക" : "Search verified knowledge", icon: Bot, tone: "forest" },
      qazi: { href: "/qazi/", label: isMalayalam ? "ഖാസിയെ സമീപിക്കുക" : "Consult a Qazi", detail: isMalayalam ? "പരിശോധിച്ച ഡയറക്ടറി" : "Verified public directory", icon: Users, tone: "sand" },
      reports: { href: "/reports/", label: isMalayalam ? "റിപ്പോർട്ടുകൾ തുറക്കുക" : "Open reports", detail: isMalayalam ? "സ്വകാര്യ കേസ് രജിസ്റ്റർ" : "Private case register", icon: FileCheck2, tone: "forest" },
      knowledge: { href: "/knowledge/", label: isMalayalam ? "വിജ്ഞാന കേന്ദ്രം" : "Knowledge centre", detail: isMalayalam ? "രീതിയും സ്രോതസ്സുകളും പഠിക്കുക" : "Study methods and sources", icon: BookOpen, tone: "sand" },
      business: { href: "/zakat/?focus=business", label: isMalayalam ? "ബിസിനസ് സകാത്ത്" : "Business Zakat", detail: isMalayalam ? "ചരക്കും ലഭിക്കാനുള്ള തുകയും രേഖപ്പെടുത്തുക" : "Inventory and receivables", icon: BriefcaseBusiness, tone: "copper" },
    };
    if (profile.role === "Student") return [common.knowledge, common.question, common.zakat];
    if (profile.role === "Business owner") return [common.business, common.reports, common.qazi];
    if (profile.role === "Family representative") return [common.faraid, common.zakat, common.qazi];
    if (profile.role === "Mahallu / institution") return [common.reports, common.qazi, common.zakat];
    if (profile.role === "Scholar / Qazi") return [common.question, common.knowledge, common.reports];
    return [common.zakat, common.faraid, common.qazi];
  }, [profile.role, isMalayalam]);

  const firstName = profile.fullName.trim().split(/\s+/)[0] || "there";
  const title = isMalayalam ? `അസ്സലാമു അലൈക്കും, ${firstName}` : `Assalāmu ʿalaykum, ${firstName}`;

  return <AppShell
    title={title}
    eyebrow={isMalayalam ? "പ്രവർത്തനകേന്ദ്ര അവലോകനം" : "Workspace overview"}
    actions={<Link className="primary-button compact" href={role.primaryAction.href}><Plus/>{isMalayalam ? role.primaryAction.malayalam : role.primaryAction.label}</Link>}
  >
    <section className="role-hero heritage-panel">
      <div className="role-hero-copy"><span className="ornament-badge"><Sparkles/></span><div><span className="role-kicker"><ShieldCheck/> {isMalayalam ? role.malayalam : role.label}</span><h2>{isMalayalam ? role.greetingMalayalam : role.greeting}</h2><p>{isMalayalam ? role.descriptionMalayalam : role.description}</p></div></div>
      <Link href="/role/" className="role-hero-link"><span>{isMalayalam ? role.hubMalayalam : role.hubLabel}</span><ArrowRight/></Link>
    </section>

    {error && <div className="form-error workspace-error">{error}<button onClick={load}>{isMalayalam ? "വീണ്ടും ശ്രമിക്കുക" : "Try again"}</button></div>}

    <section className="heritage-overview-grid">
      <article className="heritage-card zakat-summary-card">
        <div className="card-title-row"><div><small>{isMalayalam ? "സകാത്ത് സംഗ്രഹം" : "Zakat summary"}</small><h3>{latestZakat?.title || (isMalayalam ? "ഇതുവരെ കണക്ക് ഇല്ല" : "No calculation yet")}</h3></div><span><CircleDollarSign/></span></div>
        <div className="zakat-metrics"><div><small>{isMalayalam ? "യോഗ്യമായ സമ്പത്ത്" : "Eligible wealth"}</small><strong>{latestZakat ? money.format(netWealth) : "—"}</strong></div><i/><div><small>{isMalayalam ? "കണക്കാക്കിയ സകാത്ത്" : "Estimated Zakat"}</small><strong className="copper-text">{latestZakat ? money.format(amountDue) : "—"}</strong></div></div>
        <div className="record-progress"><div><span>{isMalayalam ? "കണക്ക് രേഖ" : "Calculation record"}</span><b>{latestZakat ? "100%" : "0%"}</b></div><progress max="100" value={latestZakat ? 100 : 0}/></div>
        <Link className="primary-button full" href={latestZakat ? `/zakat/?case=${latestZakat.id}` : "/zakat/"}>{latestZakat ? (isMalayalam ? "കണക്ക് തുറക്കുക" : "Open calculation") : (isMalayalam ? "കണക്ക് ആരംഭിക്കുക" : "Start calculation")}<ArrowRight/></Link>
      </article>

      <article className="heritage-card nisab-card">
        <div className="card-title-row"><div><small>{isMalayalam ? "നിസാബ് നില" : "Niṣāb status"}</small><h3>{isMalayalam ? "യോഗ്യതാ പരിശോധന" : "Eligibility check"}</h3></div><span><ShieldCheck/></span></div>
        <div className={eligible ? "nisab-seal active" : "nisab-seal"}>{eligible ? <Check/> : <Clock3/>}</div>
        <strong className="nisab-label">{latestZakat ? (eligible ? (isMalayalam ? "നിസാബിന് മുകളിൽ" : "Above niṣāb") : (isMalayalam ? "വീണ്ടും പരിശോധിക്കുക" : "Check conditions")) : (isMalayalam ? "കണക്ക് ആവശ്യമാണ്" : "Calculation needed")}</strong>
        <p>{latestZakat ? (eligible ? (isMalayalam ? "സൂക്ഷിച്ച കണക്കിൽ നിസാബ്, ഹൗൽ നിബന്ധനകൾ പാലിച്ചതായി രേഖപ്പെടുത്തിയിരിക്കുന്നു." : "The saved calculation records the niṣāb and ḥawl conditions as met.") : (isMalayalam ? "നിസാബ്, ഹൗൽ വിവരങ്ങൾ പൂർത്തിയാക്കുക." : "Complete the niṣāb and ḥawl information.")) : (isMalayalam ? "നില കാണാൻ നിങ്ങളുടെ യഥാർത്ഥ സമ്പത്തിന്റെ വിവരങ്ങൾ നൽകുക." : "Enter your real wealth information to see the status." )}</p>
        {latestZakat && <small className="updated-label">{isMalayalam ? "അവസാനം പുതുക്കിയത്" : "Last updated"}: {dateLabel(latestZakat.updated_at, isMalayalam)}</small>}
      </article>

      <article className="heritage-card active-cases-card">
        <div className="card-title-row"><div><small>{isMalayalam ? "സജീവ കേസുകൾ" : "Active cases"}</small><h3>{isMalayalam ? "നിങ്ങളുടെ സ്വകാര്യ രേഖകൾ" : "Your private records"}</h3></div><span><WalletCards/></span></div>
        {loadingData ? <div className="panel-loading">{isMalayalam ? "രേഖകൾ ലോഡ് ചെയ്യുന്നു…" : "Loading records…"}</div> : recentCases.length ? <div className="heritage-case-list">{recentCases.map(record => <Link key={record.id} href={record.case_type === "zakat" ? `/zakat/?case=${record.id}` : `/faraid/?case=${record.id}`}><span className={record.case_type}><i>{record.case_type === "zakat" ? <Calculator/> : <GitBranch/>}</i></span><div><strong>{record.title}</strong><small>{record.case_type === "zakat" ? "Zakat" : "Farā’iḍ"} · {dateLabel(record.updated_at, isMalayalam)}</small></div><b>{statusLabel(record.verification_status, isMalayalam)}</b><ArrowRight/></Link>)}</div> : <div className="real-empty compact-empty"><FileCheck2/><strong>{isMalayalam ? "കേസുകളൊന്നുമില്ല" : "No cases yet"}</strong><p>{isMalayalam ? "നിങ്ങളുടെ ആദ്യ യഥാർത്ഥ കണക്കോ കേസോ ആരംഭിക്കുക." : "Start your first real calculation or case."}</p></div>}
        <Link className="text-link" href="/reports/">{isMalayalam ? "എല്ലാ രേഖകളും കാണുക" : "View all records"}<ArrowRight/></Link>
      </article>
    </section>

    <section className="heritage-lower-grid">
      <article className="heritage-card review-card">
        <div className="card-title-row"><div><small>{isMalayalam ? "പരിശോധന നില" : "Review status"}</small><h3>{isMalayalam ? "പണ്ഡിത പരിശോധനാ പാത" : "Qualified review pathway"}</h3></div><span><FileCheck2/></span></div>
        <div className="review-summary"><span className={reviewCount ? "review-orb pending" : "review-orb"}>{reviewCount || approvedCount ? <ShieldCheck/> : <Clock3/>}</span><div><small>{reviewCount ? (isMalayalam ? "നിലവിൽ പരിശോധനയിലാണ്" : "Currently under review") : approvedCount ? (isMalayalam ? "അംഗീകരിച്ച രേഖകളുണ്ട്" : "Approved records available") : (isMalayalam ? "സജീവ പരിശോധനയില്ല" : "No active review")}</small><strong>{reviewCount ? `${reviewCount} ${isMalayalam ? "കേസ്" : reviewCount === 1 ? "case" : "cases"}` : approvedCount ? `${approvedCount} ${isMalayalam ? "അംഗീകരിച്ചു" : "approved"}` : "—"}</strong><p>{isMalayalam ? "റോൾ തിരഞ്ഞെടുക്കുന്നത് മാത്രം പരിശോധനാ അധികാരം നൽകില്ല." : "Reviewer authority is never granted by selecting a profile role."}</p></div></div>
        <div className="review-steps"><span className={cases.length ? "done" : ""}><i><Check/></i>{isMalayalam ? "സമർപ്പിച്ചു" : "Submitted"}</span><span className={reviewCount ? "current" : approvedCount ? "done" : ""}><i>2</i>{isMalayalam ? "പരിശോധനയിൽ" : "Under review"}</span><span className={approvedCount ? "done" : ""}><i>3</i>{isMalayalam ? "അംഗീകരിച്ചു" : "Approved"}</span></div>
      </article>

      <article className="heritage-card quick-action-card">
        <div className="card-title-row"><div><small>{isMalayalam ? "വേഗത്തിലുള്ള പ്രവർത്തനങ്ങൾ" : "Quick actions"}</small><h3>{isMalayalam ? "അടുത്തത് തിരഞ്ഞെടുക്കുക" : "Choose your next step"}</h3></div><span><Sparkles/></span></div>
        <div className="heritage-actions">{quickActions.map(({ href, label, detail, icon: Icon, tone }) => <Link key={href} href={href} className={tone}><Icon/><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight/></Link>)}</div>
      </article>
    </section>

    <section className="role-facts-strip">
      <div><CalendarDays/><span><strong>{openAppointments.length}</strong><small>{isMalayalam ? "തുറന്ന കൺസൾട്ടേഷനുകൾ" : "Open consultations"}</small></span></div>
      <div><Bot/><span><strong>{questions.length}</strong><small>{isMalayalam ? "സൂക്ഷിച്ച ചോദ്യങ്ങൾ" : "Saved questions"}</small></span></div>
      <div><GitBranch/><span><strong>{faraidCases.length}</strong><small>{isMalayalam ? "അനന്തരാവകാശ കേസുകൾ" : "Inheritance cases"}</small></span></div>
      <div><ShieldCheck/><span><strong>{profile.madhhab}</strong><small>{isMalayalam ? "സജീവ മാർഗരീതി" : "Active method"}</small></span></div>
    </section>
  </AppShell>;
}
