"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, LoaderCircle, Mail, Scale } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { supabase, verifyEmailToken } from "../../../lib/supabase";

function ConfirmationContent() {
  const params = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Checking your secure confirmation link…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const timer = window.setTimeout(() => {
      const tokenHash = params.get("token_hash") || "";
      const type = params.get("type") || "email";
      const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authError = fragment.get("error_description");
      const verification = authError
        ? Promise.reject(new Error(decodeURIComponent(authError.replaceAll("+", " "))))
        : tokenHash
          ? verifyEmailToken(tokenHash, type)
          : supabase
            ? supabase.auth.getSession().then(({ data, error }) => {
              if (error) throw error;
              if (!data.session) throw new Error("This confirmation link is incomplete or has already been used.");
              return data;
            })
            : Promise.reject(new Error("The authentication service is not configured."));
      void verification.then(() => {
        window.sessionStorage.removeItem("mizan_pending_email");
        window.history.replaceState({}, "", "/auth/confirm/");
        setState("success");
        setMessage("Your email is verified. Opening your private workspace…");
        window.setTimeout(() => window.location.replace("/onboarding/"), 900);
      }).catch(reason => {
        setState("error");
        setMessage(reason instanceof Error ? reason.message : "The confirmation link could not be verified.");
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [params]);

  return <main className="auth-confirm-page"><Link className="brand" href="/"><Scale/><span>MĪZĀN</span></Link><section className={`auth-confirm-card ${state}`}>
    {state === "checking" ? <LoaderCircle className="confirm-spinner"/> : state === "success" ? <CheckCircle2/> : <AlertTriangle/>}
    <span className="eyebrow">Secure email confirmation</span>
    <h1>{state === "checking" ? "Verifying your account" : state === "success" ? "Email verified" : "A fresh link is needed"}</h1>
    <p>{message}</p>
    {state === "error" && <><Link className="primary-button" href="/auth/?mode=verify"><Mail/>Resend confirmation email</Link><Link className="auth-link" href="/auth/">Return to sign in</Link></>}
  </section></main>;
}

export default function ConfirmationPage() {
  return <Suspense fallback={<main className="auth-confirm-page"><section className="auth-confirm-card checking"><LoaderCircle className="confirm-spinner"/><p>Preparing secure confirmation…</p></section></main>}><ConfirmationContent/></Suspense>;
}
