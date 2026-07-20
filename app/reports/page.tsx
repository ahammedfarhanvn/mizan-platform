"use client";

import Link from "next/link";
import { Download, FileCheck2, FileText, Filter, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { deleteCase, listCases } from "../../lib/supabase";
import type { CaseRecord } from "../../lib/models";
import { downloadCaseReport } from "../../lib/reporting";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
function reportAmount(record: CaseRecord) {
  const result = record.result_data as Record<string, unknown>;
  return Number(result.amountDue ?? result.netEstate ?? result.netZakatable ?? 0);
}

export default function Reports() {
  const [records, setRecords] = useState<CaseRecord[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "zakat" | "faraid">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setRecords(await listCases()); setError(""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load reports."); } finally { setLoading(false); } }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const visible = useMemo(() => records.filter(record => (filter === "all" || record.case_type === filter) && `${record.title} ${record.case_type} ${record.verification_status}`.toLowerCase().includes(query.toLowerCase())), [records, filter, query]);

  async function remove(record: CaseRecord) {
    if (!window.confirm(`Delete “${record.title}”? This cannot be undone.`)) return;
    try { await deleteCase(record.id); setRecords(current => current.filter(item => item.id !== record.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete the report."); }
  }

  return <AppShell title="Reports & records" eyebrow="Private calculation history"><div className="tool-page-head"><div><span className="eyebrow"><FileCheck2/> Transparent records</span><h2>Follow every case from draft to approval.</h2><p>Calculation inputs, result summaries and verification status remain attached to the same private record.</p></div><div className="report-tools"><div><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your reports"/></div><div className="filter-select"><Filter/><select aria-label="Filter report type" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">All reports</option><option value="zakat">Zakat</option><option value="faraid">Farā’iḍ</option></select></div></div></div>
    {error && <div className="form-error workspace-error">{error}<button onClick={load}>Try again</button></div>}
    <section className="workspace-panel reports-table"><div className="report-table-head"><span>Report</span><span>Type</span><span>Date</span><span>Value</span><span>Status</span><span>Actions</span></div>{loading ? <div className="panel-loading">Loading private reports…</div> : visible.length ? visible.map(record => <article key={record.id}><div><span><FileText/></span><strong>{record.title}</strong></div><span>{record.case_type === "faraid" ? "Farā’iḍ" : "Zakat"}</span><span>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(record.updated_at))}</span><b>{money.format(reportAmount(record))}</b><em className={record.verification_status === "approved" ? "approved" : record.verification_status === "unverified" ? "draft" : "review"}>{record.verification_status.replaceAll("_", " ")}</em><div className="report-row-actions"><button title="Download report" aria-label={`Download ${record.title}`} onClick={() => downloadCaseReport(record)}><Download/></button><button className="danger-icon" title="Delete report" aria-label={`Delete ${record.title}`} onClick={() => remove(record)}><Trash2/></button></div></article>) : <div className="real-empty report-empty"><FileCheck2/><strong>No matching records</strong><p>Create a real calculation and save it; the report will appear here.</p><div><Link className="primary-button compact" href="/zakat/">New Zakat record</Link><Link className="ghost-button compact" href="/faraid/">New Farā’iḍ case</Link></div></div>}</section>
    <div className="reports-empty"><ShieldCheck/><div><strong>Approval is never automatic</strong><p>A report displays “approved” only when its review status has been changed by an authorised verification workflow.</p></div></div>
  </AppShell>;
}
