"use client";
import { Outfit } from "next/font/google";
import { SidebarProvider } from "@/app/context/SidebarContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { AuthProvider } from "@/app/context/AuthContext";

const outfit = Outfit({
    subsets: ["latin"],
});

export default function AdminLayout({
                                        children,
                                    }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className={`${outfit.className} admin-body dark:bg-gray-900 min-h-screen`}>
            <ThemeProvider>
                <AuthProvider>
                    <SidebarProvider>{children}</SidebarProvider>
                </AuthProvider>
            </ThemeProvider>
        </div>
    );
}
