"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleDollarSign, FileDown, Save, Scale, Send, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { ScholarNotice, SourceNote } from "../../components/ui";
import { useAuth } from "../../components/auth-provider";
import { calculateZakat, type ZakatInput } from "../../lib/calculations";
import { createCase, getCase, updateCase } from "../../lib/supabase";
import type { CaseRecord, VerificationStatus } from "../../lib/models";
import { downloadCaseReport } from "../../lib/reporting";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const initialData: ZakatInput = { cash: 0, bank: 0, gold: 0, silver: 0, business: 0, receivables: 0, investments: 0, digitalAssets: 0, other: 0, liabilities: 0, nisab: 0, hawl: false };

function ZakatWorkspace() {
  const params = useSearchParams();
  const { profile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("Annual Zakat calculation");
  const [data, setData] = useState<ZakatInput>(initialData);
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const result = useMemo(() => calculateZakat(data), [data]);

  useEffect(() => {
    const id = params.get("case");
    if (!id) return;
    void getCase(id).then(row => {
      if (!row || row.case_type !== "zakat") return;
      setRecord(row); setTitle(row.title); setData({ ...initialData, ...(row.input_data as Partial<ZakatInput>) });
    }).catch(reason => setError(reason instanceof Error ? reason.message : "Could not open this calculation."));
  }, [params]);

  function setNumber(key: keyof ZakatInput, value: string) { setData(current => ({ ...current, [key]: Math.max(0, Number(value) || 0) })); }
  function field(label: string, key: keyof ZakatInput, helper?: string) { return <label><span>{label}</span><div className="money-field"><b>₹</b><input type="number" inputMode="decimal" min="0" value={Number(data[key])} onChange={event => setNumber(key, event.target.value)}/></div>{helper && <small className="field-help">{helper}</small>}</label>; }

  async function persist(status: VerificationStatus = record?.verification_status || "unverified") {
    setSaving(true); setMessage(""); setError("");
    try {
      const stored = record
        ? await updateCase(record.id, { title, input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown>, verification_status: status })
        : await createCase({ caseType: "zakat", madhhab: profile.madhhab, title, input: data as unknown as Record<string, unknown>, result: result as unknown as Record<string, unknown>, status });
      setRecord(stored);
      window.history.replaceState({}, "", `/zakat/?case=${stored.id}`);
      setMessage(status === "review_requested" ? "Calculation saved and marked for Qazi review." : "Calculation saved securely.");
      return stored;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save the calculation."); return null; }
    finally { setSaving(false); }
  }

  function download() {
    const current: CaseRecord = record || { id: "unsaved", user_id: user?.id || "", case_type: "zakat", madhhab: "shafii", title, currency: "INR", input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown>, verification_status: "unverified", reviewer_note: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    downloadCaseReport({ ...current, title, input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown> });
  }

  return <AppShell title="Zakat Intelligence" eyebrow="Madhhab-aware calculation" actions={<button className="ghost-button compact" onClick={() => void persist()} disabled={saving}><Save/>{saving ? "Saving…" : "Save draft"}</button>}>
    <div className="tool-page-head"><div><span className="eyebrow"><ShieldCheck/> {profile.madhhab} method selected</span><h2>Calculate with a transparent trail.</h2><p>Record categories separately, confirm conditions, then save a report that preserves every input and review warning.</p></div><div className="step-pills">{["Assets", "Conditions", "Result"].map((label, index) => <button key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} onClick={() => setStep(index + 1)}>{step > index + 1 ? <Check/> : index + 1} {label}</button>)}</div></div>
    {error && <div className="form-error workspace-error">{error}</div>}
    <div className="calculator-layout"><section className="workspace-panel calculator-form">
      <label className="case-title-field"><span>Private calculation title</span><input value={title} onChange={event => setTitle(event.target.value)} maxLength={90}/></label>
      {step === 1 && <><div className="panel-heading"><div><span>Step 1</span><h3>Map qualifying wealth</h3></div><Scale/></div><div className="calculation-fields">{field("Cash held", "cash")}{field("Bank balances", "bank")}{field("Gold value", "gold")}{field("Silver value", "silver")}{field("Business inventory", "business", "Goods held for sale, not fixed equipment")}{field("Recoverable receivables", "receivables")}{field("Shares and investments", "investments")}{field("Digital assets", "digitalAssets")}{field("Other potentially zakatable wealth", "other")}</div><SourceNote>Categories are kept separate so their ownership, purpose and treatment can be reviewed before a final decision.</SourceNote></>}
      {step === 2 && <><div className="panel-heading"><div><span>Step 2</span><h3>Conditions and deductions</h3></div><ShieldCheck/></div><div className="calculation-fields">{field("Reviewable short-term liabilities", "liabilities", "Only enter obligations you intend to present for review")}{field("Current niṣāb reference", "nisab", "Use a current local gold or silver benchmark selected with guidance")}</div><label className="check-card"><input type="checkbox" checked={data.hawl} onChange={event => setData({ ...data, hawl: event.target.checked })}/><span><strong>A lunar year (ḥawl) is confirmed</strong><small>Some categories can have separate timing rules; this confirms the general cash/trade pathway.</small></span></label><SourceNote>This calculator applies a transparent general 2.5% cash and trade-wealth pathway. Category eligibility and madhhab differences remain visible for review.</SourceNote></>}
      {step === 3 && <><div className="panel-heading"><div><span>Step 3</span><h3>Review the calculation trail</h3></div><CircleDollarSign/></div><div className="result-breakdown">{Object.entries(result.categoryValues).filter(([, value]) => value > 0).map(([key, value]) => <div key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{money.format(value)}</strong></div>)}</div>{result.issues.length ? <div className="issue-list"><strong><AlertTriangle/>Review notes</strong>{result.issues.map(issue => <p key={issue}>{issue}</p>)}</div> : <div className="ready-note"><Check/>The entered values satisfy the general niṣāb and ḥawl pathway.</div>}<ScholarNotice/></>}
      <div className="wizard-actions">{step > 1 && <button className="ghost-button" onClick={() => setStep(step - 1)}><ArrowLeft/>Back</button>}<span/>{step < 3 ? <button className="primary-button" onClick={() => setStep(step + 1)}>Continue<ArrowRight/></button> : <button className="primary-button" onClick={() => void persist()} disabled={saving}><Save/>{record ? "Update calculation" : "Save calculation"}</button>}</div>
    </section>
    <aside className="result-panel glass-result"><span className="eyebrow">Live preliminary result</span><div className="result-orb"><CircleDollarSign/><div><small>Estimated Zakat</small><strong>{money.format(result.amountDue)}</strong></div></div><dl><div><dt>Total mapped assets</dt><dd>{money.format(result.grossAssets)}</dd></div><div><dt>Entered liabilities</dt><dd>− {money.format(result.allowedLiabilities)}</dd></div><div><dt>Net zakatable wealth</dt><dd>{money.format(result.netZakatable)}</dd></div><div><dt>Niṣāb</dt><dd>{data.nisab ? money.format(data.nisab) : "Not entered"}</dd></div><div><dt>Rate used</dt><dd>2.5%</dd></div><div><dt>Madhhab label</dt><dd>{profile.madhhab}</dd></div></dl><div className={`eligibility-status ${result.eligible ? "eligible" : "paused"}`}>{result.eligible ? <Check/> : <AlertTriangle/>}<span><strong>{result.eligible ? "General conditions met" : "Calculation paused"}</strong><small>{result.eligible ? "Save or request qualified review." : "Complete niṣāb and ḥawl conditions."}</small></span></div><button className="primary-button full" onClick={() => void persist("review_requested")} disabled={saving || (!record && result.grossAssets <= 0)}><Send/>Save & request review</button><button className="text-button" onClick={download}><FileDown/>Download transparent report</button></aside></div>
    {message && <div className="toast"><Check/>{message}</div>}
  </AppShell>;
}

export default function ZakatPage() {
  return <Suspense fallback={<AppShell title="Zakat Intelligence" eyebrow="Madhhab-aware calculation"><div className="workspace-panel panel-loading">Preparing your private calculation…</div></AppShell>}><ZakatWorkspace/></Suspense>;
}
