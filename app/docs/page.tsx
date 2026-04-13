import fs from "fs";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EKI Õigekirja Põhireeglid",
  description:
    "Eesti Keele Instituudi ametlikud õigekirja põhireeglid. 63 reeglit koos selgituste ja näidetega.",
};

export default function DocsPage() {
  const docsPath = path.join(process.cwd(), "docs", "eki-pohireeglid.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tagasi rakendusse
          </Link>
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
            EKI Reeglid
          </span>
          <a
            href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-900 underline underline-offset-2 transition-colors"
          >
            teatmik.eki.ee ↗
          </a>
        </div>
      </header>

      {/* Markdown content */}
      <main className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
        <article className="prose prose-zinc prose-sm sm:prose-base max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-2xl prose-h1:border-b prose-h1:border-zinc-200 prose-h1:pb-4
          prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3
          prose-h3:text-base prose-h3:text-zinc-700
          prose-p:text-zinc-700 prose-p:leading-relaxed
          prose-a:text-zinc-900 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-zinc-400
          prose-strong:text-zinc-900 prose-strong:font-semibold
          prose-code:text-zinc-800 prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-none prose-code:text-xs prose-code:font-mono
          prose-blockquote:border-l-2 prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-600 prose-blockquote:not-italic
          prose-ul:text-zinc-700 prose-ol:text-zinc-700
          prose-li:marker:text-zinc-400
          prose-hr:border-zinc-200
          prose-table:text-sm prose-thead:border-zinc-300 prose-tbody:divide-zinc-200
          prose-th:text-zinc-900 prose-th:font-semibold prose-td:text-zinc-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 mt-12 px-4 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <span>
            Allikas: Eesti Keele Instituut (EKI). Täielik ametlik versioon on alati
            EKI teatmikus.
          </span>
          <a
            href="https://eki.ee/wp-content/uploads/2025/08/Eesti-keele-oigekirja-pohireeglid.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-700 underline underline-offset-2 transition-colors whitespace-nowrap"
          >
            Laadi alla PDF ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
