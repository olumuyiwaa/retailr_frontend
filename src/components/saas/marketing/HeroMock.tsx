import { DEMO_PRODUCTS } from "@/lib/demoPhotos";

export default function HeroMock() {
  const tiles = DEMO_PRODUCTS.slice(0, 4);

  return (
    <div className="relative mx-auto w-full max-w-[620px] pb-14 pl-0 sm:pl-8" aria-hidden>
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-gray-400 ring-1 ring-gray-200">
            retailr.com/s/scentora
          </span>
        </div>
        <div className="bg-[#F6EFE7] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold tracking-wide text-[#2A1D19]">SCENTORA</span>
            <span className="truncate text-xs text-[#6B5A51]">Shop · Women · Oud · Bag (2)</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {tiles.map((p) => (
              <div key={p.name}>
                <div className="aspect-[4/5] overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">
                  <img src={p.photo} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 truncate text-[11px] font-medium text-[#2A1D19]">{p.name}</p>
                <p className="text-[11px] font-medium text-[#6B5A51]">{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-0 left-0 w-44 rounded-xl bg-white p-3 shadow-xl ring-1 ring-gray-100 sm:w-56 sm:p-4">
        <p className="text-xs text-gray-500">New order · WhatsApp</p>
        <p className="mt-1 text-base font-semibold text-gray-800 sm:text-lg">₦96,000</p>
        <p className="mt-1 text-xs font-medium text-success-600">Paid · stock updated</p>
      </div>
      <div className="absolute -right-2 top-16 w-40 rounded-xl bg-white p-3 shadow-xl ring-1 ring-gray-100 sm:top-20 sm:w-48 sm:p-4">
        <p className="text-xs text-gray-500">Sales this week</p>
        <p className="mt-1 text-base font-semibold text-gray-800 sm:text-lg">+24%</p>
        <svg viewBox="0 0 120 32" className="mt-2 h-8 w-full text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 26 L22 20 L42 23 L62 12 L82 15 L102 5 L118 8" />
        </svg>
      </div>
      <div className="absolute right-6 -bottom-2 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
        Live in minutes
      </div>
    </div>
  );
}
