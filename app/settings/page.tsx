"use client";

import { Bell, Check, Download, KeyRound, LockKeyhole, Save, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { useAuth } from "../../components/auth-provider";
import { exportAccountData } from "../../lib/supabase";

export default function Settings() {
  const { profile, updateProfile, configured, updatePassword } = useAuth();
  const [form, setForm] = useState(profile);
  const [tab, setTab] = useState("profile");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    // Keep the form aligned when the database profile finishes loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(profile);
  }, [profile]);

  async function save() {
    setSaving(true); setMessage(""); setError("");
    try { await updateProfile(form); setMessage("Profile settings saved securely."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save settings."); }
    finally { setSaving(false); }
  }
  async function changePassword() {
    setMessage(""); setError("");
    if (password.length < 8) return setError("Use a password with at least 8 characters.");
    if (password !== confirmPassword) return setError("The passwords do not match.");
    try { await updatePassword(password); setPassword(""); setConfirmPassword(""); setMessage("Password updated successfully."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update the password."); }
  }
  async function downloadData() {
    try {
      const data = await exportAccountData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "mizan-account-export.json"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not export account data."); }
  }

  return <AppShell title="Profile & settings" eyebrow="Account preferences" actions={<button className="primary-button compact" onClick={save} disabled={saving}><Save/>{saving ? "Saving…" : "Save changes"}</button>}><div className="settings-layout"><aside className="settings-nav"><button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><UserRound/>Profile</button><button className={tab === "guidance" ? "active" : ""} onClick={() => setTab("guidance")}><ShieldCheck/>Guidance</button><button className={tab === "privacy" ? "active" : ""} onClick={() => setTab("privacy")}><LockKeyhole/>Privacy</button><button className={tab === "notifications" ? "active" : ""} onClick={() => setTab("notifications")}><Bell/>Notifications</button><button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}><KeyRound/>Security</button></aside>
    <section className="workspace-panel settings-card">
      {tab === "profile" && <><div className="settings-heading"><UserRound/><div><h2>Personal profile</h2><p>Used to personalise your private workspace.</p></div></div><div className="settings-fields"><label><span>Full name</span><input value={form.fullName} onChange={event => setForm({ ...form, fullName: event.target.value })}/></label><label><span>Account role</span><select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}><option>Individual</option><option>Family representative</option><option>Student</option><option>Business owner</option><option>Mahallu / institution</option><option>Scholar / Qazi</option></select></label><label><span>Region</span><input value={form.region} onChange={event => setForm({ ...form, region: event.target.value })}/></label><label><span>Language</span><select value={form.language} onChange={event => setForm({ ...form, language: event.target.value })}><option>English</option><option>Malayalam</option><option>Arabic</option></select></label></div></>}
      {tab === "guidance" && <><div className="settings-heading"><ShieldCheck/><div><h2>Guidance preferences</h2><p>Your selected method remains visible throughout new workflows.</p></div></div><div className="madhhab-options">{["Hanafi", "Maliki", "Shafi'i", "Hanbali"].map(madhhab => <button key={madhhab} className={form.madhhab === madhhab ? "active" : ""} onClick={() => setForm({ ...form, madhhab })}><span>{madhhab}</span>{form.madhhab === madhhab && <Check/>}</button>)}</div><div className="setting-info"><ShieldCheck/><p>Changing this setting does not rewrite saved reports. Existing reports keep the method recorded when they were created.</p></div></>}
      {tab === "privacy" && <><div className="settings-heading"><LockKeyhole/><div><h2>Privacy & data</h2><p>Review storage and download a copy of your private records.</p></div></div><div className="privacy-cards"><article><strong>Database connection</strong><span>{configured ? "Supabase connected" : "Not configured"}</span></article><article><strong>Scholar sharing</strong><span>Explicit consent required per appointment</span></article><article><strong>Access control</strong><span>Row-level policies restrict records to your account</span></article></div><button className="ghost-button data-export" onClick={downloadData}><Download/>Download my account data</button></>}
      {tab === "notifications" && <><div className="settings-heading"><Bell/><div><h2>Notifications</h2><p>Choose which account events should be enabled in your profile.</p></div></div><div className="notification-list">{([['appointments','Appointment confirmations'],['reviews','Qazi review updates'],['reminders','Calculation reminders'],['security','Security alerts']] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={Boolean(form.notifications[key])} onChange={event => setForm({ ...form, notifications: { ...form.notifications, [key]: event.target.checked } })}/><span>{label}</span></label>)}</div></>}
      {tab === "security" && <><div className="settings-heading"><KeyRound/><div><h2>Change password</h2><p>Update the password for your authenticated Supabase account.</p></div></div><div className="settings-fields password-fields"><label><span>New password</span><input type="password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password"/></label><label><span>Confirm password</span><input type="password" minLength={8} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} autoComplete="new-password"/></label></div><button className="ghost-button" onClick={changePassword}><KeyRound/>Update password</button></>}
    </section></div>{message && <div className="toast"><Check/>{message}</div>}{error && <div className="toast toast-error">{error}</div>}</AppShell>;
}
