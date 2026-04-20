"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ElementType;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex mb-6", className)}
        >
            <ol className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                {/* Home Item */}
                <li className="flex items-center">
                    <Link
                        href="/"
                        className="flex items-center text-xs font-bold text-gray-900 hover:text-orange-500 transition-colors py-1 group"
                    >
                        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 group-hover:scale-110 transition-transform text-orange-500" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                </li>

                {/* Dynamic Items */}
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    const Icon = item.icon;

                    return (
                        <React.Fragment key={index}>
                            <li className="flex items-center">
                                <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-0.5" />
                            </li>
                            <li className="flex items-center">
                                {isLast || !item.href ? (
                                    <span
                                        className={cn(
                                            "text-xs font-bold py-1",
                                            isLast ? "text-orange-500" : "text-gray-900"
                                        )}
                                        aria-current={isLast ? "page" : undefined}
                                    >
                                        {Icon && <Icon className="w-4 h-4 mr-1.5 inline-block" />}
                                        {item.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className="flex items-center text-xs font-bold text-gray-900 hover:text-orange-500 transition-colors py-1"
                                    >
                                        {Icon && <Icon className="w-4 h-4 mr-1.5" />}
                                        {item.label}
                                    </Link>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
