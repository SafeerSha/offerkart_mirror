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
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
        badge: "Featured",
        rating: 4.9,
    },
    {
        id: 2,
        name: "Bella Boutique",
        offer: "50% Off Winter Collection",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
        badge: "Hot Deal",
        rating: 4.8,
    },
    {
        id: 3,
        name: "Zen Spa & Wellness",
        offer: "Couples Massage Package - $99",
        image: "https://images.unsplash.com/photo-1544161515-4ae6ce6fe858?q=80&w=800&auto=format&fit=crop",
        badge: "Limited Time",
        rating: 4.9,
    },
    {
        id: 4,
        name: "The Grand Bistro",
        offer: "3-Course Dinner for Two - $75",
        image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
        badge: "Exclusive",
        rating: 4.7,
    },
];

export const FEATURED_OFFERS = [
    { id: 1, name: "Lulu Hypermarket", logo: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop" },
    { id: 2, name: "KFC", logo: "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?q=80&w=200&auto=format&fit=crop" },
    { id: 3, name: "Chicking", logo: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop" },
    { id: 4, name: "Domino's Pizza", logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop" },
    { id: 5, name: "Ibis Bakery", logo: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop" },
    { id: 6, name: "Reliance Digital", logo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=200&auto=format&fit=crop" },
    { id: 7, name: "Gold's Gym", logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop" },
    { id: 8, name: "Malabar Gold", logo: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=200&auto=format&fit=crop" },
    { id: 9, name: "Starbucks", logo: "https://images.unsplash.com/photo-1544787210-2211d44b565a?q=80&w=200&auto=format&fit=crop" },
    { id: 10, name: "Nike Store", logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop" },
    { id: 11, name: "McDonald's", logo: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=200&auto=format&fit=crop" },
    { id: 12, name: "Adidas", logo: "https://images.unsplash.com/photo-1628253747716-0c4f5c90f753?q=80&w=200&auto=format&fit=crop" },
    { id: 13, name: "Pizza Hut", logo: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=200&auto=format&fit=crop" },
    { id: 14, name: "Big Bazaar", logo: "https://images.unsplash.com/photo-1534452203294-46c8ad093716?q=80&w=200&auto=format&fit=crop" },
    { id: 15, name: "Croma", logo: "https://images.unsplash.com/photo-1526738549149-8e07eca0395c?q=80&w=200&auto=format&fit=crop" },
];

export const ALL_OFFERS = [
    {
        id: 1,
        shopName: "Artisan Coffee House",
        offerName: "Buy 2 Get 1 Free on All Drinks",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800&auto=format&fit=crop",
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
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
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
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop",
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
        image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=800&auto=format&fit=crop",
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
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=800&auto=format&fit=crop",
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
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
        category: "Electronics",
        location: "Tech Park",
        validUntil: "4 days left",
        discount: "Buy 1 Get 1",
        rating: 4.5,
    },
];
