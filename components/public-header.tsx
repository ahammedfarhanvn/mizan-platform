"use client";

import Link from "next/link";
import { Menu, Scale, X } from "lucide-react";
import { useState } from "react";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="public-header page-width">
    <Link className="brand" href="/"><Scale /><span>MĪZĀN</span></Link>
    <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav className={open ? "public-nav open" : "public-nav"}>
      <Link href="/#platform">Platform</Link><Link href="/knowledge">Knowledge</Link><Link href="/qazi">Qazi Network</Link><Link href="/about">About</Link>
      <Link className="ghost-button compact" href="/auth">Sign in</Link>
      <Link className="primary-button compact" href="/auth?mode=signup">Create account</Link>
    </nav>
  </header>;
}
