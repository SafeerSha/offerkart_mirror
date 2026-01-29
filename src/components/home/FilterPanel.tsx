"use client";

import { useState, useEffect } from "react";
import { Filter, Tag, TrendingUp, X, ChevronDown } from "lucide-react";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumCard } from "@/components/shared/PremiumCard";
import { Label } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  "All",
  "Food & Dining",
  "Fashion",
  "Wellness",
  "Electronics",
  "Jewelry",
  "Fitness",
  "Beauty",
  "Home & Garden",
  "Sports",
  "Books",
  "Automotive",
  "Health",
  "Education",
];

const subcategories = {
  "Food & Dining": ["Restaurants", "Cafes", "Fast Food", "Bakeries"],
  "Fashion": ["Clothing", "Shoes", "Accessories", "Boutiques"],
  "Wellness": ["Spa", "Massage", "Yoga", "Ayurveda"],
  "Electronics": ["Mobile", "TV", "Fridge", "Laptops"],
  "Jewelry": ["Gold", "Silver", "Diamonds", "Watches"],
  "Fitness": ["Gym", "Sports", "Equipment", "Classes"],
  "Beauty": ["Salon", "Cosmetics", "Skincare", "Makeup"],
  "Home & Garden": ["Furniture", "Decor", "Appliances", "Gardening"],
  "Sports": ["Equipment", "Clothing", "Footwear", "Accessories"],
  "Books": ["Fiction", "Non-Fiction", "Educational", "Comics"],
  "Automotive": ["Parts", "Accessories", "Services", "Tools"],
  "Health": ["Medicines", "Supplements", "Equipment", "Wellness"],
  "Education": ["Books", "Online Courses", "Stationery", "Tutoring"],
};


const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most Popular" },
  { value: "nearby", label: "Nearby" },
  { value: "discount", label: "Highest Discount" },
];

interface FilterPanelProps {
  onFilterChange?: (filters: { category: string; subcategory: string; sort: string }) => void;
}

const FilterPanel = ({ onFilterChange }: FilterPanelProps) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [activeSort, setActiveSort] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFilterChange?.({ category: activeCategory, subcategory: activeSubcategory, sort: activeSort });
  }, [activeCategory, activeSubcategory, activeSort, onFilterChange]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveSubcategory("All");
  };

  const handleSubcategoryChange = (subcategory: string) => {
    setActiveSubcategory(subcategory);
  };


  const clearFilters = () => {
    setActiveCategory("All");
    setActiveSubcategory("All");
    setActiveSort("latest");
    onFilterChange?.({ category: "All", subcategory: "All", sort: "latest" });
  };

  const hasActiveFilters = activeCategory !== "All" || activeSubcategory !== "All";

  return (
    <div className="py-6">
      <div className="container mx-auto px-4">
        {/* Main Filter Bar */}
        <PremiumCard variant="glass" padding="none" className="mb-4">
          <div className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Filter Toggle & Active Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <PremiumButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn("rounded-xl border-border/50 transition-all", showFilters && "bg-primary text-primary-foreground")}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showFilters && "rotate-180")} />
                </PremiumButton>

                {/* Active Filter Tags */}
                {activeCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {activeCategory}
                    {activeSubcategory !== "All" && ` > ${activeSubcategory}`}
                    <button
                      onClick={() => {
                        setActiveCategory("All");
                        setActiveSubcategory("All");
                        onFilterChange?.({ category: "All", subcategory: "All", sort: activeSort });
                      }}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {hasActiveFilters && (
                  <PremiumButton
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </PremiumButton>
                )}
              </div>

              {/* Right: Sort Dropdown */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <Select value={activeSort} onValueChange={setActiveSort}>
                  <SelectTrigger className="w-40 border-border/50 rounded-xl">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
                <div className="grid gap-6">
                  {/* Categories */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-primary" />
                      <Label className="text-sm font-medium">Categories</Label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`filter-chip ${activeCategory === category ? "active" : ""}`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                    {/* Subcategories */}
                    <div className="mt-4">
                      <Label className="text-xs font-medium text-muted-foreground mb-2 block">Subcategories</Label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSubcategoryChange("All")}
                          className={`filter-chip ${activeSubcategory === "All" ? "active" : ""}`}
                        >
                          All
                        </button>
                        {activeCategory !== "All" && subcategories[activeCategory as keyof typeof subcategories]?.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => handleSubcategoryChange(sub)}
                            className={`filter-chip ${activeSubcategory === sub ? "active" : ""}`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

export default FilterPanel;

