"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import "../css/euclid-circular-a-font.css";
import "../css/style.css";
import { ThemedChrome } from "@/themes/ThemedPage";
import Footer from "../../components/Footer";

import { ModalProvider } from "../context/QuickViewModalContext";
import { CartModalProvider } from "../context/CartSidebarModalContext";
import { ReduxProvider } from "@/redux/provider";
import QuickViewModal from "@/components/Common/QuickViewModal";
import CartSidebarModal from "@/components/Common/CartSidebarModal";
import { PreviewSliderProvider } from "../context/PreviewSliderContext";
import PreviewSliderModal from "@/components/Common/PreviewSlider";

import { StoreProvider } from "../context/StoreContext";
import StoreTracker from "@/components/analytics/StoreTracker";
import ScrollToTop from "@/components/Common/ScrollToTop";
import PreLoader from "@/components/Common/PreLoader";
import { ConfirmProvider } from "@/components/ui/confirm";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  // Marketing pages bring their own header/footer and skip the storefront shell.
  const isMarketing = pathname === "/" || pathname?.startsWith("/get-started");
  const skipShell = isAdmin || isMarketing;
  // Business storefronts live at /s/<slug>/...
  const storeSlug = pathname?.match(/^\/s\/([^/]+)/)?.[1];

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), skipShell ? 0 : 1000);
    return () => clearTimeout(t);
  }, [skipShell]);

  return (
      <html lang="en" suppressHydrationWarning={true}>
      <body className={display.variable}>
      <ConfirmProvider>
      {loading ? (
          <PreLoader />
      ) : skipShell ? (
          // Admin + marketing: no storefront header/footer/modals
          <>{children}</>
      ) : (
          <ReduxProvider>
            {/* StoreProvider wraps header + footer too, so they can read the current business */}
            <StoreProvider slug={storeSlug}>
              <CartModalProvider>
                <ModalProvider>
                  <PreviewSliderProvider>
                    {storeSlug && <ThemedChrome slot="header" fallback={<div className="h-[72px]" aria-hidden />} />}
                    {storeSlug && <StoreTracker />}
                    {children}
                    <QuickViewModal />
                    <CartSidebarModal />
                    <PreviewSliderModal />
                  </PreviewSliderProvider>
                </ModalProvider>
              </CartModalProvider>
              <ScrollToTop />
              <Footer />
            </StoreProvider>
          </ReduxProvider>
      )}
      </ConfirmProvider>
      </body>
      </html>
  );
}