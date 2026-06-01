import { Metadata } from "next";
import OfferDetailClient from "@/components/offer/OfferDetailClient";
import { notFound } from "next/navigation";
import { getAllUserOffers, getUserOfferById, getPaginatedOffers } from "@/lib/api/offers";
import { Offer } from "@/lib/types/offer";

// ISR: Revalidate every 10 minutes
export const revalidate = 600;

// Enable dynamic params for new offers
export const dynamicParams = true;

// Generate static params for popular offers at build time
export async function generateStaticParams() {
    const offersResult = await getAllUserOffers({ limit: 100 });
    const offers = offersResult.success ? offersResult.data : [];
    // Return first 5 params
    return offers.slice(0, 5).map((offer) => ({
        id: String(offer.id),
    }));
}

function mapOfferForDetail(offer: Offer) {
    const primaryImage = offer.posters?.[0]?.posterSrc || (typeof offer.image === "string" ? offer.image : undefined) || "/images/shop-registration-bg-light.png";
    const idAsNum = Number(offer.id);
    const finalId = isNaN(idAsNum) ? offer.id : idAsNum;

    return {
        id: finalId as any,
        shopName: offer.shopName || "OfferKart",
        offerName: offer.offerName || offer.title || "Untitled Offer",
        images: [primaryImage],
        posters: offer.posters,
        category: offer.category || "Offers",
        location: offer.location || "Location unavailable",
        validFrom: offer.validFrom || "",
        validTo: offer.validTo || "",
        discount: offer.discount || "Live now",
        rating: 0,
        reviews: 0,
        price: "",
        originalPrice: "",
        branchName: offer.branchNames?.[0],
    };
}

function mapOfferForSimilarCard(offer: Offer) {
    const idAsNum = Number(offer.id);
    const finalId = isNaN(idAsNum) ? offer.id : idAsNum;

    return {
        id: finalId as any,
        shopName: offer.shopName || "OfferKart",
        offerName: offer.offerName || offer.title || "Untitled Offer",
        image: typeof offer.image === "string" ? offer.image : offer.posters?.[0]?.posterSrc || "/images/shop-registration-bg-light.png",
        posters: offer.posters,
        category: offer.category || "Offers",
        location: offer.location || "Location unavailable",
        validFrom: offer.validFrom || "",
        validTo: offer.validTo || "",
        discount: offer.discount,
        branchName: offer.branchNames?.[0],
        daysLeft: offer.daysLeft,
    };
}

// Generate metadata for SEO
export async function generateMetadata({
    params
}: {
    params: { id: string }
}): Promise<Metadata> {
    const offerResult = await getUserOfferById(params.id).catch(() => ({ success: false, data: null }));
    const offer = offerResult?.data;

    if (!offer) {
        return {
            title: "Offer details - OfferKart",
            description: "View offer details and interactive posters on OfferKart.",
        };
    }

    return {
        title: `${offer.offerName || offer.title} at ${offer.shopName} - OfferKart`,
        description: offer.description || `${offer.offerName || offer.title} from ${offer.shopName}`,
        openGraph: {
            title: `${offer.offerName || offer.title} at ${offer.shopName}`,
            description: offer.discount || offer.description || `${offer.offerName || offer.title} from ${offer.shopName}`,
            type: 'website',
            images: [offer.posterSrc || (typeof offer.image === "string" ? offer.image : "/og-image.jpg")],
        },
    };
}

export default async function OfferDetailPage({
    params
}: {
    params: { id: string }
}) {
    const [offerResult, similarOffersResult] = await Promise.all([
        getUserOfferById(params.id),
        getPaginatedOffers(1, 8),
    ]);

    if (!offerResult.data) {
        notFound();
    }

    const similarOffers = similarOffersResult.success ? similarOffersResult.data : [];
    const filteredSimilarOffers = similarOffers
        .filter((o) => String(o.id) !== params.id)
        .slice(0, 5)
        .map(mapOfferForSimilarCard);

    return <OfferDetailClient offer={mapOfferForDetail(offerResult.data)} similarOffers={filteredSimilarOffers} />;
}
