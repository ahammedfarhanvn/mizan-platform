"use client";

import Link from "next/link";
import { ArrowRight, Bot, Calculator, CalendarDays, FileCheck2, GitBranch, Plus, ShieldCheck, Users, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell, StatCard } from "../../components/app-shell";
import { useAuth } from "../../components/auth-provider";
import { listAppointments, listCases } from "../../lib/supabase";
import type { AppointmentRecord, CaseRecord } from "../../lib/models";

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [caseRows, appointmentRows] = await Promise.all([listCases(), listAppointments()]);
      setCases(caseRows); setAppointments(appointmentRows); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the workspace."); }
    finally { setLoadingData(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const recent = useMemo(() => [
    ...cases.map(record => ({ id: record.id, kind: "case" as const, title: record.title, type: record.case_type, date: record.updated_at, status: record.verification_status })),
    ...appointments.map(record => ({ id: record.id, kind: "appointment" as const, title: record.qazi?.name ? `Consultation with ${record.qazi.name}` : record.consultation_type, type: "appointment", date: record.created_at, status: record.status })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5), [cases, appointments]);

  const zakatCount = cases.filter(record => record.case_type === "zakat").length;
  const faraidCount = cases.filter(record => record.case_type === "faraid").length;
  const approvedCount = cases.filter(record => record.verification_status === "approved").length;
  const reviewCount = cases.filter(record => record.verification_status === "review_requested").length;

  return <AppShell title={`Assalāmu ʿalaykum, ${profile.fullName.split(" ")[0]}`} eyebrow="Workspace overview" actions={<Link className="primary-button compact" href="/zakat/"><Plus/>New calculation</Link>}>
    <div className="dashboard-welcome glass-panel"><div><span><ShieldCheck/> {profile.madhhab} workspace active</span><h2>Continue with clarity.</h2><p>Your live calculations, reports and scholar consultations remain organised in one private workspace.</p></div><div className="welcome-balance"><small>Secure database</small><strong>{loadingData ? "Synchronising…" : "Connected"}</strong><span>{reviewCount ? `${reviewCount} case${reviewCount > 1 ? "s" : ""} awaiting review` : "No reviews currently pending"}</span></div></div>
    {error && <div className="form-error workspace-error">{error}<button onClick={load}>Try again</button></div>}
    <div className="stat-grid"><StatCard icon={WalletCards} label="Zakat records" value={String(zakatCount)} detail={zakatCount ? "Saved calculations" : "Start your first record"}/><StatCard icon={GitBranch} label="Farā’iḍ cases" value={String(faraidCount)} detail={faraidCount ? "Private estate records" : "No cases yet"} tone="blue"/><StatCard icon={CalendarDays} label="Consultations" value={String(appointments.length)} detail={appointments.some(item => item.status === "confirmed") ? "Confirmed appointment available" : "Requests and appointments"} tone="amber"/><StatCard icon={FileCheck2} label="Verified reports" value={String(approvedCount)} detail="Approved by authorised reviewers" tone="violet"/></div>
    <div className="dashboard-grid"><section className="workspace-panel"><div className="panel-heading"><div><span>Start a workflow</span><h3>What do you need today?</h3></div></div><div className="quick-actions"><Link href="/zakat/"><span className="teal"><Calculator/></span><div><strong>Calculate Zakat</strong><small>Cash, gold, business and modern assets</small></div><ArrowRight/></Link><Link href="/faraid/"><span className="blue"><GitBranch/></span><div><strong>Open a Farā’iḍ case</strong><small>Estate, obligations and family tree</small></div><ArrowRight/></Link><Link href="/masail/"><span className="violet"><Bot/></span><div><strong>Ask a Mas’ala</strong><small>Search approved guidance or submit a question</small></div><ArrowRight/></Link><Link href="/qazi/"><span className="amber"><Users/></span><div><strong>Find a verified Qazi</strong><small>Book and share a selected report by consent</small></div><ArrowRight/></Link></div></section>
      <section className="workspace-panel"><div className="panel-heading"><div><span>Recent activity</span><h3>Cases and consultations</h3></div><Link href="/reports/">View all</Link></div>{loadingData ? <div className="panel-loading">Loading private records…</div> : recent.length ? <div className="activity-list">{recent.map(item => <article key={`${item.kind}-${item.id}`}><span className={item.type === "zakat" ? "teal" : item.type === "faraid" ? "blue" : "amber"}>{item.type === "zakat" ? <Calculator/> : item.type === "faraid" ? <GitBranch/> : <CalendarDays/>}</span><div><strong>{item.title}</strong><small>{dateLabel(item.date)} · {item.type === "appointment" ? "Consultation" : profile.madhhab}</small></div><b className={item.status === "approved" || item.status === "confirmed" ? "booked" : item.status.includes("review") ? "review" : ""}>{item.status.replaceAll("_", " ")}</b></article>)}</div> : <div className="real-empty"><FileCheck2/><strong>Your workspace is ready</strong><p>Create a calculation or consultation; it will appear here immediately.</p></div>}</section></div>
    <div className="dashboard-grid lower"><section className="workspace-panel"><div className="panel-heading"><div><span>Live workflow</span><h3>Verification pathway</h3></div></div><div className="verification-path"><div className={cases.length ? "done" : "current"}><span>1</span><strong>Case created</strong></div><i/><div className={reviewCount ? "current" : approvedCount ? "done" : ""}><span>2</span><strong>Review requested</strong></div><i/><div className={approvedCount ? "done" : ""}><span>3</span><strong>Qazi verification</strong></div><i/><div className={approvedCount ? "current" : ""}><span>4</span><strong>Approved report</strong></div></div></section><section className="safety-panel"><ShieldCheck/><div><strong>Important guidance</strong><p>Automatic calculations are educational. Verify complex or disputed cases before acting or distributing funds.</p></div></section></div>
  </AppShell>;
}
