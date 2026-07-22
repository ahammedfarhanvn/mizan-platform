import { AlertTriangle, BookOpen, ShieldCheck } from "lucide-react";

export function PageIntro({ title, text }: { title: string; text: string }) {
  return <div className="page-intro"><h2>{title}</h2><p>{text}</p></div>;
}

export function ScholarNotice({ compact = false, title = "Scholar verification required", text = "This is an educational preliminary result, not an independent fatwa or final legal instruction." }: { compact?: boolean; title?: string; text?: string }) {
  return <div className={compact ? "scholar-notice compact" : "scholar-notice"}><ShieldCheck /><div><strong>{title}</strong><p>{text}</p></div></div>;
}

export function SourceNote({ children, title = "Reference note" }: { children: React.ReactNode; title?: string }) {
  return <div className="source-note"><BookOpen /><div><strong>{title}</strong><p>{children}</p></div></div>;
}

export function ReviewWarning({ children }: { children: React.ReactNode }) {
  return <div className="review-warning"><AlertTriangle /><span>{children}</span></div>;
}
