"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

const HIDE_FOOTER_ROUTES = ["/login", "/shop-registration", "/forgot-password", "/register"];

export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide on standalone auth routes
  if (HIDE_FOOTER_ROUTES.includes(pathname)) {
    return null;
  }

  // Hide on merchant management portal
  if (pathname.startsWith("/shop-manager")) {
    return null;
  }

  return <Footer />;
}

export default ConditionalFooter;
