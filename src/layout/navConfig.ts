import type React from "react";
import type { Role } from "@/types/saas";
import {
  BoxCubeIcon,
  BoxIcon,
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

export type NavItem = {
  name: string;
  path: string;
  icon: React.FC<{ className?: string; width?: number; height?: number }>;
};

export type NavSection = { title: string; items: NavItem[] };

export const navFor = (role: Role): NavSection[] =>
  role === "super_admin"
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
            { name: "Categories", path: "/admin/business/categories", icon: BoxIcon },
            { name: "Record sale", path: "/admin/business/sales/new", icon: DollarLineIcon },
            { name: "Orders", path: "/admin/business/orders", icon: PieChartIcon },
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
