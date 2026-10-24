import React from "react";
import Link from "next/link";
import Logo from "./Logo";
import MarketingTracker from "@/components/analytics/MarketingTracker";
import { DEMO_ENABLED, DEMO_STORE_HREF } from "@/lib/demo";

/** Shared max-width + horizontal padding for marketing pages — matches the classic storefront container. */
export const MARKETING_WIDTH = "mx-auto w-full max-w-[1680px] px-5 sm:px-8 lg:px-12 2xl:px-20";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-800 antialiased">
      <header className="sticky top-0 z-40 border-b border-gray-100/80 bg-white/90 backdrop-blur-md">
        <div className={`${MARKETING_WIDTH} flex h-16 items-center justify-between gap-4`}>
          <Link href="/" className="shrink-0" aria-label="Retailr home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <Link href="/#features" className="hover:text-brand-500">Features</Link>
            <Link href="/themes" className="hover:text-brand-500">Themes</Link>
            <Link href="/#how" className="hover:text-brand-500">How it works</Link>
            <Link href="/#pricing" className="hover:text-brand-500">Pricing</Link>
            <Link href="/#faq" className="hover:text-brand-500">FAQ</Link>
          </nav>
          <div className="flex items-center gap-2 text-sm font-medium sm:gap-3">
            <Link href="/admin/login" className="hidden px-3 py-2 text-gray-600 hover:text-brand-500 sm:inline">Sign in</Link>
            <Link href="/get-started" className="rounded-lg bg-brand-500 px-3.5 py-2.5 text-white shadow-theme-xs hover:bg-brand-600 sm:px-4">
              Start free
            </Link>
          </div>
        </div>
      </header>
      <MarketingTracker />
      {children}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className={`${MARKETING_WIDTH} grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]`}>
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-gray-500">The home for African small businesses online.</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Product</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/#features" className="hover:text-brand-500">Features</Link></li>
              <li><Link href="/themes" className="hover:text-brand-500">Themes</Link></li>
              <li><Link href="/#pricing" className="hover:text-brand-500">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-brand-500">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Get started</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><Link href="/get-started" className="hover:text-brand-500">Start free trial</Link></li>
              <li><Link href="/admin/login" className="hover:text-brand-500">Sign in</Link></li>
              {DEMO_ENABLED && <li><Link href={DEMO_STORE_HREF} className="hover:text-brand-500">Demo store</Link></li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100">
          <div className={`${MARKETING_WIDTH} py-5`}>
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Retailr. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
