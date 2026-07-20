"use client";

import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Scale, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "../../components/auth-provider";

function AuthPageContent() {
  const params = useSearchParams(); const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { if (mode === "signup") await signUp(form.email, form.password, form.name); else await signIn(form.email, form.password); window.location.assign(mode === "signup" ? "/onboarding" : (params.get("next") || "/dashboard")); } catch (e) { setError(e instanceof Error ? e.message : "Authentication failed"); } finally { setLoading(false); } }
  return <main className="auth-page"><section className="auth-story"><Link className="brand" href="/"><Scale /><span>MĪZĀN</span></Link><div><span className="eyebrow"><ShieldCheck /> Private by design</span><h1>Your madhhab-aware workspace for careful decisions.</h1><p>Save calculations, build private family cases, ask modern questions and share only what you choose with a qualified reviewer.</p><ul><li><LockKeyhole /> Row-level data protection</li><li><ShieldCheck /> Scholar-review workflow</li><li><Mail /> Clear appointment history</li></ul></div><small>Educational platform · Not an independent fatwa service</small></section><section className="auth-panel"><div className="auth-box"><span className="eyebrow">{mode === "signup" ? "Create your account" : "Welcome back"}</span><h2>{mode === "signup" ? "Set up your MĪZĀN workspace" : "Sign in to continue"}</h2><p>{configured ? "Your account will be secured through Supabase authentication." : "Demo mode is active until Supabase keys are connected."}</p><div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button></div><form onSubmit={submit}>{mode === "signup" && <label><span>Full name</span><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" /></label>}<label><span>Email address</span><div className="input-icon"><Mail /><input required type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="name@example.com" /></div></label><label><span>Password</span><div className="input-icon"><LockKeyhole /><input required minLength={6} type={show ? "text" : "password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Minimum 6 characters" /><button type="button" aria-label="Show password" onClick={()=>setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>{error && <div className="form-error">{error}</div>}<button className="primary-button full" disabled={loading}>{loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}<ArrowRight /></button></form><small className="auth-legal">By continuing, you agree that automatic outputs require qualified verification before financial or inheritance action.</small></div></section></main>;
}

export default function AuthPage() {
  return <Suspense fallback={<main className="auth-page" aria-busy="true" />}><AuthPageContent /></Suspense>;
}
