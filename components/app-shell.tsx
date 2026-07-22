"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Calculator, ChevronDown, FileText, GitBranch, LayoutDashboard, LogOut, Menu, Scale, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";

const nav = [
  ["/dashboard", "Overview", "അവലോകനം", LayoutDashboard],
  ["/zakat", "Zakat Calculator", "സകാത്ത് കാൽക്കുലേറ്റർ", Calculator],
  ["/faraid", "Farā’iḍ", "ഫറാഇദ്", GitBranch],
  ["/masail", "Masā’il Assistant", "മസാഇൽ സഹായി", Bot],
  ["/qazi", "Qazi Connect", "ഖാസി കണക്റ്റ്", Users],
  ["/reports", "Reports", "റിപ്പോർട്ടുകൾ", FileText],
  ["/settings", "Settings", "ക്രമീകരണങ്ങൾ", Settings],
] as const;

const roleMalayalam: Record<string, string> = { Individual: "വ്യക്തിഗത ഉപയോക്താവ്", "Family representative": "കുടുംബ പ്രതിനിധി", Student: "വിദ്യാർത്ഥി", "Business owner": "വ്യാപാരി", "Mahallu / institution": "മഹല്ല് / സ്ഥാപനം", "Scholar / Qazi": "പണ്ഡിതൻ / ഖാസി" };

export function AppShell({ children, title, eyebrow, actions }: { children: React.ReactNode; title: string; eyebrow: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isMalayalam = profile.language.trim().toLowerCase() === "malayalam";

  useEffect(() => {
    if (!loading && !user) window.location.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname]);

  if (loading || !user) return <div className="auth-loading"><Scale /><span>Preparing your private workspace…</span></div>;

  return <div className="app-frame">
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-head"><Link className="brand" href="/"><Scale /><span>MĪZĀN</span></Link><button aria-label={isMalayalam ? "നാവിഗേഷൻ അടയ്ക്കുക" : "Close navigation"} onClick={() => setOpen(false)}><X /></button></div>
      <div className="madhhab-status"><ShieldCheck /><span><small>{isMalayalam ? "സജീവ മദ്ഹബ്" : "Active madhhab"}</small><strong>{profile.madhhab}</strong></span><ChevronDown /></div>
      <nav className="side-nav">{nav.map(([href, english, malayalam, Icon]) => <Link key={href} className={pathname === href ? "active" : ""} href={href} onClick={() => setOpen(false)}><Icon /><span>{isMalayalam ? malayalam : english}</span></Link>)}</nav>
      <div className="sidebar-trust"><ShieldCheck /><span><strong>{isMalayalam ? "വിദ്യാഭ്യാസ പ്ലാറ്റ്‌ഫോം" : "Educational platform"}</strong><small>{isMalayalam ? "അന്തിമ തീരുമാനങ്ങൾക്ക് പണ്ഡിത പരിശോധന ആവശ്യമാണ്." : "Final decisions require scholar verification."}</small></span></div>
      <button className="signout" onClick={async () => { await signOut(); window.location.assign("/"); }}><LogOut /> {isMalayalam ? "സൈൻ ഔട്ട്" : "Sign out"}</button>
    </aside>
    <div className="app-main">
      <header className="app-topbar"><button className="app-menu" aria-label={isMalayalam ? "നാവിഗേഷൻ തുറക്കുക" : "Open navigation"} onClick={() => setOpen(true)}><Menu /></button><div className="app-title"><span>{eyebrow}</span><h1>{title}</h1></div><div className="app-top-actions">{actions}<Link className="profile-pill" href="/settings"><span>{profile.fullName.slice(0,1).toUpperCase()}</span><div><strong>{profile.fullName}</strong><small>{isMalayalam ? roleMalayalam[profile.role] || profile.role : profile.role}</small></div></Link></div></header>
      <div className="app-content">{children}</div>
    </div>
  </div>;
}

export function StatCard({ icon: Icon, label, value, detail, tone = "teal" }: { icon: typeof BarChart3; label: string; value: string; detail: string; tone?: string }) {
  return <article className={`stat-card ${tone}`}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}
