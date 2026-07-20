import type { CaseRecord } from "./models";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function renderObject(value: unknown): string {
  if (Array.isArray(value)) return `<ol>${value.map(item => `<li>${typeof item === "object" ? renderObject(item) : escapeHtml(item)}</li>`).join("")}</ol>`;
  if (value && typeof value === "object") return `<dl>${Object.entries(value as Record<string, unknown>).map(([key, item]) => `<div><dt>${escapeHtml(key.replaceAll("_", " "))}</dt><dd>${typeof item === "object" ? renderObject(item) : escapeHtml(item)}</dd></div>`).join("")}</dl>`;
  return escapeHtml(value);
}

export function downloadCaseReport(record: CaseRecord) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(record.title)} — MĪZĀN</title><style>body{font-family:Arial,sans-serif;color:#142431;max-width:900px;margin:40px auto;padding:0 24px}header{border-bottom:3px solid #1ca58d;padding-bottom:20px}h1{margin-bottom:6px}small{color:#607080}section{margin:28px 0}dl>div{display:grid;grid-template-columns:230px 1fr;border-bottom:1px solid #dbe4e8;padding:9px 0}dt{text-transform:capitalize;font-weight:700}dd{margin:0}ol{margin:4px 0}.notice{background:#edf8f5;border:1px solid #9cd8ca;padding:14px;border-radius:8px}</style></head><body><header><strong>MĪZĀN</strong><h1>${escapeHtml(record.title)}</h1><small>${escapeHtml(record.case_type.toUpperCase())} · ${escapeHtml(record.madhhab)} · ${new Date(record.created_at).toLocaleString()}</small></header><section><h2>Calculation inputs</h2>${renderObject(record.input_data)}</section><section><h2>Preliminary result</h2>${renderObject(record.result_data)}</section><section class="notice"><strong>Verification status: ${escapeHtml(record.verification_status)}</strong><p>This report is an educational calculation record. Complex or disputed matters should be verified by a qualified scholar before action.</p></section></body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${record.case_type}-${record.id.slice(0, 8)}-mizan-report.html`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
