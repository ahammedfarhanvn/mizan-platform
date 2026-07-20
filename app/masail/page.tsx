"use client";

import { ArrowRight, BadgeCheck, Bot, Clock3, Search, Send, ShieldCheck, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { ScholarNotice, SourceNote } from "../../components/ui";
import { useAuth } from "../../components/auth-provider";
import { listKnowledgeArticles, listMasalaQuestions, submitMasalaQuestion } from "../../lib/supabase";
import type { KnowledgeArticle, MasalaQuestionRecord } from "../../lib/models";

function scoreArticle(article: KnowledgeArticle, query: string) {
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2);
  const haystack = `${article.title} ${article.category} ${article.keywords.join(" ")}`.toLowerCase();
  return words.reduce((score, word) => score + (haystack.includes(word) ? 1 : 0), 0);
}

export default function Masail() {
  const { profile } = useAuth();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [history, setHistory] = useState<MasalaQuestionRecord[]>([]);
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("General");
  const [language, setLanguage] = useState(profile.language);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [articleRows, questionRows] = await Promise.all([listKnowledgeArticles(), listMasalaQuestions()]);
      setArticles(articleRows); setHistory(questionRows); setSelected(current => current || articleRows[0] || null); setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load the approved knowledge library."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const filtered = useMemo(() => articles.filter(article => `${article.title} ${article.category} ${article.keywords.join(" ")}`.toLowerCase().includes(libraryQuery.toLowerCase())), [articles, libraryQuery]);

  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (!question.trim()) return;
    setSending(true); setError(""); setMessage("");
    const ranked = articles.map(article => ({ article, score: scoreArticle(article, question) })).sort((a, b) => b.score - a.score);
    const match = ranked[0]?.score > 0 ? ranked[0].article : null;
    try {
      const stored = await submitMasalaQuestion({ madhhab: profile.madhhab, subject, language, question: question.trim(), matchedArticle: match });
      setHistory(current => [stored, ...current]);
      if (match) { setSelected(match); setMessage("A relevant approved guidance note was found. Review its follow-up questions and source limits below."); }
      else setMessage("Your question was saved for review. No approved article was close enough, so MĪZĀN did not generate an unsupported answer.");
      setQuestion("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not submit the question."); }
    finally { setSending(false); }
  }

  return <AppShell title="Masā’il Assistant" eyebrow="Approved-library preliminary guidance"><div className="tool-page-head"><div><span className="eyebrow"><Sparkles/> {profile.madhhab} guidance mode</span><h2>Ask carefully. Trace every answer.</h2><p>MĪZĀN searches only the published knowledge collection. If there is no reliable match, it saves the question for review instead of inventing an answer.</p></div><div className="assistant-controls"><select value={subject} onChange={event => setSubject(event.target.value)}><option>General</option><option>Modern Zakat</option><option>Modern Farā’iḍ</option><option>Business & Finance</option><option>Technology & Society</option><option>Travel & Worship</option></select><select value={language} onChange={event => setLanguage(event.target.value)}><option>English</option><option>Malayalam</option><option>Arabic</option></select></div></div>
    {error && <div className="form-error workspace-error">{error}<button onClick={load}>Try again</button></div>}
    <div className="assistant-page"><aside className="question-library"><div className="search-box"><Search/><input value={libraryQuery} onChange={event => setLibraryQuery(event.target.value)} placeholder="Search approved guidance"/></div><span className="list-label">Published guidance library</span>{loading ? <div className="panel-loading">Loading library…</div> : filtered.length ? filtered.map(article => <button key={article.id} className={selected?.id === article.id ? "active" : ""} onClick={() => setSelected(article)}><span><small>{article.category}</small>{article.title}</span><ArrowRight/></button>) : <div className="real-empty compact-empty"><Search/><strong>No approved match</strong><p>Try a broader search or submit the question.</p></div>}<span className="list-label history-label">Your recent questions</span><div className="question-history">{history.slice(0, 5).map(item => <button key={item.id} onClick={() => setSelected(articles.find(article => article.id === item.matched_article_id) || null)}><Clock3/><span>{item.question}<small>{item.status} · {new Date(item.created_at).toLocaleDateString()}</small></span></button>)}</div></aside>
      <section className="assistant-conversation"><div className="assistant-status"><span><Bot/>MĪZĀN Knowledge Assistant</span><b><i/>Approved records only</b></div>{selected ? <><div className="user-bubble">{selected.title}</div><article className="assistant-answer"><span><Sparkles/>Preliminary guidance note</span><h3>{selected.title}</h3><p>{selected.summary}</p>{selected.follow_up_questions.length > 0 && <div className="followup-box"><strong>Clarify before applying this:</strong>{selected.follow_up_questions.map(item => <p key={item}>• {item}</p>)}</div>}<SourceNote><strong>{selected.source_label}:</strong> {selected.source_reference}</SourceNote><div className="answer-meta"><span><BadgeCheck/> Madhhab profile: {profile.madhhab}</span><span><ShieldCheck/> {selected.confidence_label}</span></div></article><ScholarNotice compact/></> : <div className="real-empty assistant-empty"><Bot/><strong>No article selected</strong><p>Search the approved library or submit a new question. Unsupported answers are not generated.</p></div>}
        <form className="ask-bar enhanced-ask" onSubmit={ask}><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} placeholder="Ask a modern question…"/><button aria-label="Submit question" disabled={sending || !question.trim()}><Send/></button></form>{message && <div className="assistant-message"><ShieldCheck/>{message}</div>}</section></div>
  </AppShell>;
}
