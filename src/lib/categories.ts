export const CATEGORY_HIERARCHY = {
  "Electronics": ["Mobile", "TV", "Fridge", "Laptops", "Headphones", "Cameras", "Gaming"],
  "Fashion": ["Clothing", "Shoes", "Accessories", "Boutiques", "Jewelry", "Watches"],
  "Food & Dining": ["Restaurants", "Cafes", "Fast Food", "Bakeries", "Ice Cream", "Pizza"],
  "Wellness": ["Spa", "Massage", "Yoga", "Ayurveda", "Salon"],
  "Fitness": ["Gym", "Sports", "Equipment", "Classes", "Trainers"],
  "Jewelry": ["Gold", "Silver", "Diamonds", "Watches", "Fashion Jewelry"],
  "Beauty": ["Salon", "Cosmetics", "Skincare", "Makeup", "Perfumes"],
  "Grocery": ["Vegetables", "Fruits", "Dairy", "Bakery", "Snacks", "Beverages"],
  "Home & Garden": ["Furniture", "Decor", "Appliances", "Gardening"],
  "Other": []
} as const;

export const MAIN_CATEGORIES = Object.keys(CATEGORY_HIERARCHY) as (keyof typeof CATEGORY_HIERARCHY)[];
export type MainCategory = keyof typeof CATEGORY_HIERARCHY;
export type SubCategory<C extends MainCategory> = typeof CATEGORY_HIERARCHY[C][number];
