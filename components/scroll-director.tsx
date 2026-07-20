"use client";

import { useEffect } from "react";

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function ScrollDirector() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const elements = document.querySelectorAll<HTMLElement>("[data-scroll-motion]");
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const offset = Number(element.dataset.scrollOffset || 0);
        const progress = motionQuery.matches ? 1 : clamp((window.innerHeight * 0.92 - rect.top - offset) / (window.innerHeight * 0.42));
        const direction = element.dataset.scrollMotion;
        const distance = (1 - progress) * 72;
        const x = direction === "left" ? -distance : direction === "right" ? distance : 0;
        const y = direction === "up" ? distance : Math.abs(x) * 0.18;

        element.style.setProperty("--motion-opacity", progress.toFixed(3));
        element.style.setProperty("--motion-x", `${x.toFixed(1)}px`);
        element.style.setProperty("--motion-y", `${y.toFixed(1)}px`);
        element.style.setProperty("--motion-scale", (0.965 + progress * 0.035).toFixed(3));
      });

      const textElements = document.querySelectorAll<HTMLElement>("[data-text-reveal]");
      textElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const offset = Number(element.dataset.scrollOffset || 0);
        const progress = motionQuery.matches ? 1 : clamp((window.innerHeight * 0.91 - rect.top - offset) / (window.innerHeight * 0.28));
        element.style.setProperty("--text-progress", progress.toFixed(3));
        element.style.setProperty("--text-y", `${((1 - progress) * 34).toFixed(1)}px`);
        element.style.setProperty("--text-blur", `${((1 - progress) * 7).toFixed(1)}px`);
      });
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    motionQuery.addEventListener("change", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      motionQuery.removeEventListener("change", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
