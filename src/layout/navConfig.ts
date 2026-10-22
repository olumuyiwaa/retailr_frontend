import type React from "react";
import type { AuthUser, Role } from "@/types/saas";
import {
  BoxCubeIcon,
  BoxIcon,
  CalenderIcon,
  DollarLineIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  MailIcon,
  PieChartIcon,
  PlugInIcon,
  TaskIcon,
  UserCircleIcon,
} from "@/icons";

export type TeamRole = NonNullable<AuthUser["teamRole"]>;
const RANK: Record<TeamRole, number> = { staff: 1, manager: 2, owner: 3 };

/** The lowest team role that may open each business page (the API enforces the same rules). */
const MIN_ROLE: [string, TeamRole][] = [
  ["/admin/business/products", "manager"],
  ["/admin/business/categories", "manager"],
  ["/admin/business/groups", "manager"],
  ["/admin/business/messages", "manager"],
  ["/admin/business/coupons", "manager"],
  ["/admin/business/reports", "manager"],
  ["/admin/business/analytics", "manager"],
  ["/admin/business/team", "owner"],
  ["/admin/business/billing", "owner"],
  ["/admin/business/settings", "owner"],
];

/** Whether someone with this team role may open `path`. Anything not listed is open to the whole team. */
export function canOpen(path: string, teamRole: TeamRole = "owner"): boolean {
  const rule = MIN_ROLE.find(([p]) => path === p || path.startsWith(p + "/"));
  return !rule || RANK[teamRole] >= RANK[rule[1]];
}

export type NavItem = {
  name: string;
  path: string;
  icon: React.FC<{ className?: string; width?: number; height?: number }>;
};

export type NavSection = { title: string; items: NavItem[] };

export const navFor = (role: Role, teamRole?: TeamRole): NavSection[] => {
  const sections: NavSection[] = role === "super_admin"
    ? [
        {
          title: "Platform",
          items: [
            { name: "Overview", path: "/admin/super", icon: GridIcon },
            { name: "Businesses", path: "/admin/super/businesses", icon: BoxCubeIcon },
            { name: "Plans", path: "/admin/super/plans", icon: ListIcon },
            { name: "Subscriptions", path: "/admin/super/subscriptions", icon: TaskIcon },
            { name: "Invoices", path: "/admin/super/invoices", icon: FileIcon },
            { name: "Discounts", path: "/admin/super/discounts", icon: DollarLineIcon },
            { name: "Site analytics", path: "/admin/super/analytics", icon: PieChartIcon },
          ],
        },
        {
          title: "System",
          items: [{ name: "Settings", path: "/admin/super/settings", icon: PlugInIcon }],
        },
      ]
    : [
        {
          title: "Store",
          items: [
            { name: "Dashboard", path: "/admin/business", icon: GridIcon },
            { name: "Products", path: "/admin/business/products", icon: BoxIcon },
            { name: "Services", path: "/admin/business/services", icon: TaskIcon },
            { name: "Categories", path: "/admin/business/categories", icon: BoxIcon },
            { name: "Record sale", path: "/admin/business/sales/new", icon: DollarLineIcon },
            { name: "Orders", path: "/admin/business/orders", icon: PieChartIcon },
            { name: "Bookings", path: "/admin/business/bookings", icon: CalenderIcon },
            { name: "Customers", path: "/admin/business/customers", icon: GroupIcon },
            { name: "Groups", path: "/admin/business/groups", icon: GroupIcon },
            { name: "Messages", path: "/admin/business/messages", icon: MailIcon },
            { name: "Discounts", path: "/admin/business/coupons", icon: DollarLineIcon },
            { name: "Reports", path: "/admin/business/reports", icon: PieChartIcon },
            { name: "Site analytics", path: "/admin/business/analytics", icon: PieChartIcon },
          ],
        },
        {
          title: "Account",
          items: [
            { name: "Team", path: "/admin/business/team", icon: UserCircleIcon },
            { name: "Billing & plan", path: "/admin/business/billing", icon: DollarLineIcon },
            { name: "Store settings", path: "/admin/business/settings", icon: PlugInIcon },
          ],
        },
      ];
  return role === "super_admin" ? sections : sections.map((sec) => ({ ...sec, items: sec.items.filter((i) => canOpen(i.path, teamRole)) })).filter((sec) => sec.items.length > 0);
};
