"use client";

import { BadgeCheck, CalendarDays, Check, Clock3, Languages, LocateFixed, Search, ShieldCheck, Users, Video, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { cancelAppointment, createAppointment, listAppointments, listCases, listQazis } from "../../lib/supabase";
import type { AppointmentRecord, CaseRecord, QaziRecord } from "../../lib/models";

export default function Qazi() {
  const [qazis, setQazis] = useState<QaziRecord[]>([]);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selected, setSelected] = useState<QaziRecord | null>(null);
  const [query, setQuery] = useState("");
  const [expertise, setExpertise] = useState("All");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("Farā’iḍ verification");
  const [mode, setMode] = useState("Online video");
  const [caseId, setCaseId] = useState("");
  const [consent, setConsent] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [qaziRows, caseRows, appointmentRows] = await Promise.all([listQazis(), listCases(), listAppointments()]);
      setQazis(qaziRows); setCases(caseRows); setAppointments(appointmentRows); setSelected(current => current || qaziRows[0] || null); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the verification network."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const visible = useMemo(() => qazis.filter(qazi => {
    const text = `${qazi.name} ${qazi.institution} ${qazi.city} ${qazi.state} ${qazi.languages.join(" ")} ${qazi.expertise.join(" ")}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (expertise === "All" || qazi.expertise.some(item => item.toLowerCase().includes(expertise.toLowerCase())));
  }), [qazis, query, expertise]);

  async function book() {
    if (!selected) return setError("Select a verified Qazi before booking.");
    if (!date) return setError("Choose a preferred date.");
    if (caseId && !consent) return setError("Confirm consent before sharing a case with the selected Qazi.");
    setSaving(true); setError(""); setMessage("");
    try {
      const stored = await createAppointment({ qaziId: selected.id, caseId: caseId || null, consultationType: type, consultationMode: mode, preferredDate: date, preferredTime: time, notes: note, shareConsent: Boolean(caseId && consent) });
      setAppointments(current => [{ ...stored, qazi: { id: selected.id, name: selected.name, institution: selected.institution, city: selected.city, state: selected.state } }, ...current]);
      setMessage("Consultation request sent securely."); setDate(""); setTime(""); setNote(""); setCaseId(""); setConsent(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not send the appointment request."); }
    finally { setSaving(false); }
  }
  async function cancel(record: AppointmentRecord) {
    if (!window.confirm("Cancel this consultation request?")) return;
    try { await cancelAppointment(record.id); setAppointments(current => current.map(item => item.id === record.id ? { ...item, status: "cancelled" } : item)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not cancel the request."); }
  }

  return <AppShell title="Qazi Connect" eyebrow="Verified scholar consultation"><div className="tool-page-head"><div><span className="eyebrow"><ShieldCheck/> Verification network</span><h2>Connect a case to qualified human judgment.</h2><p>Only profiles marked verified in the database are displayed. Case sharing is optional and requires explicit consent.</p></div><div className="directory-search"><Search/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search location, language or expertise"/><button><LocateFixed/>Verified only</button></div></div>
    {error && <div className="form-error workspace-error">{error}<button onClick={load}>Try again</button></div>}
    <div className="qazi-page"><section className="qazi-directory"><div className="filter-row">{["All", "Zakat", "Farā’iḍ", "Business", "Family"].map(item => <button key={item} className={expertise === item ? "active" : ""} onClick={() => setExpertise(item)}>{item === "All" ? "All expertise" : item}</button>)}</div><div className="qazi-list">{loading ? <div className="panel-loading">Loading verified directory…</div> : visible.length ? visible.map(qazi => <article key={qazi.id} className={selected?.id === qazi.id ? "selected" : ""}><div className="qazi-avatar"><Users/></div><div className="qazi-info"><span><BadgeCheck/>Verified profile</span><h3>{qazi.name}</h3><p>{qazi.institution || "Independent verified scholar"}</p><div><small><LocateFixed/>{[qazi.city, qazi.state, qazi.country].filter(Boolean).join(", ") || "Location not published"}</small><small><Languages/>{qazi.languages.join(" · ") || "Languages not listed"}</small><small><ShieldCheck/>{qazi.madhhab_specialisations.join(" · ") || "Specialisation not listed"}</small></div></div><aside><strong>{qazi.expertise.join(" · ") || "General consultation"}</strong><small><Video/> {qazi.consultation_modes.join(" & ") || "Contact for mode"}</small><button onClick={() => setSelected(qazi)}>{selected?.id === qazi.id ? <><Check/>Selected</> : "Select scholar"}</button></aside></article>) : <div className="real-empty qazi-empty"><BadgeCheck/><strong>No verified profiles match</strong><p>No sample or unverified scholar is shown. Add verified profiles in Supabase or change the filters.</p></div>}</div>
        <section className="appointment-history"><div className="panel-heading"><div><span>Your requests</span><h3>Consultation history</h3></div><Clock3/></div>{appointments.length ? appointments.slice(0, 6).map(record => <article key={record.id}><div><strong>{record.qazi?.name || record.consultation_type}</strong><small>{record.preferred_date || "Date pending"} · {record.consultation_mode}</small></div><em className={record.status}>{record.status}</em>{record.status === "requested" && <button aria-label="Cancel request" onClick={() => cancel(record)}><X/></button>}</article>) : <div className="real-empty compact-empty"><CalendarDays/><strong>No consultation requests</strong><p>Your submitted appointments will appear here.</p></div>}</section>
      </section>
      <aside className="booking-panel glass-result"><span className="eyebrow">Consultation request</span>{selected ? <><h3>{selected.name}</h3><p>{selected.institution || "Verified scholar"}</p><label><span>Consultation type</span><select value={type} onChange={event => setType(event.target.value)}><option>Farā’iḍ verification</option><option>Zakat consultation</option><option>Business Zakat assessment</option><option>Modern financial Mas’ala</option><option>Family relationship clarification</option></select></label><label><span>Consultation mode</span><select value={mode} onChange={event => setMode(event.target.value)}><option>Online video</option><option>Telephone</option><option>In person</option></select></label><div className="booking-time-grid"><label><span>Preferred date</span><div className="input-icon"><CalendarDays/><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={event => setDate(event.target.value)}/></div></label><label><span>Preferred time</span><input type="time" value={time} onChange={event => setTime(event.target.value)}/></label></div><label><span>Attach a saved case (optional)</span><select value={caseId} onChange={event => { setCaseId(event.target.value); if (!event.target.value) setConsent(false); }}><option value="">Do not share a case</option>{cases.map(record => <option key={record.id} value={record.id}>{record.title}</option>)}</select></label>{caseId && <label className="consent-card"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span><strong>I consent to share this case</strong><small>The selected Qazi may review the saved inputs and result for this appointment.</small></span></label>}<label><span>Private note</span><textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1500} placeholder="Briefly describe what requires review"/></label><div className="private-note"><ShieldCheck/>Only the selected verified profile receives a case when consent is enabled.</div><button className="primary-button full" disabled={saving || !date || Boolean(caseId && !consent)} onClick={book}>{saving ? "Sending…" : "Request appointment"}</button></> : <div className="real-empty booking-empty"><Users/><strong>Select a verified Qazi</strong><p>The appointment form will open after a verified profile is selected.</p></div>}</aside></div>
    {message && <div className="toast"><Check/>{message}</div>}
  </AppShell>;
}
