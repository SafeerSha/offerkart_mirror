"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ArrowRight, Heart, Sparkles } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";

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
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <PremiumCard
      variant="premium"
      padding="none"
      className="group cursor-pointer h-full flex flex-col border-none overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 rounded-[2rem]"
      onClick={() => router.push(`/offer/${id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative flex-1 overflow-hidden bg-gray-100 min-h-[320px]">
        <Image
          src={image}
          alt={shopName}
          fill
          unoptimized
          className={`object-cover transition-transform duration-1000 ease-out ${isHovered ? "scale-110" : "scale-100"}`}
        />

        {/* Overlays */}
        <div className={`absolute inset-0 transition-all duration-500 bg-black/20 ${isHovered ? "opacity-100" : "opacity-0"}`} />
        <div className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80`} />

        {/* Top Actions/Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 items-start">
            {discount && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                {discount}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
              {category}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all pointer-events-auto",
              isFavorite
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "bg-white/20 text-white hover:bg-white/40"
            )}
          >
            <Heart className={cn("w-5 h-5 transition-transform", isFavorite && "fill-current scale-110")} />
          </button>
        </div>

        {/* Content Info */}
        <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
          <h4 className="text-xl font-bold text-white mb-1 drop-shadow-sm line-clamp-1">
            {shopName}
          </h4>
          <p className="text-white/80 text-sm font-medium line-clamp-2 drop-shadow-sm leading-snug">
            {offerName}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 flex items-center justify-between text-xs font-semibold bg-white border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-gray-500">
          <MapPin className="w-4 h-4 text-orange-500" />
          <span className="line-clamp-1">{location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>{validUntil}</span>
        </div>
      </div>
    </PremiumCard>
  );
};

// Helper for class names since I used 'cn' in the component but didn't import/declare it locally and it might not be available globally in the same way as in some templates
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default OfferCard;
