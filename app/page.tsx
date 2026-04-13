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
    /* ── bg-[#f9f9f8]: soe off-white, nagu Claude/Notion ── */
    <div className="min-h-screen bg-[#f9f9f8] text-zinc-900 flex flex-col">

      {/* ════════════════════════════════
          NAV — sticky, valge, õhuke border
          Mobile: kompaktne logo + link
          ════════════════════════════════ */}
      <nav className="shrink-0 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">EKI Õigekiri</span>
            {/* Badge — peidetud mobiilis */}
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] text-zinc-500 font-medium">
              63 reeglit
            </span>
          </div>

          {/* Link */}
          <Link
            href="/docs"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>EKI reeglid</span>
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════
          HERO — keskendatud, väiksem mobiilis
          ════════════════════════════════ */}
      <div className="shrink-0 text-center px-4 pt-8 pb-5 sm:pt-12 sm:pb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight mb-2">
          Eesti keele õigekirja parandaja
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-sm sm:max-w-md mx-auto leading-relaxed">
          Tugineb EKI ametlikele põhireeglitele. Sisesta tekst ja saa kohene tagasiside.
        </p>
      </div>

      {/* ════════════════════════════════
          MAIN GRID
          Mobiil:  1 veerg — sisend üleval, tulemused all
          Desktop: 2 veergu kõrvuti (lg:)
          ════════════════════════════════ */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start">

          {/* ─── VEERG 1: Sisend ─── */}
          <div className="flex flex-col gap-3">

            {/* Tekstikast */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden
                            focus-within:border-zinc-400 focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]
                            transition-all duration-200">
              <textarea
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Kirjuta siia oma tekst…"
                spellCheck={false}
                autoComplete="off"
                /* Mobiil: h-48, sm: h-60, lg: h-72 */
                className="w-full h-48 sm:h-60 lg:h-72 p-4 sm:p-5 font-serif text-base leading-relaxed bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              {/* Põhjapaneel */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-3">
                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1 rounded-full bg-zinc-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-500 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 tabular-nums">
                      {inputText.length}/{MAX_CHARS}
                    </span>
                  </div>
                  {inputText && (
                    <button
                      onClick={handleClear}
                      className="text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors"
                    >
                      Tühjenda
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 hidden sm:block">⌘↵</span>
              </div>
            </div>

            {/* Nupp — täislaius mobiilis */}
            <button
              onClick={handleCorrect}
              disabled={loading || !inputText.trim()}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold
                         hover:bg-zinc-800 active:bg-black
                         disabled:opacity-30 disabled:cursor-not-allowed
                         shadow-sm hover:shadow-md
                         transition-all duration-150"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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

          {/* ─── VEERG 2: Tulemused ─── */}
          <div className="flex flex-col gap-3">

            {/* Veateade */}
            {apiError && (
              <div className="fade-in flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 shadow-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {apiError}
              </div>
            )}

            {/* Skeleton — laadimise ajal */}
            {loading && (
              <div className="flex flex-col gap-3 fade-in">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-28 w-full" />
                <div className="skeleton h-3 w-20 mt-1" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            )}

            {/* Tulemused */}
            {result && !loading && (
              <div className="fade-in flex flex-col gap-3">

                {/* Parandatud tekst */}
                <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
                    <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Parandatud tekst
                    </span>
                    {result.errors.length === 0 && (
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Vigu ei leitud
                      </span>
                    )}
                  </div>
                  <p className="p-4 sm:p-5 font-serif text-base leading-relaxed text-zinc-800 whitespace-pre-wrap">
                    {result.correctedText}
                  </p>
                </div>

                {/* Veakaardid */}
                {result.errors.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1 pt-1">
                      <span className="text-xs font-semibold text-zinc-700">Leitud vead</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-zinc-900 text-[10px] text-white font-semibold tabular-nums">
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

            {/* Tühi olek */}
            {!result && !loading && !apiError && (
              <div className="flex flex-col items-center justify-center py-14 sm:py-16 gap-3
                              rounded-2xl border border-dashed border-zinc-200 bg-white/50">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <p className="text-xs text-zinc-400 text-center leading-relaxed">
                  Parandus ilmub siia
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ════════════════════════════════ FOOTER ════════════════════════════════ */}
      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-zinc-400">
          <span>Tugineb EKI ametlikele õigekirja põhireeglitele</span>
          <a
            href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 transition-colors"
          >
            teatmik.eki.ee ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════
   VEAKAART
   ═══════════════════════════════════ */
function ErrorCard({ error, index }: { error: ErrorCard; index: number }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3.5
                    hover:border-zinc-300 hover:shadow-md transition-all duration-150">
      {/* Vale → Õige */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
        <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-xs font-mono text-red-600 line-through decoration-red-400">
          {error.original}
        </span>
        <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 font-semibold">
          {error.corrected}
        </span>
        <span className="ml-auto text-[10px] text-zinc-400 tabular-nums shrink-0">#{index + 1}</span>
      </div>

      {/* Selgitus */}
      <p className="text-xs text-zinc-600 leading-relaxed mb-3">
        {error.explanation}
      </p>

      {/* Reegel */}
      {error.rule && (
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-zinc-100">
          <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          {error.ruleLink ? (
            <a href={error.ruleLink} target="_blank" rel="noopener noreferrer"
               className="text-[10px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors truncate">
              {error.rule}
            </a>
          ) : (
            <span className="text-[10px] text-zinc-500 truncate">{error.rule}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
