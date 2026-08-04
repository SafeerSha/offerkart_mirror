import OffersLoader from "@/components/offers/OffersLoader";

export default function OffersPage(props: {
    searchParams?: Promise<{ shopId?: string }>;
}) {
    return (
        <OffersLoader searchParams={props.searchParams} />
    );
}
