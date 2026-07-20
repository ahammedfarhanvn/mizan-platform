"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, BookOpen, CircleCheck, HandCoins, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { useEffect, useRef } from "react";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function HeroScrollStory() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = section.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let start = performance.now();

    const ease = (value: number) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };

    const update = (now: number) => {
      const phase = reduceMotion.matches ? 0.72 : ((now - start) % 12000) / 12000;
      const fill = phase < 0.08 ? 0 : phase < 0.4 ? ease((phase - 0.08) / 0.32) : 1;
      const handoff = phase < 0.4 ? 0 : phase < 0.62 ? ease((phase - 0.4) / 0.22) : 1;
      const reset = phase < 0.91 ? 0 : ease((phase - 0.91) / 0.09);
      const bag = Math.max(0, (1 - handoff) * (1 - reset) + reset);
      const giving = Math.max(0, handoff * (1 - reset));
      const identify = phase < 0.18 ? 1 : phase < 0.3 ? 1 - ease((phase - 0.18) / 0.12) : 0;
      const calculate = phase < 0.18 ? 0 : phase < 0.34 ? ease((phase - 0.18) / 0.16) : phase < 0.5 ? 1 : 1 - ease((phase - 0.5) / 0.12);
      const distribute = phase < 0.5 ? 0 : phase < 0.66 ? ease((phase - 0.5) / 0.16) : phase < 0.91 ? 1 : 1 - reset;
      const float = reduceMotion.matches ? 0 : Math.sin(phase * Math.PI * 8);

      element.style.setProperty("--story-progress", phase.toFixed(3));
      element.style.setProperty("--bag-opacity", bag.toFixed(3));
      element.style.setProperty("--giving-opacity", giving.toFixed(3));
      element.style.setProperty("--identify-opacity", identify.toFixed(3));
      element.style.setProperty("--calculate-opacity", calculate.toFixed(3));
      element.style.setProperty("--distribute-opacity", distribute.toFixed(3));
      element.style.setProperty("--bag-scale", (0.9 + fill * 0.11 - handoff * 0.08).toFixed(3));
      element.style.setProperty("--giving-scale", (0.92 + giving * 0.08).toFixed(3));
      element.style.setProperty("--bag-y", `${(-34 * handoff + float * (1 - handoff) * 4).toFixed(1)}px`);
      element.style.setProperty("--bag-x", `${(46 * handoff).toFixed(1)}px`);
      element.style.setProperty("--giving-y", `${(28 * (1 - giving) + float * -2).toFixed(1)}px`);
      element.style.setProperty("--fill-progress", fill.toFixed(3));
      element.style.setProperty("--handoff-progress", handoff.toFixed(3));
      element.style.setProperty("--coin-opacity", ((1 - handoff) * Math.min(1, fill * 3)).toFixed(3));
      element.style.setProperty("--giving-reveal", `${(handoff * 78).toFixed(1)}%`);
      element.style.setProperty("--bag-rotate-y", `${(-2 + handoff * 7).toFixed(2)}deg`);
      element.style.setProperty("--bag-rotate-z", `${(handoff * 3).toFixed(2)}deg`);
      element.style.setProperty("--fill-glow-opacity", (fill * 0.8).toFixed(3));
      element.style.setProperty("--fill-glow-scale", (0.2 + fill * 0.8).toFixed(3));
      element.style.setProperty("--fill-caption-opacity", (1 - handoff).toFixed(3));
      element.style.setProperty("--fill-caption-y", `${(-8 * handoff).toFixed(1)}px`);
      element.style.setProperty("--give-caption-y", `${(14 * (1 - handoff)).toFixed(1)}px`);
      element.dataset.phase = distribute > 0.5 ? "distribute" : calculate > 0.5 ? "calculate" : "identify";

      if (!reduceMotion.matches) frame = window.requestAnimationFrame(update);
    };

    const restart = () => {
      if (frame) window.cancelAnimationFrame(frame);
      start = performance.now();
      frame = window.requestAnimationFrame(update);
    };

    restart();
    reduceMotion.addEventListener("change", restart);
    return () => {
      reduceMotion.removeEventListener("change", restart);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <section className="wealth-story" ref={section} aria-label="From clear wealth to purposeful giving">
    <div className="wealth-sticky page-width">
      <div className="hero-copy wealth-copy">
        <span className="eyebrow" data-hero-text style={{"--hero-delay":"80ms"} as React.CSSProperties}><Sparkles /> A live, guided wealth journey</span>
        <h1 data-hero-text style={{"--hero-delay":"150ms"} as React.CSSProperties}>Clarify your <em>wealth.</em><br />Give with <em>confidence.</em></h1>
        <p className="hero-lead" data-hero-text style={{"--hero-delay":"250ms"} as React.CSSProperties}>See what is eligible, understand what is due and move from careful calculation to purposeful giving through one clear journey.</p>
        <p className="tagline" data-hero-text style={{"--hero-delay":"330ms"} as React.CSSProperties}>Understand. Calculate. Verify. Give.</p>
        <div className="hero-buttons" data-hero-text style={{"--hero-delay":"410ms"} as React.CSSProperties}>
          <Link className="primary-button" href="/auth?mode=signup">Create your account <ArrowRight /></Link>
          <Link className="ghost-button" href="#platform">Explore the platform <ArrowRight /></Link>
        </div>
        <div className="trust-line" data-hero-text style={{"--hero-delay":"490ms"} as React.CSSProperties}><span><ShieldCheck /> Scholar-supervised</span><span><BookOpen /> Source-noted</span><span><LockKeyhole /> Privacy-first</span></div>
      </div>

      <div className="wealth-visual" aria-label="A money bag changes into a scene of giving in a continuous animation">
        <div className="wealth-aura" aria-hidden="true" />
        <div className="wealth-visual-label"><i /><span>Cinematic wealth journey</span><b>12 sec motion</b></div>
        <div className="wealth-orbit wealth-orbit-primary" aria-hidden="true"><i /><i /></div>
        <div className="wealth-orbit wealth-orbit-secondary" aria-hidden="true"><i /></div>
        <div className="coin-stream" aria-hidden="true">{Array.from({ length: 11 }).map((_, index) => <i key={index} style={{"--coin-left": `${31 + index * 3.8}%`, "--coin-delay": `${index * -0.17}s`, "--coin-rotation": `${index * 24}deg`} as React.CSSProperties}><span>{index % 3 === 0 ? "₹" : ""}</span></i>)}</div>
        <div className="bag-fill-glow" aria-hidden="true" />

        <figure className="wealth-frame wealth-bag-frame">
          <div className="wealth-image-surface"><img src="/landing/wealth-bag-transparent.png" alt="A large green money bag representing the wealth to be assessed" /></div>
        </figure>

        <figure className="wealth-frame wealth-giving-frame">
          <div className="wealth-image-surface"><img src="/landing/wealth-giving-transparent.png" alt="A person giving a money bag to someone in need" /></div>
        </figure>

        <div className="wealth-status status-identify"><WalletCards /><small>Identify</small><strong>Map eligible wealth</strong></div>
        <div className="wealth-status status-calculate"><CircleCheck /><small>Calculate</small><strong>Know what is due</strong></div>
        <div className="wealth-status status-distribute"><HandCoins /><small>Distribute</small><strong>Act with confidence</strong></div>
        <div className="motion-caption" aria-hidden="true"><span className="caption-fill"><small>01 · Clarify</small><strong>Map and understand the wealth</strong></span><span className="caption-give"><small>02 · Fulfil</small><strong>Move from calculation to purposeful giving</strong></span></div>
      </div>
    </div>
  </section>;
}
