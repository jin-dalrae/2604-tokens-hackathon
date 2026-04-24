"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/embed")) return null;
  return (
    <header className="relative z-10 px-8 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <span
          aria-hidden
          className="w-2.5 h-2.5 rounded-full nn-pulse"
          style={{ background: "var(--accent-grad)" }}
        />
        <span className="font-mono text-sm tracking-[0.2em] uppercase text-[var(--on-surface)]">
          super<span className="nn-gradient-text">brain</span>
        </span>
      </Link>
      <nav className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--on-surface-variant)] flex gap-6 items-center">
        <Link href="/" className="hover:text-[var(--primary)] transition-colors">launch</Link>
        <span className="opacity-30">/</span>
        <a
          href="https://superbrain.ghost.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--primary)] transition-colors"
        >reports</a>
        <span className="opacity-30">/</span>
        <a
          href="https://cited.md"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--primary)] transition-colors"
        >cited.md</a>
        <span className="opacity-30">/</span>
        <a
          href="/api/graphql"
          className="hover:text-[var(--primary)] transition-colors"
        >graphql</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/embed")) return null;
  return (
    <footer className="relative z-10 px-8 py-3 flex items-center justify-between border-t border-white/5">
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--on-surface-variant)]">
        tinyfish · redis · senso · ghost · wundergraph · cdp+x402
      </span>
      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--on-surface-variant)]">
        v0.3 · hackathon
      </span>
    </footer>
  );
}
