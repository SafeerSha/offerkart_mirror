"use client";

import { useEffect } from "react";
import { withinRadius, type SearchRadius } from "@/lib/distance";

interface RadiusPageOptions<T> {
    items: T[];
    radius: SearchRadius;
    locationReady: boolean;
    hasNextPage: boolean;
    isFetching: boolean;
    error: unknown;
    fetchNextPage: () => Promise<unknown>;
    distance: (item: T) => unknown;
}

/** Complete the paginated search before declaring that no nearby shops exist. */
export function useRadiusResults<T>({ items, radius, locationReady, hasNextPage, isFetching, error, fetchNextPage, distance }: RadiusPageOptions<T>) {
    useEffect(() => {
        if (radius !== null && locationReady && hasNextPage && !isFetching && !error) {
            void fetchNextPage().catch(() => { /* The query exposes the error for the retry UI. */ });
        }
    }, [radius, locationReady, hasNextPage, isFetching, error, fetchNextPage]);
    return {
        items: radius === null ? items : locationReady ? items.filter(item => withinRadius(distance(item), radius)) : [],
        searching: radius !== null && locationReady && !error && (isFetching || hasNextPage),
    };
}
