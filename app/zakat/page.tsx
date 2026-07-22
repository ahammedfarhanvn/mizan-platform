"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Check, CircleDollarSign, FileDown, HelpCircle, Save, Scale, Send, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { ScholarNotice, SourceNote } from "../../components/ui";
import { useAuth } from "../../components/auth-provider";
import { calculateZakat, type ZakatInput } from "../../lib/calculations";
import { createCase, getCase, updateCase } from "../../lib/supabase";
import type { CaseRecord, VerificationStatus } from "../../lib/models";
import { downloadCaseReport } from "../../lib/reporting";
import { zakatCategoryLabels, zakatCopy, zakatIssueMalayalam } from "../../lib/zakat-copy";

const initialData: ZakatInput = { cash: 0, bank: 0, gold: 0, silver: 0, business: 0, receivables: 0, investments: 0, digitalAssets: 0, other: 0, liabilities: 0, nisab: 0, hawl: false };

function ZakatWorkspace() {
  const params = useSearchParams();
  const { profile, user } = useAuth();
  const isMalayalam = profile.language.trim().toLowerCase() === "malayalam";
  const language = isMalayalam ? "ml" : "en";
  const c = zakatCopy[language];
  const categoryLabels = zakatCategoryLabels[language];
  const money = useMemo(() => new Intl.NumberFormat(isMalayalam ? "ml-IN" : "en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }), [isMalayalam]);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState<string | null>(null);
  const [data, setData] = useState<ZakatInput>(initialData);
  const [record, setRecord] = useState<CaseRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const result = useMemo(() => calculateZakat(data), [data]);
  const calculationTitle = title?.trim() || c.defaultTitle;

  useEffect(() => {
    const id = params.get("case");
    if (!id) return;
    void getCase(id).then(row => {
      if (!row || row.case_type !== "zakat") return;
      setRecord(row);
      setTitle(row.title);
      setData({ ...initialData, ...(row.input_data as Partial<ZakatInput>) });
    }).catch(reason => setError(isMalayalam ? c.openError : reason instanceof Error ? reason.message : c.openError));
  }, [params, c.openError, isMalayalam]);

  function setNumber(key: keyof ZakatInput, value: string) {
    setData(current => ({ ...current, [key]: Math.max(0, Number(value) || 0) }));
  }

  function field(label: string, key: keyof ZakatInput, helper?: string) {
    return <label><span>{label}</span><div className="money-field"><b>₹</b><input type="number" inputMode="decimal" min="0" value={Number(data[key])} onChange={event => setNumber(key, event.target.value)}/></div>{helper && <small className="field-help">{helper}</small>}</label>;
  }

  async function persist(status: VerificationStatus = record?.verification_status || "unverified") {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const stored = record
        ? await updateCase(record.id, { title: calculationTitle, input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown>, verification_status: status })
        : await createCase({ caseType: "zakat", madhhab: profile.madhhab, title: calculationTitle, input: data as unknown as Record<string, unknown>, result: result as unknown as Record<string, unknown>, status });
      setRecord(stored);
      window.history.replaceState({}, "", `/zakat/?case=${stored.id}`);
      setMessage(status === "review_requested" ? c.savedReview : c.saved);
      return stored;
    } catch (reason) {
      setError(isMalayalam ? c.saveError : reason instanceof Error ? reason.message : c.saveError);
      return null;
    } finally {
      setSaving(false);
    }
  }

  function download() {
    const current: CaseRecord = record || { id: "unsaved", user_id: user?.id || "", case_type: "zakat", madhhab: "shafii", title: calculationTitle, currency: "INR", input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown>, verification_status: "unverified", reviewer_note: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    downloadCaseReport({ ...current, title: calculationTitle, input_data: data as unknown as Record<string, unknown>, result_data: result as unknown as Record<string, unknown> });
  }

  return <AppShell title={c.pageTitle} eyebrow={c.pageEyebrow} actions={<button className="ghost-button compact" onClick={() => void persist()} disabled={saving}><Save/>{saving ? c.saving : c.saveDraft}</button>}>
    <div className="zakat-localized" lang={isMalayalam ? "ml" : "en"}>
      <div className="tool-page-head">
        <div><span className="eyebrow"><ShieldCheck/> {profile.madhhab} {c.methodSuffix}</span><h2>{c.heroTitle}</h2><p>{c.heroText}</p></div>
        <div className="step-pills">{c.steps.map((label, index) => <button key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""} onClick={() => setStep(index + 1)}>{step > index + 1 ? <Check/> : index + 1} {label}</button>)}</div>
      </div>

      {error && <div className="form-error workspace-error">{error}</div>}
      <div className="calculator-layout">
        <section className="workspace-panel calculator-form">
          <label className="case-title-field"><span>{c.caseTitle}</span><input value={title ?? c.defaultTitle} onChange={event => setTitle(event.target.value)} maxLength={90}/></label>

          {step === 1 && <>
            <div className="panel-heading"><div><span>{c.step} 1 / 3</span><h3>{c.step1Title}</h3></div><Scale/></div>
            <div className="calculation-fields">{field(c.cash, "cash")}{field(c.bank, "bank")}{field(c.gold, "gold")}{field(c.silver, "silver")}{field(c.business, "business", c.businessHelp)}{field(c.receivables, "receivables")}{field(c.investments, "investments")}{field(c.digitalAssets, "digitalAssets")}{field(c.other, "other")}</div>
            <SourceNote title={c.sourceTitle}>{c.step1Note}</SourceNote>
          </>}

          {step === 2 && <>
            <div className="panel-heading"><div><span>{c.step} 2 / 3</span><h3>{c.step2Title}</h3></div><ShieldCheck/></div>
            <div className="calculation-fields">{field(c.liabilities, "liabilities", c.liabilitiesHelp)}{field(c.nisab, "nisab", c.nisabHelp)}</div>
            <div className="condition-explain">
              <article><HelpCircle/><div><strong>{c.nisabTitle}</strong><p>{c.nisabText}</p></div></article>
              <article><HelpCircle/><div><strong>{c.hawlInfoTitle}</strong><p>{c.hawlInfoText}</p></div></article>
            </div>
            <label className="check-card friendly-check"><input type="checkbox" checked={data.hawl} onChange={event => setData({ ...data, hawl: event.target.checked })}/><span><strong>{c.hawlTitle}</strong><small>{c.hawlHelp}</small></span></label>
            <SourceNote title={c.sourceTitle}>{c.step2Note}</SourceNote>
          </>}

          {step === 3 && <>
            <div className="panel-heading"><div><span>{c.step} 3 / 3</span><h3>{c.step3Title}</h3></div><CircleDollarSign/></div>
            <div className="result-breakdown">{Object.entries(result.categoryValues).filter(([, value]) => value > 0).map(([key, value]) => <div key={key}><span>{categoryLabels[key as keyof typeof categoryLabels] || key}</span><strong>{money.format(value)}</strong></div>)}</div>
            {result.issues.length ? <div className="issue-list"><strong><AlertTriangle/>{c.reviewNotes}</strong>{result.issues.map(issue => <p key={issue}>{isMalayalam ? zakatIssueMalayalam[issue] || issue : issue}</p>)}</div> : <div className="ready-note"><Check/>{c.ready}</div>}
            <ScholarNotice title={c.scholarTitle} text={c.scholarText}/>
          </>}

          <div className="wizard-actions">
            {step > 1 && <button className="ghost-button" onClick={() => setStep(step - 1)}><ArrowLeft/>{c.back}</button>}
            <span/>
            {step < 3 ? <button className="primary-button" onClick={() => setStep(step + 1)}>{c.continue}<ArrowRight/></button> : <button className="primary-button" onClick={() => void persist()} disabled={saving}><Save/>{record ? c.updateCalculation : c.saveCalculation}</button>}
          </div>
        </section>

        <aside className="result-panel glass-result">
          <span className="eyebrow">{c.liveResult}</span>
          <div className="result-orb"><CircleDollarSign/><div><small>{c.estimatedZakat}</small><strong>{money.format(result.amountDue)}</strong></div></div>
          <dl><div><dt>{c.totalAssets}</dt><dd>{money.format(result.grossAssets)}</dd></div><div><dt>{c.enteredLiabilities}</dt><dd>− {money.format(result.allowedLiabilities)}</dd></div><div><dt>{c.netWealth}</dt><dd>{money.format(result.netZakatable)}</dd></div><div><dt>{c.nisabLabel}</dt><dd>{data.nisab ? money.format(data.nisab) : c.notEntered}</dd></div><div><dt>{c.rate}</dt><dd>2.5%</dd></div><div><dt>{c.madhhab}</dt><dd>{profile.madhhab}</dd></div></dl>
          <div className={`eligibility-status ${result.eligible ? "eligible" : "paused"}`}>{result.eligible ? <Check/> : <AlertTriangle/>}<span><strong>{result.eligible ? c.conditionsMet : c.calculationPaused}</strong><small>{result.eligible ? c.eligibleHelp : c.pausedHelp}</small></span></div>
          <button className="primary-button full" onClick={() => void persist("review_requested")} disabled={saving || (!record && result.grossAssets <= 0)}><Send/>{c.saveReview}</button>
          <button className="text-button" onClick={download}><FileDown/>{c.download}</button>
        </aside>
      </div>
      {message && <div className="toast"><Check/>{message}</div>}
    </div>
  </AppShell>;
}

export default function ZakatPage() {
  return <Suspense fallback={<AppShell title={zakatCopy.en.pageTitle} eyebrow={zakatCopy.en.pageEyebrow}><div className="workspace-panel panel-loading">{zakatCopy.en.preparing}</div></AppShell>}><ZakatWorkspace/></Suspense>;
}
