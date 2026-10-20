"use client";
import React from "react";
import { ThemedChrome } from "@/themes/ThemedPage";
import { useStore } from "@/app/context/StoreContext";

/** The footer of a business storefront; everywhere else (marketing, admin) brings its own. */
const Footer = () => {
  const storeCtx = useStore();
  return storeCtx ? <ThemedChrome slot="footer" /> : null;
};

export default Footer;
