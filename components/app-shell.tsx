"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Building2,
  Calculator,
  ChevronDown,
  FileText,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { accountRoles, getRoleDefinition } from "../lib/roles";
import { useAuth } from "./auth-provider";

const navItems = {
  dashboard: { href: "/dashboard", english: "Overview", malayalam: "അവലോകനം", icon: LayoutDashboard },
  role: { href: "/role", english: "Role workspace", malayalam: "റോൾ പ്രവർത്തനകേന്ദ്രം", icon: UserRound },
  zakat: { href: "/zakat", english: "Zakat", malayalam: "സകാത്ത്", icon: Calculator },
  faraid: { href: "/faraid", english: "Inheritance", malayalam: "അനന്തരാവകാശം", icon: GitBranch },
  masail: { href: "/masail", english: "Questions", malayalam: "ചോദ്യങ്ങൾ", icon: Bot },
  knowledge: { href: "/knowledge", english: "Knowledge", malayalam: "വിജ്ഞാനം", icon: BookOpen },
  qazi: { href: "/qazi", english: "Consultations", malayalam: "കൺസൾട്ടേഷനുകൾ", icon: Users },
  reports: { href: "/reports", english: "Reports", malayalam: "റിപ്പോർട്ടുകൾ", icon: FileText },
  settings: { href: "/settings", english: "Settings", malayalam: "ക്രമീകരണങ്ങൾ", icon: Settings },
} as const;

function RoleIcon({ role }: { role: string }) {
  if (role === "Student") return <GraduationCap />;
  if (role === "Business owner") return <BriefcaseBusiness />;
  if (role === "Mahallu / institution") return <Building2 />;
  if (role === "Family representative") return <Users />;
  if (role === "Scholar / Qazi") return <Scale />;
  return <UserRound />;
}

export function AppShell({ children, title, eyebrow, actions }: { children: React.ReactNode; title: string; eyebrow: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [savingPreference, setSavingPreference] = useState(false);
  const isMalayalam = profile.language.trim().toLowerCase() === "malayalam";
  const role = useMemo(() => getRoleDefinition(profile.role), [profile.role]);
  const navigation = role.nav.map(key => navItems[key as keyof typeof navItems]).filter(Boolean);

  useEffect(() => {
    if (!loading && !user) window.location.replace(`/auth?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname]);

  function runSearch(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    window.location.assign(query ? `/role/?search=${encodeURIComponent(query)}` : "/role/");
  }

  async function savePreference(changes: { role?: string; language?: string }) {
    setSavingPreference(true);
    try { await updateProfile(changes); }
    finally { setSavingPreference(false); }
  }

  if (loading || !user) return <div className="auth-loading"><Scale /><span>{isMalayalam ? "നിങ്ങളുടെ സ്വകാര്യ പ്രവർത്തനകേന്ദ്രം തയ്യാറാക്കുന്നു…" : "Preparing your private workspace…"}</span></div>;

  return <div className="app-frame warm-app">
    <button className={open ? "nav-scrim visible" : "nav-scrim"} aria-label="Close navigation" onClick={() => setOpen(false)} />
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-head">
        <Link className="brand" href="/"><span className="brand-mark"><Scale /></span><span>MĪZĀN</span></Link>
        <button aria-label={isMalayalam ? "നാവിഗേഷൻ അടയ്ക്കുക" : "Close navigation"} onClick={() => setOpen(false)}><X /></button>
      </div>

      <nav className="side-nav" aria-label="Workspace navigation">
        {navigation.map(({ href, english, malayalam, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          const label = href === "/role" ? (isMalayalam ? role.hubMalayalam : role.hubLabel) : (isMalayalam ? malayalam : english);
          return <Link key={href} className={active ? "active" : ""} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}><Icon /><span>{label}</span></Link>;
        })}
      </nav>

      <Link className="sidebar-account" href="/settings/">
        <span className="account-avatar">{profile.fullName.slice(0, 1).toUpperCase()}</span>
        <span><strong>{profile.fullName}</strong><small>{isMalayalam ? role.malayalam : role.label}</small></span>
        <ChevronDown />
      </Link>

      <Link className="role-scope-card" href="/role/">
        <span><ShieldCheck /></span>
        <div><small>{isMalayalam ? "നിങ്ങളുടെ റോൾ" : "Your role"}</small><strong>{isMalayalam ? role.malayalam : role.label}</strong><p>{isMalayalam ? role.capabilitiesMalayalam[0] : role.capabilities[0]}</p><b>{isMalayalam ? "അനുമതികൾ കാണുക" : "View workspace"} →</b></div>
      </Link>

      <button className="signout" onClick={async () => { await signOut(); window.location.assign("/"); }}><LogOut /> {isMalayalam ? "സൈൻ ഔട്ട്" : "Sign out"}</button>
    </aside>

    <div className="app-main">
      <header className="app-topbar">
        <button className="app-menu" aria-label={isMalayalam ? "നാവിഗേഷൻ തുറക്കുക" : "Open navigation"} onClick={() => setOpen(true)}><Menu /></button>
        <form className="workspace-search" onSubmit={runSearch}><Search /><input aria-label={isMalayalam ? "പ്രവർത്തനകേന്ദ്രത്തിൽ തിരയുക" : "Search workspace"} placeholder={isMalayalam ? "കേസുകളും ചോദ്യങ്ങളും തിരയുക…" : "Search cases, questions and knowledge…"} value={search} onChange={event => setSearch(event.target.value)} /><kbd>⌘ K</kbd></form>
        <div className="app-top-actions">
          <label className="top-select role-select"><RoleIcon role={profile.role}/><select aria-label="Active account role" value={profile.role} disabled={savingPreference} onChange={event => void savePreference({ role: event.target.value })}>{accountRoles.map(item => <option key={item}>{item}</option>)}</select><ChevronDown /></label>
          <Link className="notification-button" href="/role/" aria-label={isMalayalam ? "പ്രവർത്തന അപ്ഡേറ്റുകൾ" : "Workspace updates"}><Bell /></Link>
          <label className="top-select language-select"><select aria-label="Preferred language" value={profile.language} disabled={savingPreference} onChange={event => void savePreference({ language: event.target.value })}><option>English</option><option>Malayalam</option><option>Arabic</option></select><ChevronDown /></label>
          <Link className="profile-pill" href="/settings"><span>{profile.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{profile.fullName}</strong><small>{isMalayalam ? role.malayalam : role.shortLabel}</small></div></Link>
        </div>
      </header>

      <div className="app-page-heading"><div><span>{eyebrow}</span><h1>{title}</h1></div><div>{actions}</div></div>
      <main className="app-content">{children}</main>

      <nav className="mobile-bottom-nav" aria-label="Mobile workspace navigation">
        {navigation.slice(0, 4).map(({ href, english, malayalam, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><Icon/><span>{isMalayalam ? malayalam : english}</span></Link>)}
      </nav>
    </div>
  </div>;
}

export function StatCard({ icon: Icon, label, value, detail, tone = "teal" }: { icon: typeof BarChart3; label: string; value: string; detail: string; tone?: string }) {
  return <article className={`stat-card ${tone}`}><span><Icon /></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></article>;
}
