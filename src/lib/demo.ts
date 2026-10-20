/** The demo shop created by the API's `npm run seed:demo`. Set NEXT_PUBLIC_DEMO_ENABLED=false on a real deployment that doesn't seed it. */
export const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_ENABLED !== "false";
export const DEMO_SLUG = process.env.NEXT_PUBLIC_DEMO_SLUG || "scentora";
export const DEMO_STORE_HREF = `/s/${DEMO_SLUG}`;
const PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "Demo@12345";

export const DEMO_LOGINS = [
  { role: "Owner", email: `demo@${DEMO_SLUG}.example`, password: PASSWORD, note: "Everything, including billing" },
  { role: "Manager", email: `manager@${DEMO_SLUG}.example`, password: PASSWORD, note: "Catalogue, messages, reports" },
  { role: "Staff", email: `staff@${DEMO_SLUG}.example`, password: PASSWORD, note: "Orders, sales, customers" },
] as const;
