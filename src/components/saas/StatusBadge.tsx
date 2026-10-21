import React from "react";
import Badge from "@/components/ui/badge/Badge";

type Color = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const MAP: Record<string, Color> = {
  // business
  active: "success", trial: "info", trialing: "info", pending: "warning",
  suspended: "error", cancelled: "light", past_due: "error",
  // orders
  processing: "info", shipped: "primary", delivered: "success", refunded: "light",
  // bookings
  confirmed: "success", completed: "success", no_show: "warning",
  // payments / invoices
  paid: "success", unpaid: "warning", failed: "error",
  // products
  draft: "light", out_of_stock: "error",
  // coupons
  disabled: "light", expired: "light", used_up: "warning",
  // team
  invited: "warning",
};

export const label = (s: string) =>
  s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge size="sm" color={MAP[status] ?? "light"}>
      {label(status)}
    </Badge>
  );
}
