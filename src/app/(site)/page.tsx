import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_ENABLED, DEMO_STORE_HREF } from "@/lib/demo";
import MarketingShell, { MARKETING_WIDTH } from "@/components/saas/MarketingShell";
import PricingCards from "@/components/saas/PricingCards";
import ThemeThumb, { themeLayout } from "@/components/saas/ThemeThumb";
import HeroMock from "@/components/saas/marketing/HeroMock";
import { icons } from "@/components/saas/marketing/Icons";
import { THEMES } from "@/themes/registry";

export const metadata: Metadata = {
  title: "Retailr — Launch your online business",
  description: "Retailr gives small businesses a storefront, order management and customer tools on one simple subscription.",
};

const channels = ["Online store", "WhatsApp", "Instagram", "In person", "Phone orders"];

const spotlights = [
  {
    t: "A storefront that looks like your brand",
    d: "Pick a theme, add your logo and colours, and share a link customers can buy from. No developer, no hosting, live in minutes.",
    points: ["Four ready-made themes", "Product photos, variants and categories", "Cart, checkout and invoices built in"],
  },
  {
    t: "Every sale in one place",
    d: "Record WhatsApp, Instagram, phone and walk-in sales next to online orders. Stock updates, receipts and reports stay in sync.",
    points: ["Online + offline in one dashboard", "Stock and sold counts stay accurate", "See revenue by channel and payment method"],
  },
  {
    t: "Bookings for services, not just products",
    d: "Offer hair, beauty, repairs or consultations with opening hours and free slots. Customers book online; you manage the calendar.",
    points: ["Opening hours and availability", "Public booking link", "Sync to Google, Apple or Outlook"],
  },
];

const features = [
  { i: "palette", t: "Themes you can switch", d: "Change your storefront look any time without losing products or orders." },
  { i: "box", t: "Products that sell", d: "Up to six photos, sizes and colours with their own stock and price." },
  { i: "chart", t: "Reports you can read", d: "Sales over time, best sellers, top customers and money still owed." },
  { i: "tag", t: "Discounts & coupons", d: "Percent or fixed codes with minimums, usage limits and expiry." },
  { i: "users", t: "Customer groups", d: "Automatic rules like “spent over ₦50,000”, or hand-pick VIPs." },
  { i: "chat", t: "Messages that feel personal", d: "Email or SMS to a group, with first names filled in." },
  { i: "team", t: "Team access", d: "Invite managers and staff with the right level of access." },
  { i: "receipt", t: "Invoices & receipts", d: "Share a clean link after every order, online or in person." },
];

const steps = [
  { n: "1", t: "Create your account", d: "Tell us about your business and pick a plan." },
  { n: "2", t: "Add products or services", d: "Upload photos, set prices, and turn on booking where it fits." },
  { n: "3", t: "Choose your look", d: "Pick a storefront theme and add your logo and brand colour." },
  { n: "4", t: "Start selling", d: "Share your store link and run everything from your dashboard." },
];

const personas = [
  { t: "Fashion & retail", d: "Catalogue, variants, discounts and multi-channel sales for clothes, accessories and home goods." },
  { t: "Beauty & appointments", d: "Bookable services, opening hours and a calendar your clients can book into." },
  { t: "Everyday sellers", d: "WhatsApp and Instagram orders next to an online shop, with stock and simple reports." },
];

const local = [
  ["Sell in your currency", "Naira, cedis, shillings or dollars. Prices, invoices and reports all use it."],
  ["Pay on delivery or bank transfer", "The ways your customers already like to pay — with card checkout on the way."],
  ["Sell where your customers chat", "Record WhatsApp and Instagram orders next to your online ones."],
];

const faqs = [
  ["How do my customers pay?", "Today shoppers choose pay on delivery or bank transfer at checkout. Online card payments and delivery integrations are on the roadmap."],
  ["Can I use my own domain?", "Every store gets a link like retailr.com/s/your-store. Custom domains are planned."],
  ["Can I change how my store looks later?", "Yes. Switch themes in Store settings whenever you like. Nothing about your products or orders changes."],
  ["Do I need to be technical?", "No. If you can use WhatsApp, you can run Retailr. There is nothing to install or host."],
  ["What does it cost?", "There is a free Basic plan, and paid plans start with a free trial. See pricing above for what each plan includes."],
  ["Can my staff help me?", "Yes. Invite your team and give each person the access they need."],
];

const trust = ["Free to start", "No card required", "Live in minutes"];

