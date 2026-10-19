// admin/(admin)/layout.tsx — authenticated shell for both admin interfaces.
"use client";

import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/app/context/SidebarContext";
import { homeFor, useAuth } from "@/app/context/AuthContext";
import Spinner from "@/components/saas/Spinner";
import { canOpen } from "@/layout/navConfig";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const { user, ready } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Route guard: signed-out users go to login; each role stays in its own area.
    useEffect(() => {
        if (!ready) return;
        if (!user) {
            router.replace("/admin/login");
            return;
        }
        const inSuper = pathname.startsWith("/admin/super");
        const inBusiness = pathname.startsWith("/admin/business");
        if ((user.role === "super_admin" && inBusiness) || (user.role === "business_admin" && inSuper)) {
            router.replace(homeFor(user.role));
        } else if (user.role === "business_admin" && !canOpen(pathname, user.teamRole)) {
            router.replace(homeFor(user.role)); // not for this team role
        } else if (pathname === "/admin") {
            router.replace(homeFor(user.role));
        }
    }, [ready, user, pathname, router]);

    if (!ready || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-screen xl:flex">
            <AppSidebar />
            <Backdrop />
            <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
                <AppHeader />
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
            </div>
        </div>
    );
}
