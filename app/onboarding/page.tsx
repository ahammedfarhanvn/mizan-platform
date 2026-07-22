"use client";

import { ArrowLeft, ArrowRight, Check, Globe2, Scale, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../components/auth-provider";
import { accountRoles, getRoleDefinition } from "../../lib/roles";

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedRole = getRoleDefinition(data.role);

  async function finish() {
    setSaving(true); setError("");
    try { await updateProfile({ ...data, onboardingComplete: true }); window.location.assign("/dashboard"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save your workspace preferences."); }
    finally { setSaving(false); }
  }

  return <main className="onboarding">
    <header><div className="brand"><span className="brand-mark"><Scale /></span><span>MĪZĀN</span></div><div className="step-track" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map(number => <span key={number} className={step >= number ? "active" : ""}>{step > number ? <Check /> : number}</span>)}</div></header>
    <section className="onboarding-card">
      <span className="ornament-badge"><Sparkles/></span>
      <span className="eyebrow">Step {step} of 3</span>

      {step === 1 && <><UserRound className="onboarding-icon"/><h1>Choose your workspace</h1><p>We will organise the navigation and dashboard for this role. It does not change a calculation or grant reviewer authority.</p><div className="choice-grid role-choice-grid">{accountRoles.map(role => { const definition = getRoleDefinition(role); return <button key={role} className={data.role === role ? "selected" : ""} onClick={() => setData({ ...data, role })}><span><strong>{role}</strong><small>{definition.description}</small></span>{data.role === role ? <Check/> : <ArrowRight/>}</button>; })}</div><div className="selected-role-preview"><ShieldCheck/><div><strong>{selectedRole.hubLabel}</strong><span>{selectedRole.capabilities.join(" · ")}</span></div></div></>}

      {step === 2 && <><Scale className="onboarding-icon"/><h1>Select your madhhab</h1><p>Your selected method stays visible throughout calculations, questions and saved reports.</p><div className="choice-grid two">{["Hanafi", "Maliki", "Shafi'i", "Hanbali"].map(madhhab => <button key={madhhab} className={data.madhhab === madhhab ? "selected" : ""} onClick={() => setData({ ...data, madhhab })}><span><strong>{madhhab}</strong><small>Keep this method visible</small></span>{data.madhhab === madhhab && <Check/>}</button>)}</div><div className="onboarding-boundary"><ShieldCheck/><p>This preference helps organise educational output. Personal rulings and disputed cases still need qualified verification.</p></div></>}

      {step === 3 && <><Globe2 className="onboarding-icon"/><h1>Language and region</h1><p>Choose how the interface should communicate. Regional context also helps flag documents or law that may need local advice.</p><div className="onboarding-fields"><label><span>Preferred language</span><select value={data.language} onChange={event => setData({ ...data, language: event.target.value })}><option>English</option><option>Malayalam</option><option>Arabic</option></select></label><label><span>Country or region</span><input value={data.region} onChange={event => setData({ ...data, region: event.target.value })} placeholder="Kerala, India"/></label></div><div className="workspace-ready-card"><Check/><div><strong>{selectedRole.hubLabel} is ready</strong><p>{data.madhhab} · {data.language} · {data.region || "Region not set"}</p></div></div></>}

      {error && <div className="form-error">{error}</div>}
      <div className="onboarding-actions">{step > 1 && <button className="ghost-button" onClick={() => setStep(step - 1)}><ArrowLeft/>Back</button>}<button className="primary-button" disabled={saving} onClick={() => step < 3 ? setStep(step + 1) : void finish()}>{saving ? "Saving…" : step < 3 ? "Continue" : "Open dashboard"}<ArrowRight/></button></div>
    </section>
  </main>;
}
