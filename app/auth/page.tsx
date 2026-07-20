"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, Eye, EyeOff, LockKeyhole, Mail, Scale, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "../../components/auth-provider";

function AuthContent() {
  const params = useSearchParams();
  const { signIn, signUp, requestPasswordReset, configured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(params.get("mode") === "signup" ? "signup" : "signin");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "reset") {
        await requestPasswordReset(form.email);
        setSuccess("Password-reset instructions have been sent to your email address.");
      } else if (mode === "signup") {
        const result = await signUp(form.email, form.password, form.name);
        if (result.needsEmailConfirmation) setSuccess("Account created. Check your email to confirm the account, then return to sign in.");
        else window.location.assign("/onboarding/");
      } else {
        await signIn(form.email, form.password);
        window.location.assign(params.get("next") || "/dashboard/");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally { setLoading(false); }
  }

  const title = mode === "signup" ? "Set up your MĪZĀN workspace" : mode === "reset" ? "Reset your password" : "Sign in to continue";
  return <main className="auth-page">
    <section className="auth-story"><Link className="brand" href="/"><Scale /><span>MĪZĀN</span></Link><div><span className="eyebrow"><ShieldCheck /> Private by design</span><h1>Your madhhab-aware workspace for careful decisions.</h1><p>Save calculations, build private family cases, ask modern questions and share only what you choose with a qualified reviewer.</p><ul><li><LockKeyhole /> Row-level account protection</li><li><ShieldCheck /> Consent-based review workflow</li><li><Mail /> Traceable consultation history</li></ul></div><small>Educational platform · Not an independent fatwa service</small></section>
    <section className="auth-panel"><div className="auth-box glass-auth"><span className="eyebrow">{mode === "signup" ? "Create your account" : mode === "reset" ? "Account recovery" : "Welcome back"}</span><h2>{title}</h2><p>{configured ? "Authentication and private records are secured through Supabase." : "The site owner must connect Supabase before accounts can be used."}</p>
      {!configured ? <div className="backend-required"><Database/><div><strong>Backend connection required</strong><p>Add the public Supabase URL and anon key to the deployment environment, then redeploy. Demo login has been removed.</p></div></div> : <>
        {mode !== "reset" && <div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}>Create account</button></div>}
        <form onSubmit={submit}>{mode === "signup" && <label><span>Full name</span><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Your name" autoComplete="name" /></label>}<label><span>Email address</span><div className="input-icon"><Mail /><input required type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" autoComplete="email" /></div></label>{mode !== "reset" && <label><span>Password</span><div className="input-icon"><LockKeyhole /><input required minLength={8} type={show ? "text" : "password"} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder="Minimum 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>}{error && <div className="form-error">{error}</div>}{success && <div className="form-success"><CheckCircle2 />{success}</div>}<button className="primary-button full" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}<ArrowRight /></button></form>
        <button className="auth-link" onClick={() => { setMode(mode === "reset" ? "signin" : "reset"); setError(""); setSuccess(""); }}>{mode === "reset" ? "Return to sign in" : "Forgot your password?"}</button>
      </>}
      <small className="auth-legal">Automatic outputs are educational and require qualified verification before sensitive financial or inheritance action.</small>
    </div></section>
  </main>;
}

export default function AuthPage() {
  return <Suspense fallback={<main className="auth-page"><section className="auth-story"><Link className="brand" href="/"><Scale/><span>MĪZĀN</span></Link></section><section className="auth-panel"><div className="auth-box glass-auth"><div className="panel-loading">Preparing secure access…</div></div></section></main>}><AuthContent/></Suspense>;
}
