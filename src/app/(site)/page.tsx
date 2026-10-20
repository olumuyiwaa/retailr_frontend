import type { Metadata } from "next";
import Link from "next/link";
import { DEMO_ENABLED, DEMO_STORE_HREF } from "@/lib/demo";
import MarketingShell, { MARKETING_WIDTH } from "@/components/saas/MarketingShell";
import PricingCards from "@/components/saas/PricingCards";
import ThemeThumb from "@/components/saas/ThemeThumb";
import HeroMock from "@/components/saas/marketing/HeroMock";
import { icons } from "@/components/saas/marketing/Icons";
import { THEMES } from "@/themes/registry";

export const metadata: Metadata = {
  title: "Retailr — Launch your online business",
  description: "Retailr gives small businesses a storefront, order management and customer tools on one simple subscription.",
};

const channels = ["Online store", "WhatsApp", "Instagram", "In person", "Phone orders"];

const features = [
  { i: "store", t: "Your own storefront", d: "A branded shop with your logo, product galleries, cart and checkout, live in minutes with no developer." },
  { i: "palette", t: "Themes you can switch", d: "Pick a look for your store and change it any time. Your products and settings stay exactly as they are." },
  { i: "box", t: "Products that sell", d: "Up to six photos per product, sizes and colours with their own stock and price, and your own categories." },
  { i: "receipt", t: "Record every sale", d: "Log WhatsApp, Instagram, phone and in-person sales in seconds. Stock updates and invoices follow." },
  { i: "chart", t: "Reports you can read", d: "Sales over time, best sellers, top customers and money still owed, by channel and payment method." },
  { i: "tag", t: "Discounts & coupons", d: "Percent or fixed codes with minimum orders, usage limits and expiry dates." },
  { i: "users", t: "Customer groups", d: "Group customers automatically, like “spent over ₦50,000”, or hand-pick your VIPs." },
  { i: "chat", t: "Messages that feel personal", d: "Write once to everyone or a group, with their first name filled in." },
  { i: "team", t: "Team access", d: "Invite managers and staff, each with the access they need." },
];

const steps = [
  { n: "1", t: "Create your account", d: "Tell us about your business and pick a plan." },
  { n: "2", t: "Add your products", d: "Upload photos, set prices and stock, and organise them into categories." },
  { n: "3", t: "Choose your look", d: "Pick a storefront theme and add your logo and brand colour." },
  { n: "4", t: "Start selling", d: "Share your store link and run everything from your dashboard." },
];

const local = [
  ["Sell in your currency", "Naira, cedis, shillings or dollars. Prices, invoices and reports all use it."],
  ["Pay on delivery or bank transfer", "The ways your customers already like to pay."],
  ["Sell where your customers chat", "Record WhatsApp and Instagram orders next to your online ones, so reports show the whole picture."],
];

const faqs = [
  ["How do my customers pay?", "Today shoppers choose pay on delivery or bank transfer at checkout. Online card payments and delivery integrations are on the roadmap."],
  ["Can I use my own domain?", "Every store gets a link like retailr.com/s/your-store. Custom domains are planned."],
  ["Can I change how my store looks later?", "Yes. Switch themes in Store settings whenever you like. Nothing about your products or orders changes."],
  ["Do I need to be technical?", "No. If you can use WhatsApp, you can run Retailr. There is nothing to install or host."],
  ["What does it cost?", "There is a free Basic plan, and paid plans start with a free trial. See pricing above for what each plan includes."],
  ["Can my staff help me?", "Yes. Invite your team and give each person the access they need."],
];

export default function LandingPage() {
  return (
    <MarketingShell>
      <section className="overflow-hidden bg-brand-950 text-white">
        <div className={`${MARKETING_WIDTH} grid items-center gap-14 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:py-28`}>
          <div>
            <p className="w-fit rounded-full bg-white/10 px-4 py-1.5 text-sm text-brand-100">Built for African small businesses</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl lg:leading-[1.05]">Everything you need to sell online, in one place.</h1>
            <p className="mt-6 max-w-xl text-lg text-brand-100/80">
              Launch a beautiful storefront, take orders from your shop, WhatsApp and Instagram, and see exactly how your business is doing, on one simple subscription.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/get-started" className="rounded-lg bg-white px-6 py-3.5 text-center text-sm font-semibold text-brand-700 hover:bg-brand-50">Start your free trial</Link>
              {DEMO_ENABLED && <Link href={DEMO_STORE_HREF} className="rounded-lg px-6 py-3.5 text-center text-sm font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10">Browse a demo store</Link>}
            </div>
            {DEMO_ENABLED && (
              <p className="mt-5 text-sm text-brand-100/70">
                Want to look around first?{" "}
                <Link href="/admin/login" className="font-medium text-white underline underline-offset-4 hover:text-brand-100">Open the demo dashboard</Link>
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
          <h2 className="text-3xl font-semibold lg:text-4xl">Tools that grow with you</h2>
          <p className="mt-3 text-gray-500">From your first sale to your first team, everything is already in the box.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-gray-200 p-6 transition hover:border-brand-200 hover:shadow-theme-md lg:p-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">{icons[f.i]}</div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="themes" className="bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold lg:text-4xl">A storefront that looks like you</h2>
            <p className="mt-3 text-gray-500">Choose a theme, add your logo and brand colour, and switch whenever you like. More themes are on the way.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <div key={t.id} className="rounded-2xl bg-white p-4 shadow-theme-xs ring-1 ring-gray-200">
                <ThemeThumb swatches={t.swatches} layout={t.id === "showcase" ? "showcase" : t.id === "atelier" ? "atelier" : "classic"} />
                <h3 className="mt-4 font-semibold">{t.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{t.description}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm">
            {DEMO_ENABLED && <Link href={DEMO_STORE_HREF} className="font-medium text-brand-600 underline underline-offset-4 hover:text-brand-700">See a live demo store</Link>}
          </p>
        </div>
      </section>

      <section className={`${MARKETING_WIDTH} grid items-center gap-12 py-20 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-28`}>
        <div>
          <h2 className="text-3xl font-semibold lg:text-4xl">Made for how Africa sells</h2>
          <p className="mt-4 text-gray-500">Retailr starts from the way small businesses really trade: in local currency, over chat, with cash or transfer.</p>
        </div>
        <ul className="space-y-5">
          {local.map(([t, d]) => (
            <li key={t} className="flex gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">{icons.check}</span>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="bg-gray-50">
        <div className={`${MARKETING_WIDTH} py-20 lg:py-28`}>
          <h2 className="text-center text-3xl font-semibold lg:text-4xl">Up and running in four steps</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-10">
            {steps.map((s) => (
              <div key={s.n}>
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
        <p className="mt-3 text-gray-500">Every plan starts with a 14-day free trial. No card required.</p>
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
            <Link href="/get-started" className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">Start your free trial</Link>
            {DEMO_ENABLED && <Link href="/admin/login" className="rounded-lg px-7 py-3.5 text-sm font-semibold ring-1 ring-inset ring-white/30 hover:bg-white/10">Try the demo dashboard</Link>}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
