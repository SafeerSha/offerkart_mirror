"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import ShopHeader from "./ShopHeader";

const HIDE_HEADER_ROUTES = ["/login", "/shop-registration", "/forgot-password", "/register"];

export function ConditionalHeader() {
    const pathname = usePathname();

    if (HIDE_HEADER_ROUTES.includes(pathname)) {
        return null;
    }

    if (pathname.startsWith("/shop-manager")) {
        return <ShopHeader />;
    }

    return <Header />;
}
