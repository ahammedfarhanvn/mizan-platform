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
      const phase = reduceMotion.matches ? 0.72 : ((now - start) % 11000) / 11000;
      const bag = phase < 0.46 ? 1 : phase < 0.62 ? 1 - ease((phase - 0.46) / 0.16) : phase < 0.9 ? 0 : ease((phase - 0.9) / 0.1);
      const giving = phase < 0.48 ? 0 : phase < 0.64 ? ease((phase - 0.48) / 0.16) : phase < 0.92 ? 1 : 1 - ease((phase - 0.92) / 0.08);
      const identify = phase < 0.28 ? 1 : phase < 0.4 ? 1 - ease((phase - 0.28) / 0.12) : phase > 0.9 ? ease((phase - 0.9) / 0.1) : 0;
      const calculate = phase < 0.22 ? 0 : phase < 0.34 ? ease((phase - 0.22) / 0.12) : phase < 0.56 ? 1 : phase < 0.66 ? 1 - ease((phase - 0.56) / 0.1) : 0;
      const distribute = phase < 0.56 ? 0 : phase < 0.68 ? ease((phase - 0.56) / 0.12) : phase < 0.92 ? 1 : 1 - ease((phase - 0.92) / 0.08);
      const float = reduceMotion.matches ? 0 : Math.sin(phase * Math.PI * 8);

      element.style.setProperty("--story-progress", phase.toFixed(3));
      element.style.setProperty("--bag-opacity", bag.toFixed(3));
      element.style.setProperty("--giving-opacity", giving.toFixed(3));
      element.style.setProperty("--identify-opacity", identify.toFixed(3));
      element.style.setProperty("--calculate-opacity", calculate.toFixed(3));
      element.style.setProperty("--distribute-opacity", distribute.toFixed(3));
      element.style.setProperty("--bag-scale", (0.88 + bag * 0.12).toFixed(3));
      element.style.setProperty("--giving-scale", (0.91 + giving * 0.09).toFixed(3));
      element.style.setProperty("--bag-y", `${(-28 * (1 - bag) + float * 5).toFixed(1)}px`);
      element.style.setProperty("--giving-y", `${(34 * (1 - giving) + float * -3).toFixed(1)}px`);
      element.style.setProperty("--story-progress-width", `${(phase * 100).toFixed(1)}%`);
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
        <span className="eyebrow"><Sparkles /> Scholarship, organised with intelligence</span>
        <h1>Madhhab-aware <em>clarity.</em><br />Confident <em>calculations.</em></h1>
        <p className="hero-lead">A trusted digital workspace for Zakat, Farā’iḍ and modern Masā’il—designed around the recognised sources of the four Sunni madhhabs.</p>
        <p className="tagline">Identify. Calculate. Verify. Distribute.</p>
        <div className="hero-buttons">
          <Link className="primary-button" href="/auth?mode=signup">Create your account <ArrowRight /></Link>
          <Link className="ghost-button" href="#platform">Explore the platform <ArrowRight /></Link>
        </div>
        <div className="trust-line"><span><ShieldCheck /> Scholar-supervised</span><span><BookOpen /> Source-noted</span><span><LockKeyhole /> Privacy-first</span></div>
      </div>

      <div className="wealth-visual" aria-label="A money bag changes into a scene of giving in a continuous animation">
        <div className="wealth-aura" aria-hidden="true" />
        <div className="wealth-visual-label"><i /><span>Live wealth journey</span><b>11 sec cycle</b></div>
        <div className="wealth-orbit wealth-orbit-primary" aria-hidden="true"><i /><i /></div>
        <div className="wealth-orbit wealth-orbit-secondary" aria-hidden="true"><i /></div>

        <figure className="wealth-frame wealth-bag-frame">
          <div className="wealth-image-surface"><img src="/landing/wealth-bag-transparent.png" alt="A large green money bag representing the wealth to be assessed" /></div>
          <figcaption><span>01</span><div><small>Begin with clarity</small><strong>Understand what you own</strong></div></figcaption>
        </figure>

        <figure className="wealth-frame wealth-giving-frame">
          <div className="wealth-image-surface"><img src="/landing/wealth-giving-transparent.png" alt="A person giving a money bag to someone in need" /></div>
          <figcaption><span>02</span><div><small>Continue with purpose</small><strong>Give where it matters</strong></div></figcaption>
        </figure>

        <div className="wealth-status status-identify"><WalletCards /><small>Identify</small><strong>Map eligible wealth</strong></div>
        <div className="wealth-status status-calculate"><CircleCheck /><small>Calculate</small><strong>Know what is due</strong></div>
        <div className="wealth-status status-distribute"><HandCoins /><small>Distribute</small><strong>Act with confidence</strong></div>
        <div className="wealth-progress" aria-hidden="true"><span /><i /></div>
        <div className="wealth-cycle-labels" aria-hidden="true"><span>Identify</span><span>Calculate</span><span>Distribute</span></div>
      </div>
    </div>
  </section>;
}