export default function LandingPage() {
  return (
    <MarketingShell>
      <section className="overflow-hidden bg-brand-950 text-white">
        <div className={`${MARKETING_WIDTH} grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:py-36`}>
          <div>
            <p className="w-fit rounded-full bg-white/10 px-4 py-1.5 text-sm text-brand-100">Built for African small businesses</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl lg:leading-[1.05] 2xl:text-7xl">
              Everything you need to sell online, in one place.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100/80 2xl:max-w-2xl 2xl:text-xl">
              Launch a beautiful storefront, take orders from your shop, WhatsApp and Instagram, and see exactly how your business is doing — on one simple subscription.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="rounded-lg bg-white px-6 py-3.5 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50">
                Start your free trial
              </Link>
              {DEMO_ENABLED ? (
                <Link href={DEMO_STORE_HREF} className="rounded-lg px-6 py-3.5 text-center text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">
                  Browse a demo store
                </Link>
              ) : (
                <Link href="/themes" className="rounded-lg px-6 py-3.5 text-center text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">
                  See storefront themes
                </Link>
              )}
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-100/80">
              {trust.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[11px]" aria-hidden>✓</span>
                  {t}
                </li>
              ))}
            </ul>
            {DEMO_ENABLED && (
              <p className="mt-5 text-sm text-brand-100/70">
                Want to look around first?{" "}
                <Link href="/admin/login" className="font-medium text-white underline underline-offset-4 hover:text-brand-100">
                  Open the demo dashboard
                </Link>
              </p>
            )}
          </div>
          <HeroMock />
        </div>
      </section>

      <section aria-label="Sales channels" className="border-b border-gray-100 bg-white">
        <div className={`${MARKETING_WIDTH} flex flex-col items-center gap-4 py-7 text-center sm:flex-row sm:justify-between sm:text-left`}>
          <p className="text-sm font-medium text-gray-500">Sell wherever your customers are</p>
          <ul className="flex flex-wrap justify-center gap-2 sm:justify-end">
            {channels.map((c) => (
              <li key={c} className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700">{c}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold lg:text-4xl">Built for how you already sell</h2>
          <p className="mt-3 text-gray-500">Storefront, multi-channel orders and appointments — without stitching five apps together.</p>
        </div>
        <div className="mt-14 space-y-10 lg:mt-16 lg:space-y-12">
          {spotlights.map((s, i) => (
            <div
              key={s.t}
              className={`grid items-center gap-8 rounded-3xl border border-gray-200 bg-gray-50/60 p-8 lg:grid-cols-2 lg:gap-12 lg:p-12 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <h3 className="text-2xl font-semibold lg:text-3xl">{s.t}</h3>
                <p className="mt-3 text-gray-600 leading-relaxed">{s.d}</p>
                <ul className="mt-6 space-y-2.5 text-sm text-gray-700">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <span className="mt-0.5 text-brand-500" aria-hidden>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex min-h-[180px] items-center justify-center rounded-2xl bg-white p-8 shadow-theme-xs ring-1 ring-gray-100 lg:min-h-[220px]">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    {icons[i === 0 ? "store" : i === 1 ? "receipt" : "chart"]}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{s.points[0]}</p>
                  <p className="mt-1 text-xs text-gray-500">Included on every plan that unlocks this area</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-gray-200 p-6 transition hover:border-brand-200 hover:shadow-theme-md">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icons[f.i]}</div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Who it is for" className="border-y border-gray-100 bg-white">
        <div className={`${MARKETING_WIDTH} py-16 lg:py-20`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold lg:text-3xl">Made for sellers like you</h2>
            <p className="mt-2 text-gray-500">Whether you sell products, appointments, or both.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {personas.map((p) => (
              <div key={p.t} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6">
                <h3 className="font-semibold">{p.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="themes" className="bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold lg:text-4xl">A storefront that looks like you</h2>
            <p className="mt-3 text-gray-500">Choose a theme, add your logo and brand colour, and switch whenever you like.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {THEMES.slice(0, 4).map((t) => (
              <div key={t.id} className="flex flex-col rounded-2xl bg-white p-4 shadow-theme-xs ring-1 ring-gray-200">
                <ThemeThumb
                  swatches={t.swatches}
                  layout={themeLayout(t.id)}
                />
                <h3 className="mt-4 font-semibold">{t.name}</h3>
                <p className="mt-1 flex-1 text-sm text-gray-500">{t.description}</p>
                <Link href={`/get-started`} className="mt-4 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Use this theme →
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm">
            <Link href="/themes" className="font-medium text-brand-600 hover:text-brand-700">
              Compare all themes in detail →
            </Link>
          </p>
        </div>
      </section>

      <section className={`${MARKETING_WIDTH} py-16 lg:py-20`}>
        <div className="grid gap-6 sm:grid-cols-3">
          {local.map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold lg:text-4xl">Up and running in four steps</h2>
            <p className="mt-3 text-gray-500">Most sellers share their store link the same day they sign up.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-6 shadow-theme-xs ring-1 ring-gray-100">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">{s.n}</span>
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className={`${MARKETING_WIDTH} py-20 text-center lg:py-28`}>
        <h2 className="text-3xl font-semibold lg:text-4xl">Simple, transparent pricing</h2>
        <p className="mt-3 text-gray-500">Every paid plan starts with a 14-day free trial. No card required.</p>
        <div className="mt-10"><PricingCards /></div>
      </section>

      <section id="faq" className="bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
          <h2 className="text-center text-3xl font-semibold lg:text-4xl">Questions, answered</h2>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-gray-200 border-y border-gray-200">
            {faqs.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}
                  <span className="text-xl leading-none text-gray-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-950 text-white">
        <div className={`${MARKETING_WIDTH} py-20 text-center lg:py-24`}>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold lg:text-5xl lg:leading-tight">Your first sale is closer than you think.</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100/80">Set up your store today and start taking orders this week.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/get-started" className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Start your free trial
            </Link>
            {DEMO_ENABLED && (
              <Link href="/admin/login" className="rounded-lg px-7 py-3.5 text-sm font-semibold ring-1 ring-inset ring-white/30 hover:bg-white/10">
                Try the demo dashboard
              </Link>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
