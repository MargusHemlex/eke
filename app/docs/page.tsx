import fs from "fs";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EKI Õigekirja Põhireeglid",
  description: "Eesti Keele Instituudi ametlikud õigekirja põhireeglid eksamiks valmistujale.",
};

export default function DocsPage() {
  const docsPath = path.join(process.cwd(), "docs", "eki-pohireeglid.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="min-h-screen bg-[#f9f9f8] text-zinc-900 flex flex-col">

      <nav className="shrink-0 sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors group">
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tagasi
          </Link>
          <span className="text-xs font-medium text-zinc-500">EKI Põhireeglid</span>
          <a href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/" target="_blank" rel="noopener noreferrer"
             className="text-xs text-zinc-400 hover:text-zinc-900 transition-colors">
            teatmik.eki.ee ↗
          </a>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <article className="
          prose prose-zinc prose-sm sm:prose-base max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-900
          prose-h1:text-2xl prose-h1:border-b prose-h1:border-zinc-200 prose-h1:pb-4
          prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3
          prose-h3:text-base prose-h3:text-zinc-700
          prose-p:text-zinc-600 prose-p:leading-relaxed
          prose-a:text-zinc-900 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-zinc-300 hover:prose-a:decoration-zinc-600
          prose-strong:text-zinc-900
          prose-code:text-zinc-800 prose-code:bg-zinc-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:border prose-code:border-zinc-200
          prose-blockquote:border-l-2 prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-500 prose-blockquote:not-italic prose-blockquote:bg-zinc-50 prose-blockquote:rounded-r-lg prose-blockquote:py-1
          prose-ul:text-zinc-600 prose-ol:text-zinc-600
          prose-li:marker:text-zinc-400
          prose-hr:border-zinc-200
          prose-table:text-sm prose-thead:border-zinc-300 prose-tbody:divide-zinc-100
          prose-th:text-zinc-800 prose-th:font-semibold prose-td:text-zinc-600
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </main>

      <footer className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-zinc-400">
          <span>Allikas: Eesti Keele Instituut. Täielik versioon on alati EKI teatmikus.</span>
          <a href="https://eki.ee/wp-content/uploads/2025/08/Eesti-keele-oigekirja-pohireeglid.pdf" target="_blank" rel="noopener noreferrer"
             className="hover:text-zinc-700 transition-colors whitespace-nowrap">
            Laadi alla PDF ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
