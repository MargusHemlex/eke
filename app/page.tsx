"use client";

import { useState } from "react";
import Link from "next/link";

interface ErrorCard {
  original: string;
  corrected: string;
  rule: string;
  ruleLink?: string;
  explanation: string;
}

interface CorrectionResult {
  correctedText: string;
  errors: ErrorCard[];
}

const MAX_CHARS = 5000;

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) setInputText(val);
  };

  const handleCorrect = async () => {
    if (!inputText.trim() || loading) return;
    setLoading(true);
    setApiError(null);
    setResult(null);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API viga");
      setResult(data);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Viga. Proovi uuesti.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleCorrect();
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setApiError(null);
  };

  const pct = Math.round((inputText.length / MAX_CHARS) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex flex-col">

      {/* ── Nav ── */}
      <nav className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">EKI Õigekiri</span>
            <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-[10px] text-zinc-400 font-medium">
              63 reeglit
            </span>
          </div>

          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group"
          >
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            EKI reeglid
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="shrink-0 text-center px-4 pt-10 pb-6 sm:pt-14 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Eesti keele õigekirja parandaja
        </h1>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Tugineb EKI ametlikele põhireeglitele. Sisesta tekst ja saa kohene tagasiside.
        </p>
      </div>

      {/* ── Main grid ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start">

          {/* ─── LEFT: Input panel ─── */}
          <div className="flex flex-col gap-3">
            <div className="relative rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden focus-within:border-white/20 focus-within:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-200">
              <textarea
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Kirjuta siia oma tekst…"
                spellCheck={false}
                autoComplete="off"
                className="w-full h-56 sm:h-64 lg:h-80 p-5 font-serif text-base leading-relaxed bg-transparent text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />

              {/* Bottom bar inside card */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  {/* Character progress */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-white/40 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-600 tabular-nums">
                      {inputText.length}/{MAX_CHARS}
                    </span>
                  </div>
                  {inputText && (
                    <button
                      onClick={handleClear}
                      className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      Tühjenda
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-700 hidden sm:block">⌘↵ parandamiseks</span>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={handleCorrect}
              disabled={loading || !inputText.trim()}
              className="relative w-full py-3.5 rounded-xl bg-white text-black text-sm font-semibold tracking-tight hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-150 overflow-hidden group"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <SpinnerIcon />
                  Parandan…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Paranda kohe
                </span>
              )}
            </button>
          </div>

          {/* ─── RIGHT: Results panel ─── */}
          <div className="flex flex-col gap-4 min-h-[200px]">

            {/* Error banner */}
            {apiError && (
              <div className="fade-in flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-sm text-red-300">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {apiError}
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="flex flex-col gap-3 fade-in">
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-28 w-full" />
                <div className="skeleton h-4 w-24 mt-2" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="fade-in flex flex-col gap-4">

                {/* Corrected text */}
                <div className="rounded-2xl bg-[#111111] border border-white/[0.08] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Parandatud tekst
                    </span>
                    {result.errors.length === 0 && (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Vigu ei leitud
                      </span>
                    )}
                  </div>
                  <p className="p-5 font-serif text-base leading-relaxed text-zinc-200 whitespace-pre-wrap">
                    {result.correctedText}
                  </p>
                </div>

                {/* Error cards */}
                {result.errors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs font-medium text-zinc-400">Vead</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-zinc-500 font-medium tabular-nums">
                        {result.errors.length}
                      </span>
                    </div>
                    {result.errors.map((err, i) => (
                      <ErrorCard key={i} error={err} index={i} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !apiError && (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-600 text-center max-w-[160px] leading-relaxed">
                  Sisesta tekst ja klõpsa „Paranda kohe"
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-white/[0.05] px-4 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-700">
          <span>Tugineb EKI ametlikele õigekirja põhireeglitele</span>
          <a
            href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors"
          >
            teatmik.eki.ee ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function ErrorCard({ error, index }: { error: ErrorCard; index: number }) {
  return (
    <div className="card-hover rounded-xl bg-[#111111] border border-white/[0.07] p-4 group">
      {/* Before → After */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-md bg-red-950/60 border border-red-800/30 text-xs font-mono text-red-400 line-through decoration-red-600">
          {error.original}
        </span>
        <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/30 text-xs font-mono text-emerald-400 font-semibold">
          {error.corrected}
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-zinc-400 leading-relaxed mb-3">
        {error.explanation}
      </p>

      {/* Rule */}
      {error.rule && (
        <div className="flex items-center gap-1.5 pt-3 border-t border-white/[0.05]">
          <svg className="w-3 h-3 text-zinc-700 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {error.ruleLink ? (
            <a
              href={error.ruleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors truncate"
            >
              {error.rule}
            </a>
          ) : (
            <span className="text-[10px] text-zinc-600 truncate">{error.rule}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
