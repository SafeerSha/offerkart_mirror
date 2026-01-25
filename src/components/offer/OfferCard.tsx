"use client";

import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, Clock, ArrowRight, Heart } from "lucide-react";

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
    <div
      className="group card-futuristic card-glow cursor-pointer h-full flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/offer/${id}`)}
    >
      {/* Image Container */}
      <div className="relative flex-1 overflow-hidden rounded-t-xl border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <Image
          src={image}
          alt={shopName}
          fill
          className={`object-cover transition-transform duration-700 ${isHovered ? "scale-110" : "scale-100"
            }`}
        />

        {/* Futuristic Overlay */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
          <div className="absolute inset-0 border border-primary/30 rounded-xl" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 95% 100%, 5% 100%, 0 85%)' }} />
        </div>

        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-3 left-3">
            <span className="badge-futuristic text-sm font-semibold">
              {discount}
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-12">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm text-foreground">
            {category}
          </span>
        </div>

        {/* Like Button */}


        {/* Hover CTA Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"
          }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/offer/${id}`);
            }}
            className="px-6 py-3 rounded-full gradient-futuristic text-primary-foreground font-medium flex items-center gap-2 transform transition-transform duration-300 hover:scale-105 border border-primary/30 backdrop-blur-sm"
          >
            View Offer
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ backgroundColor: 'rgb(152 59 59 / 50%)' }}>
          <h3 className="font-serif text-lg font-semibold text-white mb-1 line-clamp-1">
            {shopName}
          </h3>
          <p className="text-white/90 text-sm line-clamp-1">{offerName}</p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 flex items-center justify-between text-sm border-t border-primary/10 rounded-b-xl bg-card/50">
        <div className="flex items-center gap-1 text-primary">
          <MapPin className="w-3.5 h-3.5" />
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-1 text-primary">
          <Clock className="w-3.5 h-3.5" />
          <span>{validUntil}</span>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;

