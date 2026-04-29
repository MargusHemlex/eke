"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { validateEstonianInput, type ValidationResult } from "@/lib/validateInput";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

type Mode = "grammar" | "sentence" | "content";

interface GrammarError {
  original: string;
  corrected: string;
  rule: string;
  ruleLink?: string;
  explanation: string;
}

interface SentenceSuggestion {
  original: string;
  suggestion: string;
  type: string;
  explanation: string;
}

interface ContentSuggestion {
  category: string;
  priority: "kõrge" | "keskmine" | "madal";
  feedback: string;
  suggestion: string;
}

interface ApiResult {
  valid?: boolean;
  reason?: string;
  correctedText: string;
  errors: GrammarError[];
  sentenceSuggestions: SentenceSuggestion[];
  contentSuggestions: ContentSuggestion[];
}

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

const MAX_CHARS = 5000;

// 9. klassi tasemele sobivad näidislaused (kõik sisaldavad mõnda õigekirja-/grammatikaviga
// — annavad kasutajale mõtte, mida parandust vajav lause välja näeb).
const NAIDISLAUSED = [
  "Eile käisin kontserdil mis oli väga huvitav.",
  "Õpilased räägivad, et eksamid on rasked aga vajalikud.",
  "Suvi on minu lemmik aastaaeg sest siis on soe ilm.",
  "Kui ma olin laps, mängisime sõpradega palju õues.",
  "Ema küsis, kas ma olen kodutööd teinud aga ma polnud.",
  "Kooliraamatukogus on palju huvitavaid raamatuid eesti kirjandusest.",
  "Klassikaaslased aitavad mind, kui ma midagi ei mõista.",
  "Tänapäeval kasutavad noored palju nutitelefoni ja internetti.",
];

const MODES: { id: Mode; label: string; shortLabel: string; description: string }[] = [
  {
    id: "grammar",
    label: "Paranda õigekeelsus",
    shortLabel: "Õigekiri",
    description: "EKI ametlikud õigekirjareeglid",
  },
  {
    id: "sentence",
    label: "Lauseehitus ja stiil",
    shortLabel: "Lauseehitus",
    description: "V2, sidendid, lausevaheldus, aktiiv/passiiv",
  },
  {
    id: "content",
    label: "Sisu loomine",
    shortLabel: "Sisu",
    description: "Arutlev kirjand, argumendid, struktuur",
  },
];

const TYPE_LABELS: Record<string, string> = {
  V2: "V2 reegel",
  lausepikkus: "Lausepikkus",
  "aktiiv-passiiv": "Aktiiv/Passiiv",
  sidend: "Sidend",
  kordus: "Kordus",
  lausealgus: "Lausealgus",
  järjekord: "Sõnajärg",
};

const CATEGORY_LABELS: Record<string, string> = {
  struktuur: "Struktuur",
  argument: "Argument",
  näide: "Näide",
  seiskoht: "Seisukoht",
  "punane-joon": "Punane joon",
  kokkuvõte: "Kokkuvõte",
  sissejuhatus: "Sissejuhatus",
};

