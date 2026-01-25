import coffeeShop from "@/assets/offers/coffee-shop.jpg";
import fashionBoutique from "@/assets/offers/fashion-boutique.jpg";
import spaWellness from "@/assets/offers/spa-wellness.jpg";
import restaurant from "@/assets/offers/restaurant.jpg";
import bakery from "@/assets/offers/bakery.jpg";
import electronics from "@/assets/offers/electronics.jpg";
import fitness from "@/assets/offers/fitness.jpg";
import jewelry from "@/assets/offers/jewelry.jpg";

export const FEATURED_SHOPS = [
    {
        id: 1,
        name: "Artisan Coffee House",
        offer: "Buy 2 Get 1 Free on All Drinks",
        image: coffeeShop,
        badge: "Featured",
        rating: 4.9,
    },
    {
        id: 2,
        name: "Bella Boutique",
        offer: "50% Off Winter Collection",
        image: fashionBoutique,
        badge: "Hot Deal",
        rating: 4.8,
    },
    {
        id: 3,
        name: "Zen Spa & Wellness",
        offer: "Couples Massage Package - $99",
        image: spaWellness,
        badge: "Limited Time",
        rating: 4.9,
    },
    {
        id: 4,
        name: "The Grand Bistro",
        offer: "3-Course Dinner for Two - $75",
        image: restaurant,
        badge: "Exclusive",
        rating: 4.7,
    },
];

export const FEATURED_OFFERS = [
    { id: 1, name: "Lulu Hypermarket", logo: coffeeShop },
    { id: 2, name: "KFC", logo: fashionBoutique },
    { id: 3, name: "Chicking", logo: spaWellness },
    { id: 4, name: "Domino's Pizza", logo: restaurant },
    { id: 5, name: "Ibis Bakery", logo: bakery },
    { id: 6, name: "Reliance Digital", logo: electronics },
    { id: 7, name: "Gold's Gym", logo: fitness },
    { id: 8, name: "Malabar Gold", logo: jewelry },
    { id: 9, name: "Starbucks", logo: coffeeShop },
    { id: 10, name: "Nike Store", logo: fashionBoutique },
    { id: 11, name: "McDonald's", logo: restaurant },
    { id: 12, name: "Adidas", logo: fashionBoutique },
    { id: 13, name: "Pizza Hut", logo: restaurant },
    { id: 14, name: "Big Bazaar", logo: coffeeShop },
    { id: 15, name: "Croma", logo: electronics },
];

export const ALL_OFFERS = [
    {
        id: 1,
        shopName: "Artisan Coffee House",
        offerName: "Buy 2 Get 1 Free on All Drinks",
        image: coffeeShop,
        category: "Food & Dining",
        location: "Downtown",
        validUntil: "2 days left",
        discount: "33% OFF",
        rating: 4.9,
    },
    {
        id: 2,
        shopName: "Bella Boutique",
        offerName: "Winter Collection Sale",
        image: fashionBoutique,
        category: "Fashion",
        location: "Midtown",
        validUntil: "1 week left",
        discount: "50% OFF",
        rating: 4.8,
    },
    {
        id: 3,
        shopName: "Zen Spa & Wellness",
        offerName: "Luxury Spa Day Package",
        image: spaWellness,
        category: "Wellness",
        location: "Uptown",
        validUntil: "5 days left",
        discount: "$99",
        rating: 4.9,
    },
    {
        id: 4,
        shopName: "The Grand Bistro",
        offerName: "3-Course Dinner Special",
        image: restaurant,
        category: "Food & Dining",
        location: "Downtown",
        validUntil: "2 weeks left",
        discount: "40% OFF",
        rating: 4.7,
    },
    {
        id: 5,
        shopName: "Urban Trends",
        offerName: "New Season Arrivals",
        image: fashionBoutique,
        category: "Fashion",
        location: "Westside",
        validUntil: "3 days left",
        discount: "20% OFF",
        rating: 4.6,
    },
    {
        id: 6,
        shopName: "Tech Haven",
        offerName: "Smartphone Accessories",
        image: electronics,
        category: "Electronics",
        location: "Tech Park",
        validUntil: "4 days left",
        discount: "Buy 1 Get 1",
        rating: 4.5,
    },
];
