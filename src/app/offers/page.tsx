import { Suspense } from "react";
import OffersLoader from "@/components/offers/OffersLoader";
import OffersPageSkeleton from "@/components/offers/OffersPageSkeleton";



export default function OffersPage(props: {
    searchParams?: Promise<{ shopId?: string }> | { shopId?: string };
}) {
    return (
        <Suspense fallback={<OffersPageSkeleton />}>
            <OffersLoader searchParams={props.searchParams} />
        </Suspense>
    );
}