// ─────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<Mode>("grammar");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<Mode | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationTouched, setValidationTouched] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Frontendi heuristiline valideerimine — AINULT grammar režiimis.
  // Sentence/content režiimid jätame puutumata (nõuavad pikemaid tekste, oma loogikaga).
  const validation: ValidationResult =
    mode === "grammar" ? validateEstonianInput(inputText) : { ok: true };
  const showValidation =
    mode === "grammar" &&
    validationTouched &&
    inputText.trim().length > 0 &&
    !validation.ok;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setInputText(e.target.value);
      if (!validationTouched) setValidationTouched(true);
    }
  };

  const handleModeChange = (newMode: Mode) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMode(newMode);
    setResult(null);
    setApiError(null);
    setLoading(false);
    setLoadingMode(null);
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || loading) return;

    // Eelvalideerimine ainult grammar režiimis — ära saada API-sse, kui sisend on selgelt vigane.
    if (mode === "grammar") {
      const v = validateEstonianInput(inputText);
      if (!v.ok) {
        setValidationTouched(true);
        return;
      }
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    setLoading(true);
    setLoadingMode(mode);
    setApiError(null);
    setResult(null);

    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, mode }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "API viga");
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Päring katkestati (abort).");
        return;
      }
      const isTimeout = err instanceof Error && err.message.includes("abort");
      setApiError(
        isTimeout
          ? "Päring aegus (30 s). Proovi uuesti."
          : err instanceof Error
          ? err.message
          : "Viga. Proovi uuesti."
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setLoadingMode(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
  };

  const handleClear = () => {
    setInputText("");
    setResult(null);
    setApiError(null);
    setValidationTouched(false);
  };

  const handleAnnaNaide = () => {
    const juhuslik = NAIDISLAUSED[Math.floor(Math.random() * NAIDISLAUSED.length)];
    setInputText(juhuslik);
    setResult(null);
    setApiError(null);
    setValidationTouched(true);
  };

  const pct = Math.round((inputText.length / MAX_CHARS) * 100);
  const currentMode = MODES.find((m) => m.id === mode)!;

  const buttonLabel = {
    grammar: "Paranda kohe",
    sentence: "Analüüsi lauseehitust",
    content: "Analüüsi sisu",
  }[mode];

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-zinc-900 flex flex-col">

      {/* ══════════════════════════════════
          NAV — logo + EKI reeglid link
          ══════════════════════════════════ */}
      <nav className="shrink-0 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28" className="shrink-0">
              <rect width="32" height="32" rx="8" fill="#111110"/>
              <path d="M16 5 C16 5 17.1 11.2 19.5 13.5 C21.8 15.8 28 16 28 16 C28 16 21.8 16.2 19.5 18.5 C17.2 20.8 16 27 16 27 C16 27 14.8 20.8 12.5 18.5 C10.2 16.2 4 16 4 16 C4 16 10.2 15.8 12.5 13.5 C14.8 11.2 16 5 16 5Z" fill="white"/>
              <circle cx="24" cy="8" r="1.8" fill="white" opacity="0.5"/>
            </svg>
            <span className="text-sm font-semibold text-zinc-900 tracking-tight">EKE Kirjutamise abiline</span>
          </div>
          <Link href="/docs" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            EKI reeglid
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════
          HERO
          ══════════════════════════════════ */}
      <div className="shrink-0 px-4 sm:px-6 pt-6 pb-4 sm:pt-8 sm:pb-5 max-w-5xl mx-auto w-full">
        <p className="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight">
          Tere, Margareth! 👋
        </p>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-lg leading-relaxed">
          See abivahend aitab sul valmistuda Eesti keele lõpueksamiks.
          Sisesta tekst ja saa kiiret tagasisidet õigekirja, lauseehituse ja sisu kohta.
        </p>
      </div>

      {/* ══════════════════════════════════
          MODE SELECTOR
          Mobiil: 3 nuppu vertikaalselt stackitud täislaiusega
          Desktop: horisontaalne rida
          ══════════════════════════════════ */}
      <div className="shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          {/* Mobiil: grid 1 veerg → sm: 3 veergu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`flex items-start sm:items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150
                  ${mode === m.id
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-sm"
                    : "bg-[#f9f9f8] border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                  }`}
              >
                <ModeIcon id={m.id} active={mode === m.id} />
                <div className="min-w-0">
                  <div className={`text-xs font-semibold leading-tight ${mode === m.id ? "text-white" : "text-zinc-800"}`}>
                    {m.label}
                  </div>
                  <div className={`text-[10px] leading-tight mt-0.5 ${mode === m.id ? "text-zinc-300" : "text-zinc-400"}`}>
                    {m.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN GRID
          Mobiil: 1 veerg (sisend üleval)
          lg: 2 veergu kõrvuti
          ══════════════════════════════════ */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 lg:items-start">

          {/* ── Sisend ── */}
          <div className="flex flex-col gap-3">
            <div className={`relative bg-white rounded-2xl border shadow-sm overflow-hidden
                            focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]
                            transition-all duration-200
                            ${showValidation
                              ? "border-amber-300 focus-within:border-amber-400"
                              : "border-zinc-200 focus-within:border-zinc-400"}`}>
              {/* Tühjenda X-nupp paremas ülanurgas */}
              {inputText && (
                <button
                  onClick={handleClear}
                  aria-label="Tühjenda tekst"
                  title="Tühjenda"
                  className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg flex items-center justify-center
                             text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100
                             transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <textarea
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "grammar"
                    ? "Kirjuta siia oma tekst õigekirja kontrolliks…"
                    : mode === "sentence"
                    ? "Kirjuta siia tekst lauseehituse analüüsiks…"
                    : "Kirjuta siia oma arutlev tekst (400+ sõna soovituslik)…"
                }
                spellCheck={false}
                autoComplete="off"
                className="w-full h-48 sm:h-60 lg:h-72 p-4 sm:p-5 pr-12 font-serif text-base leading-relaxed bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1 rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full rounded-full bg-zinc-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-400 tabular-nums">{inputText.length}/{MAX_CHARS}</span>
                  {mode === "grammar" && (
                    <button
                      onClick={handleAnnaNaide}
                      type="button"
                      className="ml-1 px-2 py-0.5 rounded-md border border-zinc-300 text-[10px] text-zinc-600
                                 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400
                                 active:bg-zinc-200 transition-colors duration-150"
                    >
                      Anna mulle näide
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 hidden sm:block">⌘↵</span>
              </div>
            </div>

            {/* Valideerimise hoiatus — kollane (grammar režiim) */}
            {showValidation && !validation.ok && (
              <div
                role="alert"
                className="fade-in flex items-start gap-2.5 p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm leading-relaxed
                           bg-amber-50 border-amber-200 text-amber-800"
              >
                <svg
                  className="w-4 h-4 mt-0.5 shrink-0 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{validation.message}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !inputText.trim() || !validation.ok}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-zinc-900 text-white text-sm font-semibold
                         hover:bg-zinc-800 active:bg-black
                         disabled:opacity-30 disabled:cursor-not-allowed
                         shadow-sm hover:shadow-md transition-all duration-150"
            >
              {loading && loadingMode === mode ? (
                <span className="flex items-center justify-center gap-2"><SpinnerIcon />Analüüsin…</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {buttonLabel}
                </span>
              )}
            </button>
          </div>

          {/* ── Tulemused ── */}
          <div className="flex flex-col gap-3">

            {/* Veateade */}
            {apiError && (
              <div className="fade-in flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                </svg>
                {apiError}
              </div>
            )}

            {/* Skeleton */}
            {loading && (
              <div className="flex flex-col gap-3 fade-in">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-28 w-full" />
                <div className="skeleton h-3 w-24 mt-1" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-16 w-full" />
              </div>
            )}

            {/* Grammar results */}
            {result && !loading && mode === "grammar" && (
              <GrammarResults result={result} />
            )}

            {/* Sentence results */}
            {result && !loading && mode === "sentence" && (
              <SentenceResults result={result} />
            )}

            {/* Content results */}
            {result && !loading && mode === "content" && (
              <ContentResults result={result} />
            )}

            {/* Tühi olek */}
            {!result && !loading && !apiError && (
              <div className="flex flex-col items-center justify-center py-14 sm:py-16 gap-3
                              rounded-2xl border border-dashed border-zinc-200 bg-white/50">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <ModeIcon id={mode} active={false} size="lg" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-zinc-500">{currentMode.label}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{currentMode.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════ FOOTER ══════════════════════════════════ */}
      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-zinc-400">
          <span>Tugineb EKI ametlikele õigekirja põhireeglitele ja riigieksami nõuetele</span>
          <a href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/" target="_blank" rel="noopener noreferrer"
             className="hover:text-zinc-700 transition-colors">
            teatmik.eki.ee ↗
          </a>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────
// RESULT SECTIONS
// ─────────────────────────────────────────

function GrammarResults({ result }: { result: ApiResult }) {
  // Backend tagastas valid: false → kollane hoiatus (Claude tuvastas gibberish'i)
  if (result.valid === false) {
    return (
      <div
        role="alert"
        className="fade-in flex items-start gap-2.5 p-3 sm:p-4 rounded-xl border text-xs sm:text-sm leading-relaxed
                   bg-amber-50 border-amber-200 text-amber-800"
      >
        <svg
          className="w-4 h-4 mt-0.5 shrink-0 text-amber-500"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {result.reason ||
            "Sisend ei näi olevat eesti keelne tekst. Proovi kirjutada üks päris lause."}
        </span>
      </div>
    );
  }

  // 4-värvi loogika päises:
  //   🟢 emerald  — vigu ei leitud
  //   🔵 blue     — leitud parandused
  const hasErrors = result.errors.length > 0;
  const dotColor = hasErrors ? "bg-blue-500" : "bg-emerald-500";

  return (
    <div className="fade-in flex flex-col gap-3">
      {/* Parandatud tekst */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
          <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${dotColor}`} />
            Parandatud tekst
          </span>
          {!hasErrors ? (
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Vigu ei leitud
            </span>
          ) : (
            <span className="text-[10px] text-blue-600 font-medium tabular-nums">
              {result.errors.length} {result.errors.length === 1 ? "parandus" : "parandust"}
            </span>
          )}
        </div>
        <p className="p-4 sm:p-5 font-serif text-base leading-relaxed text-zinc-800 whitespace-pre-wrap">
          {result.correctedText}
        </p>
      </div>

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader label="Leitud vead" count={result.errors.length} />
          {result.errors.map((err, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3.5
                                    hover:border-zinc-300 hover:shadow-md transition-all duration-150">
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-xs font-mono text-red-600 line-through decoration-red-400">
                  {err.original}
                </span>
                <ArrowIcon />
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-700 font-semibold">
                  {err.corrected}
                </span>
                <span className="ml-auto text-[10px] text-zinc-400 tabular-nums shrink-0">#{i + 1}</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">{err.explanation}</p>
              {err.rule && (
                <div className="flex items-center gap-1.5 pt-2.5 border-t border-zinc-100">
                  <LinkIcon />
                  {err.ruleLink ? (
                    <a href={err.ruleLink} target="_blank" rel="noopener noreferrer"
                       className="text-[10px] text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors truncate">
                      {err.rule}
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-500 truncate">{err.rule}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentenceResults({ result }: { result: ApiResult }) {
  return (
    <div className="fade-in flex flex-col gap-3">
      {/* Parandatud tekst */}
      {result.correctedText && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
            <span className="text-xs font-medium text-zinc-600 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
              Täiustatud tekst
            </span>
          </div>
          <p className="p-4 sm:p-5 font-serif text-base leading-relaxed text-zinc-800 whitespace-pre-wrap">
            {result.correctedText}
          </p>
        </div>
      )}

      {result.sentenceSuggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionHeader label="Lauseehituse soovitused" count={result.sentenceSuggestions.length} />
          {result.sentenceSuggestions.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3.5
                                    hover:border-zinc-300 hover:shadow-md transition-all duration-150">
              {/* Type badge */}
              <div className="flex items-center justify-between mb-2.5 gap-2">
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-semibold text-zinc-600 uppercase tracking-wide shrink-0">
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
                <span className="text-[10px] text-zinc-400 tabular-nums">#{i + 1}</span>
              </div>
              {/* Before → After */}
              {s.original && (
                <div className="flex flex-col gap-1.5 mb-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-zinc-400 font-medium w-12 shrink-0 mt-0.5">Enne</span>
                    <span className="text-xs font-serif text-zinc-500 italic leading-relaxed">{s.original}</span>
                  </div>
                  <div className="h-px bg-zinc-200" />
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-zinc-400 font-medium w-12 shrink-0 mt-0.5">Pärast</span>
                    <span className="text-xs font-serif text-zinc-800 font-medium leading-relaxed">{s.suggestion}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-zinc-600 leading-relaxed">{s.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {result.sentenceSuggestions.length === 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Lauseehitus on hea — olulisi probleeme ei leitud.
        </div>
      )}
    </div>
  );
}

function ContentResults({ result }: { result: ApiResult }) {
  const byPriority = (a: ContentSuggestion, b: ContentSuggestion) => {
    const order = { kõrge: 0, keskmine: 1, madal: 2 };
    return order[a.priority] - order[b.priority];
  };

  const sorted = [...result.contentSuggestions].sort(byPriority);

  const priorityStyles = {
    kõrge: {
      dot: "bg-red-500",
      badge: "bg-red-50 border-red-200 text-red-700",
      label: "Kõrge prioriteet",
    },
    keskmine: {
      dot: "bg-amber-500",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
      label: "Keskmine",
    },
    madal: {
      dot: "bg-zinc-400",
      badge: "bg-zinc-100 border-zinc-200 text-zinc-600",
      label: "Madal",
    },
  };

  return (
    <div className="fade-in flex flex-col gap-3">
      {sorted.length > 0 ? (
        <>
          <SectionHeader label="Sisu tagasiside" count={sorted.length} />
          {sorted.map((s, i) => {
            const style = priorityStyles[s.priority] ?? priorityStyles.madal;
            return (
              <div key={i} className="bg-white rounded-xl border border-zinc-200 shadow-sm p-3.5
                                      hover:border-zinc-300 hover:shadow-md transition-all duration-150">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style.badge}`}>
                    {CATEGORY_LABELS[s.category] ?? s.category}
                  </span>
                  <span className={`flex items-center gap-1 text-[10px] font-medium ml-auto ${style.badge.split(" ")[2]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </div>
                {/* Feedback */}
                <p className="text-xs text-zinc-600 leading-relaxed mb-2.5">
                  {s.feedback}
                </p>
                {/* Suggestion */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                  <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-xs text-zinc-700 leading-relaxed font-medium">{s.suggestion}</p>
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Teksti ülesehitus on hea — olulisi sisuvigu ei leitud.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="text-xs font-semibold text-zinc-700">{label}</span>
      <span className="px-1.5 py-0.5 rounded-full bg-zinc-900 text-[10px] text-white font-semibold tabular-nums">
        {count}
      </span>
    </div>
  );
}

function ModeIcon({ id, active, size = "sm" }: { id: Mode; active: boolean; size?: "sm" | "lg" }) {
  const cls = `shrink-0 ${size === "lg" ? "w-5 h-5" : "w-4 h-4"} ${active ? "text-white" : "text-zinc-500"}`;
  if (id === "grammar") return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (id === "sentence") return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  );
  return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
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
