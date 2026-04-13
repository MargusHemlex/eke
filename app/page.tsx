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

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 5000;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setInputText(val);
      setCharCount(val.length);
    }
  };

  const handleCorrect = async () => {
    if (!inputText.trim() || loading) return;

    setLoading(true);
    setApiError(null);
    setResult(null);

    try {
      const response = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "API viga");
      }

      setResult(data);
    } catch (err: unknown) {
      setApiError(
        err instanceof Error ? err.message : "Viga teksti parandamisel. Proovi uuesti."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleCorrect();
    }
  };

  const handleClear = () => {
    setInputText("");
    setCharCount(0);
    setResult(null);
    setApiError(null);
  };

  const hasErrors = result && result.errors.length > 0;
  const isClean = result && result.errors.length === 0;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 whitespace-nowrap">
              Eesti keele õigekirja abivahend
            </h1>
            <span className="hidden sm:inline text-xs text-zinc-400">
              EKI põhireeglid · 63 reeglit
            </span>
          </div>
          <Link
            href="/docs"
            className="shrink-0 text-xs text-zinc-400 hover:text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
          >
            Vaata EKI reegleid
          </Link>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 lg:items-start">

          {/* ── Left column: Input ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-text"
                className="text-xs font-medium text-zinc-500 uppercase tracking-widest"
              >
                Sisesta tekst
              </label>
              {inputText && (
                <button
                  onClick={handleClear}
                  className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Tühjenda
                </button>
              )}
            </div>

            <textarea
              id="input-text"
              value={inputText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Kirjuta siia oma tekst. Vajuta ⌘↵ parandamiseks..."
              spellCheck={false}
              autoComplete="off"
              className="w-full h-64 sm:h-72 lg:h-96 p-4 font-serif text-base leading-relaxed border border-zinc-300 rounded-none resize-none focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 placeholder:text-zinc-300 bg-white transition-colors"
            />

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-zinc-400 tabular-nums">
                {charCount}/{MAX_CHARS}
              </span>
              <button
                onClick={handleCorrect}
                disabled={loading || !inputText.trim()}
                className="flex-1 lg:flex-none lg:w-40 py-3 px-6 bg-zinc-900 text-white text-sm font-medium tracking-wide rounded-none hover:bg-zinc-700 active:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingDots />
                    Parandan
                  </span>
                ) : (
                  "Paranda kohe"
                )}
              </button>
            </div>
          </div>

          {/* ── Right column: Results ── */}
          <div className="flex flex-col gap-4">

            {/* API error */}
            {apiError && (
              <div className="p-4 border border-zinc-300 bg-zinc-50 text-sm text-zinc-700">
                {apiError}
              </div>
            )}

            {/* Loading state placeholder */}
            {loading && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32" />
                <Skeleton className="h-4 w-20 mt-4" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <>
                {/* Corrected text block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                      Parandatud tekst
                    </span>
                    {isClean && (
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Vigu ei leitud
                      </span>
                    )}
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-200 font-serif text-base leading-relaxed min-h-24 text-zinc-800 whitespace-pre-wrap">
                    {result.correctedText}
                  </div>
                </div>

                {/* Error cards */}
                {hasErrors && (
                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">
                        Vead
                      </span>
                      <span className="text-xs text-zinc-400">
                        {result.errors.length} leitud
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {result.errors.map((err, i) => (
                        <ErrorCard key={i} error={err} index={i} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!result && !loading && !apiError && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-2 border border-dashed border-zinc-200 bg-zinc-50/50">
                <PencilIcon />
                <p className="text-xs text-zinc-400">
                  Parandus ilmub siia
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 mt-16 px-4 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <span>Tugineb EKI ametlikele õigekirja põhireeglitele</span>
          <a
            href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline underline-offset-2 transition-colors"
          >
            teatmik.eki.ee
          </a>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function ErrorCard({ error, index }: { error: ErrorCard; index: number }) {
  return (
    <div className="border border-zinc-200 bg-white p-3 group hover:border-zinc-400 transition-colors">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
        <span className="text-xs font-mono text-zinc-400 tabular-nums">
          #{index + 1}
        </span>
        <span className="text-xs font-mono text-zinc-500 line-through decoration-zinc-400">
          {error.original}
        </span>
        <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
        </svg>
        <span className="text-xs font-mono font-semibold text-zinc-900">
          {error.corrected}
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-zinc-600 leading-relaxed mb-2">
        {error.explanation}
      </p>

      {/* Rule link */}
      {error.rule && (
        <div className="pt-2 border-t border-zinc-100">
          {error.ruleLink ? (
            <a
              href={error.ruleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
            >
              {error.rule}
            </a>
          ) : (
            <span className="text-xs text-zinc-400">{error.rule}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-100 rounded-none ${className ?? ""}`} />
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 bg-white rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

function PencilIcon() {
  return (
    <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}
