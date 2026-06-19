"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

const HIDE_HEADER_ROUTES = ["/login", "/shop-registration", "/forgot-password"];

export function ConditionalHeader() {
    const pathname = usePathname();

    if (HIDE_HEADER_ROUTES.includes(pathname)) {
        return null;
    }

    return <Header />;
}
