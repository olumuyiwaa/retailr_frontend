"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSidebar } from "@/app/context/SidebarContext";
import { useAuth } from "@/app/context/AuthContext";
import Logo from "@/components/saas/Logo";
import { navFor } from "./navConfig";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showText = isExpanded || isHovered || isMobileOpen;

  if (!user) return null;
  const sections = navFor(user.role, user.teamRole);
  const rootPaths = ["/admin/super", "/admin/business"];
  /** Match path and optional query (so Products vs Services can share a page). */
  const isActive = (path: string) => {
    const [base, qs] = path.split("?");
    const pathMatch = rootPaths.includes(base)
      ? pathname === base
      : pathname === base || pathname.startsWith(base + "/");
    if (!pathMatch) return false;
    if (qs) {
      const want = new URLSearchParams(qs);
      // Avoid for..of on URLSearchParams iterators (tsconfig target is es5).
      const ok = Array.from(want.keys()).every((k) => searchParams.get(k) === want.get(k));
      return ok;
    }
    // Bare /products should not look active when we are on Services (?kind=service)
    if (base === "/admin/business/products" && searchParams.get("kind") === "service") return false;
    return true;
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!showText ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          <Logo compact={!showText} />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !showText ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {showText ? section.title : "···"}
                </h2>
                <ul className="flex flex-col gap-2">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`menu-item group ${
                          isActive(item.path) ? "menu-item-active" : "menu-item-inactive"
                        } ${!showText ? "lg:justify-center" : "lg:justify-start"}`}
                      >
                        <span
                          className={
                            isActive(item.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"
                          }
                        >
                          {React.createElement(item.icon, { width: 20, height: 20 })}
                        </span>
                        {showText && <span className="menu-item-text">{item.name}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
