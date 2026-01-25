import { Metadata } from "next";
import OfferDetailClient from "@/components/offer/OfferDetailClient";
import { getOfferById, getAllOffers } from "@/lib/api/offers";

// ISR: Revalidate every 10 minutes
export const revalidate = 600;

// Enable dynamic params for new offers
export const dynamicParams = true;

// Generate static params for popular offers at build time
export async function generateStaticParams() {
    const offers = await getAllOffers();
    // Return first 5 params
    return offers.slice(0, 5).map((offer) => ({
        id: offer.id.toString(),
    }));
}

// Generate metadata for SEO
export async function generateMetadata({
    params
}: {
    params: { id: string }
}): Promise<Metadata> {
    const offer = await getOfferById(params.id);

    return {
        title: `${offer.offerName} at ${offer.shopName} - OfferKart`,
        description: `Get ${offer.discount} at ${offer.shopName}. ${offer.description}`,
        openGraph: {
            title: `${offer.offerName} at ${offer.shopName}`,
            description: `Get ${offer.discount} at ${offer.shopName}. Valid until ${offer.validUntil}`,
            type: 'website',
            images: ['/og-image.jpg'], // Placeholder
        },
    };
}

export default async function OfferDetailPage({
    params
}: {
    params: { id: string }
}) {
    const [offer, similarOffers] = await Promise.all([
        getOfferById(params.id),
        getAllOffers()
    ]);

    // Filter similar offers to exclude current one and match logic
    const filteredSimilarOffers = similarOffers
        .filter(o => o.id.toString() !== params.id)
        .slice(0, 5);

    return <OfferDetailClient offer={offer} similarOffers={filteredSimilarOffers} />;
}
