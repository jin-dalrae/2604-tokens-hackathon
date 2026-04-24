"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/embed")) return null;
  return (
    <header className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-mono text-sm tracking-widest uppercase">
        superbrain<span className="text-emerald-400">/</span>wire
      </Link>
      <nav className="text-xs text-neutral-400 font-mono flex gap-4">
        <span>[wireframe]</span>
        <span>v0.1</span>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/embed")) return null;
  return (
    <footer className="border-t border-neutral-800 px-6 py-2 text-xs text-neutral-500 font-mono">
      tinyfish · nexla · redis · ghost · x402
    </footer>
  );
}
