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
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafafa] flex flex-col">

      {/* Nav */}
      <nav className="shrink-0 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors group"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Tagasi
          </Link>

          <span className="text-xs font-medium text-zinc-400">EKI Põhireeglid</span>

          <a
            href="https://teatmik.eki.ee/teatmik/eesti-keele-oigekirja-pohireeglid/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            teatmik.eki.ee ↗
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <article className="
          prose prose-invert prose-sm sm:prose-base max-w-none
          prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-white
          prose-h1:text-2xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4
          prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-zinc-100
          prose-h3:text-base prose-h3:text-zinc-200
          prose-p:text-zinc-400 prose-p:leading-relaxed
          prose-a:text-zinc-300 prose-a:underline prose-a:underline-offset-2 prose-a:decoration-zinc-600 hover:prose-a:text-white hover:prose-a:decoration-zinc-400
          prose-strong:text-zinc-100 prose-strong:font-semibold
          prose-code:text-zinc-200 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:border prose-code:border-white/[0.08]
          prose-blockquote:border-l-2 prose-blockquote:border-white/20 prose-blockquote:text-zinc-500 prose-blockquote:not-italic prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r-lg prose-blockquote:py-1
          prose-ul:text-zinc-400 prose-ol:text-zinc-400
          prose-li:marker:text-zinc-600
          prose-hr:border-white/[0.08]
          prose-table:text-sm
          prose-thead:border-white/[0.1]
          prose-tbody:divide-white/[0.05]
          prose-th:text-zinc-200 prose-th:font-semibold
          prose-td:text-zinc-400
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-white/[0.05] px-4 py-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-700">
          <span>Allikas: Eesti Keele Instituut. Täielik versioon on alati EKI teatmikus.</span>
          <a
            href="https://eki.ee/wp-content/uploads/2025/08/Eesti-keele-oigekirja-pohireeglid.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors whitespace-nowrap"
          >
            Laadi alla PDF ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
