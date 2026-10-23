import React from "react";
import type { BankAccount } from "@/types/saas";

/** The account a shopper pays into, shown at checkout and on the order page. */
export default function BankTransferDetails({ account, reference }: { account: BankAccount; reference?: string }) {
  const rows: [string, string | undefined][] = [
    ["Bank", account.bankName],
    ["Account number", account.accountNumber],
    ["Account name", account.accountName],
    ["Branch", account.branch],
    ["Sort code", account.sortCode],
    ["SWIFT / BIC", account.swiftCode],
    ["IBAN", account.iban],
    ["Reference", reference],
  ];
  return (
    <div className="rounded-xl bg-white/70 px-4 py-3 text-custom-sm text-dark">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-dark-4">{k}</dt>
            <dd className="font-medium break-all">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      {account.instructions && <p className="mt-2 whitespace-pre-line border-t border-[color:var(--line)] pt-2 text-dark-4">{account.instructions}</p>}
    </div>
  );
}
