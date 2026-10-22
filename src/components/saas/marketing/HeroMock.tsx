const tiles: [string, string, string][] = [
  ["#E8D5C4", "Adire wrap dress", "₦28,500"],
  ["#C4D4C7", "Shea butter set", "₦12,000"],
  ["#C9C6E8", "Kente tote", "₦18,500"],
  ["#F3B9A7", "Beaded necklace", "₦9,800"],
];

export default function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-[620px] pb-10 pl-0 sm:pl-8" aria-hidden>
      <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20">
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-xs text-gray-400 ring-1 ring-gray-200">
            retailr.com/s/your-store
          </span>
        </div>
        <div className="bg-[#F6EFE7] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#2A1D19]">Your Store</span>
            <span className="truncate text-xs text-[#6B5A51]">Shop · New · Best sellers · Bag (2)</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {tiles.map(([c, n, p]) => (
              <div key={n}>
                <div className="aspect-[4/5] rounded-md shadow-sm" style={{ background: c }} />
                <p className="mt-2 truncate text-[11px] font-medium text-[#2A1D19]">{n}</p>
                <p className="text-[11px] font-medium text-[#6B5A51]">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-0 left-0 hidden w-56 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-100 sm:block">
        <p className="text-xs text-gray-500">New order · WhatsApp</p>
        <p className="mt-1 text-lg font-semibold text-gray-800">₦96,000</p>
        <p className="mt-1 text-xs font-medium text-success-600">Paid · stock updated</p>
      </div>
      <div className="absolute -right-2 top-20 hidden w-48 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-100 md:block">
        <p className="text-xs text-gray-500">Sales this week</p>
        <p className="mt-1 text-lg font-semibold text-gray-800">+24%</p>
        <svg viewBox="0 0 120 32" className="mt-2 h-8 w-full text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 26 L22 20 L42 23 L62 12 L82 15 L102 5 L118 8" />
        </svg>
      </div>
      <div className="absolute right-6 -bottom-2 hidden rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg sm:block">
        Live in minutes
      </div>
    </div>
  );
}
