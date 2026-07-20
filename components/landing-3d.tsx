"use client";

import { BadgeCheck, BookOpenCheck, Calculator, FileCheck2, Scale, ShieldCheck } from "lucide-react";
import { useRef } from "react";

export function Landing3D() {
  const stage = useRef<HTMLDivElement>(null);

  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    if (!stage.current || event.pointerType === "touch") return;
    const rect = stage.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    stage.current.style.setProperty("--hero-ry", `${x * 10}deg`);
    stage.current.style.setProperty("--hero-rx", `${y * -8}deg`);
    stage.current.style.setProperty("--light-x", `${50 + x * 25}%`);
    stage.current.style.setProperty("--light-y", `${45 + y * 25}%`);
  }

  function reset() {
    stage.current?.style.setProperty("--hero-ry", "-4deg");
    stage.current?.style.setProperty("--hero-rx", "3deg");
  }

  return <div className="hero-3d-stage" ref={stage} onPointerMove={tilt} onPointerLeave={reset}>
    <div className="depth-grid" aria-hidden="true" />
    <div className="orbit orbit-one" aria-hidden="true"><i /><i /><i /></div>
    <div className="orbit orbit-two" aria-hidden="true"><i /><i /></div>
    <div className="glow-sphere" aria-hidden="true" />

    <div className="hero-product-card hero-card-3d">
      <div className="card-depth-edge" aria-hidden="true" />
      <div className="product-card-head"><span><Calculator /></span><div><small>Live calculation layer</small><h2>Zakat intelligence</h2></div><b><i /> Ready</b></div>
      <div className="preview-row"><span>Madhhab</span><strong>Shafi&apos;i</strong></div>
      <div className="preview-row"><span>Zakatable assets</span><strong>₹1,25,000</strong></div>
      <div className="preview-row"><span>Reviewable liabilities</span><strong>₹15,000</strong></div>
      <div className="preview-total"><div className="preview-ring"><Scale /></div><div><small>Preliminary zakat</small><strong>₹2,750</strong><span><BadgeCheck /> Every step stays traceable</span></div></div>
      <div className="preview-foot"><FileCheck2 /> Educational result · Qazi review available</div>
    </div>

    <div className="floating-card float-source"><span><BookOpenCheck /></span><div><small>Sources</small><strong>Mapped clearly</strong></div><BadgeCheck /></div>
    <div className="floating-card float-madhhab"><span><Scale /></span><div><small>Method</small><strong>4 madhhabs</strong></div></div>
    <div className="floating-card float-review"><span><ShieldCheck /></span><div><small>Human layer</small><strong>Qazi verification</strong></div><i /></div>
    <div className="hero-shadow" aria-hidden="true" />
  </div>;
}
