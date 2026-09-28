"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Store } from "lucide-react";
import type { SearchShopItem } from "@/lib/types/search";

function ShopLogo({ shop }: { shop: SearchShopItem }) {
    const [failed, setFailed] = useState(false);
    return (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center overflow-hidden rounded-sm text-orange-500">
            {shop.logo && !failed ? (
                // Remote shop logos may come from any configured merchant storage.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shop.logo} alt={`${shop.shopName} logo`} className="h-full w-full object-contain" onError={() => setFailed(true)} />
            ) : <Store aria-label={`${shop.shopName} logo unavailable`} className="h-3.5 w-3.5" />}
        </span>
    );
}

export function ShopSearchResults({ shops, onSelect }: { shops: SearchShopItem[]; onSelect: () => void }) {
    if (shops.length === 0) return null;

    return (
        <section aria-label="Shops" className="mb-1 last:mb-0">
            <h3 className="mb-1.5 flex items-center gap-1 border-y border-slate-100 bg-slate-50/50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-orange-500 dark:border-slate-800/40 dark:bg-slate-900/30 dark:text-orange-400 lg:mb-2 lg:gap-1.5 lg:px-4 lg:py-1.5 lg:text-[10px]">
                <Store aria-hidden="true" className="h-2.5 w-2.5 shrink-0 lg:h-3 lg:w-3" />
                Shops
            </h3>
            <ul className="max-h-[200px] space-y-0.5 overflow-y-auto px-1.5 pr-1 lg:max-h-[240px] lg:px-2 lg:pr-1">
                {shops.map(shop => (
                    <li key={shop.shopId}>
                        <Link href={`/shop/${shop.shopId}`} onClick={onSelect} className="group/item mx-0.5 flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-left transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:mx-1 lg:gap-4 lg:rounded-2xl lg:px-3 lg:py-2">
                            <div className="flex min-w-0 flex-1 items-center gap-1.5 py-0.5">
                                <ShopLogo key={shop.logo} shop={shop} />
                                <span className="truncate text-[13px] font-semibold leading-tight tracking-wide text-slate-800 dark:text-slate-200" title={shop.shopName}>{shop.shopName}</span>
                            </div>
                            <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 -rotate-90 text-slate-300 transition-colors group-hover/item:text-slate-400 dark:text-slate-600 lg:h-4 lg:w-4" />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
