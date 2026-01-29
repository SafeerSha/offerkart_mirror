"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ArrowRight, Heart } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { Subheading, Text } from "@/components/shared/Typography";

interface OfferCardProps {
  id: number;
  shopName: string;
  offerName: string;
  image: string | StaticImageData;
  category: string;
  location: string;
  validUntil: string;
  discount?: string;
}

const OfferCard = ({
  id,
  shopName,
  offerName,
  image,
  category,
  location,
  validUntil,
  discount,
}: OfferCardProps) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <PremiumCard
      variant="premium"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border-none overflow-hidden"
      onClick={() => router.push(`/offer/${id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container - This now fills the height correctly because PremiumCard is fixed */}
      <div className="relative flex-1 overflow-hidden bg-muted/20 min-h-[300px]">
        <Image
          src={image}
          alt={shopName}
          fill
          unoptimized
          className={`object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"}`}
        />

        {/* Futuristic Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 bg-gradient-to-br from-primary/20 to-secondary/20 ${isHovered ? "opacity-100" : "opacity-0"}`} />

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-3 left-3">
            <span className="badge-futuristic text-sm font-semibold">
              {discount}
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm text-foreground border border-primary/10">
            {category}
          </span>
        </div>

        {/* Hover CTA Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <PremiumButton
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/offer/${id}`);
            }}
            className="rounded-full shadow-lg"
          >
            View Offer
            <ArrowRight className="w-4 h-4 ml-2" />
          </PremiumButton>
        </div>

        {/* Bottom Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Subheading className="text-lg font-semibold text-white mb-1 line-clamp-1">
            {shopName}
          </Subheading>
          <Text className="text-white/90 text-sm line-clamp-1">{offerName}</Text>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 flex items-center justify-between text-sm border-t border-primary/10 bg-card/30">
        <div className="flex items-center gap-1.5 text-primary/80">
          <MapPin className="w-3.5 h-3.5" />
          <span className="font-medium">{location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-primary/80">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">{validUntil}</span>
        </div>
      </div>
    </PremiumCard>
  );
};

export default OfferCard;

