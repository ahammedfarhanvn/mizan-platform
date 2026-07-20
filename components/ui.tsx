import { AlertTriangle, BookOpen, ShieldCheck } from "lucide-react";

export function PageIntro({ title, text }: { title: string; text: string }) {
  return <div className="page-intro"><h2>{title}</h2><p>{text}</p></div>;
}

export function ScholarNotice({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "scholar-notice compact" : "scholar-notice"}><ShieldCheck /><div><strong>Scholar verification required</strong><p>This is an educational preliminary result, not an independent fatwa or final legal instruction.</p></div></div>;
}

export function SourceNote({ children }: { children: React.ReactNode }) {
  return <div className="source-note"><BookOpen /><div><strong>Reference note</strong><p>{children}</p></div></div>;
}

export function ReviewWarning({ children }: { children: React.ReactNode }) {
  return <div className="review-warning"><AlertTriangle /><span>{children}</span></div>;
}
