"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
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

import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
// useSubcategories removed to avoid separate API calls
import { useTranslation } from "@/hooks/useTranslation";

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most Popular" },
  { value: "nearby", label: "Nearby" },
  { value: "discount", label: "Highest Discount" },
];

interface FilterPanelProps {
  // Controlled props
  activeCategory?: string;
  activeSubcategory?: string[];
  activeSort?: string;
  onCategoryChange?: (category: string) => void;
  onSubcategoryChange?: (subcategories: string[]) => void;
  onSortChange?: (sort: string) => void;
  onFilterChange?: (filters: { category: string; subcategory: string[]; sort: string }) => void;

  variant?: "inline" | "sidebar";
  className?: string;
}

const FilterPanel = ({
  activeCategory: propsCategory,
  activeSubcategory: propsSubcategory,
  activeSort: propsSort,
  onCategoryChange,
  onSubcategoryChange,
  onSortChange,
  onFilterChange,
  variant = "inline",
  className
}: FilterPanelProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation("common");
  const { mainCategories, categoryHierarchy, categoryLookup, getCategoryId } = useCategoryHierarchy();
  const categories = ["All", ...mainCategories];

  const sortOptions = [
    { value: "latest", label: t("catalog.sortLatest") },
    { value: "popular", label: t("catalog.sortPopular") },
    { value: "nearby", label: t("catalog.sortNearby") },
    { value: "discount", label: t("catalog.sortDiscount") },
  ];

  // Internal state as fallback for uncontrolled usage
  const [_internalCategory, _setInternalCategory] = useState("All");
  const [_internalSubcategory, _setInternalSubcategory] = useState<string[]>([]);
  const [_internalSort, _setInternalSort] = useState("latest");
  const [showFilters, setShowFilters] = useState(variant === "sidebar");

  // Use props if provided, otherwise internal state
  const category = propsCategory ?? _internalCategory;
  const subcategory = propsSubcategory ?? _internalSubcategory;
  const sort = propsSort ?? propsSort ?? _internalSort;

  const dynamicSubcategories = category !== "All" && categoryLookup && categoryLookup[category]
    ? Object.values(categoryLookup[category].subcategories)
    : [];
  const isLoadingSubcategories = false;

  const handleCategoryChange = (val: string) => {
    if (onCategoryChange) {
      onCategoryChange(val);
    } else {
      _setInternalCategory(val);
      _setInternalSubcategory([]);
      router.push(`/offers?category=${val}`);
    }
    onFilterChange?.({ category: val, subcategory: [], sort: sort });
  };

  const handleSubcategoryChange = (val: string) => {
    let next: string[];
    if (val === "All") {
      next = [];
    } else {
      next = subcategory.includes(val) ? [] : [val];
    }

    if (onSubcategoryChange) {
      onSubcategoryChange(next);
    } else {
      _setInternalSubcategory(next);
      const params = new URLSearchParams();
      params.set("category", category);
      next.forEach(sub => params.append("subcategory", sub));
      router.push(`/offers?${params.toString()}`);
    }
    onFilterChange?.({ category, subcategory: next, sort });
  };

  const handleSortChange = (val: string) => {
    if (onSortChange) {
      onSortChange(val);
    } else {
      _setInternalSort(val);
    }
    onFilterChange?.({ category, subcategory, sort: val });
  };

  const clearFilters = () => {
    if (onCategoryChange && onSubcategoryChange && onSortChange) {
      onCategoryChange("All");
      onSubcategoryChange([]);
      onSortChange("latest");
    } else {
      _setInternalCategory("All");
      _setInternalSubcategory([]);
      _setInternalSort("latest");
    }
    onFilterChange?.({ category: "All", subcategory: [], sort: "latest" });
  };

  const hasActiveFilters = category !== "All" || subcategory.length > 0;

  if (variant === "sidebar") {
    return (
      <div className={cn("space-y-8", className)}>
        {/* Sort Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-semibold">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span>
              {pathname.includes("/products")
                ? t("catalog.sortProducts")
                : t("catalog.sortOffers")}
            </span>
          </div>
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full bg-white border-gray-200 rounded-xl h-11">
              <SelectValue placeholder={t("catalog.sortBy")} />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 shadow-xl">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-900 font-semibold">
              <Tag className="w-5 h-5 text-orange-500" />
              <span>{t("catalog.categories")}</span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                {t("catalog.reset")}
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div key={cat} className="space-y-1">
                <button
                  onClick={() => handleCategoryChange(cat)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                    category === cat
                      ? "bg-orange-50 text-orange-600 font-bold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  {cat === "All" ? t("catalog.all") : cat}
                  {category === cat && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                </button>

                {/* Nested Subcategories */}
                {category === cat && cat !== "All" && dynamicSubcategories.length > 0 && (
                  <div className="flex flex-col gap-1 pl-4 pb-2 animate-in slide-in-from-top-2 fade-in duration-300">
                    <button
                      onClick={() => handleSubcategoryChange("All")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[13px] text-left transition-all",
                        subcategory.length === 0
                          ? "text-orange-600 font-semibold"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      • {t("catalog.allPrefix")}{cat}
                    </button>
                    {isLoadingSubcategories ? (
                        <div className="px-3 py-1 text-[13px] text-gray-400">{t("buttons.loading")}</div>
                    ) : (
                        dynamicSubcategories.map((sub: any) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubcategoryChange(sub.name)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[13px] text-left transition-all flex items-center justify-between group",
                              subcategory.includes(sub.name)
                                ? "text-orange-600 font-semibold"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <span>• {sub.name}</span>
                            {subcategory.includes(sub.name) && (
                              <div className="w-1 h-1 rounded-full bg-orange-500" />
                            )}
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Original Inline version for Home Page
  return (
    <div className={className}>
      {/* ... previous inline implementation (simplified for compatibility) ... */}
      <PremiumCard variant="glass" padding="none" className="mb-4">
        <div className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PremiumButton
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("rounded-xl border-border/50 transition-all", showFilters && "bg-primary text-primary-foreground")}
              >
                <Filter className="w-4 h-4 mr-2" />
                {t("catalog.filters")}
                <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", showFilters && "rotate-180")} />
              </PremiumButton>
              {hasActiveFilters && (
                <PremiumButton variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> {t("catalog.clear")}
                </PremiumButton>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-40 bg-white/50 border-gray-200 rounded-xl">
                  <SelectValue placeholder={t("catalog.sortBy")} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-xl">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in zoom-in-95 duration-200 space-y-4">
              {/* Main Categories Row */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={cn(
                      "filter-chip",
                      category === cat && "active"
                    )}
                  >
                    {cat === "All" ? t("catalog.all") : cat}
                  </button>
                ))}
              </div>

              {/* Subcategories Sliding Row (Option A) */}
              {category !== "All" && (dynamicSubcategories.length > 0 || isLoadingSubcategories) && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1 snap-x snap-mandatory">
                    {/* All Subcategories Button */}
                    <button
                      onClick={() => handleSubcategoryChange("All")}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex-shrink-0 snap-align-start",
                        subcategory.length === 0
                          ? "bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-400"
                          : "bg-white text-gray-500 border-gray-100 hover:bg-gray-50 hover:text-gray-900 dark:bg-slate-900 dark:border-slate-800"
                      )}
                    >
                      All {category}
                    </button>

                    {/* Loading indicator */}
                    {isLoadingSubcategories ? (
                      <div className="flex items-center text-xs text-gray-400 gap-1 pl-2 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-ping" />
                        <span>Loading subcategories...</span>
                      </div>
                    ) : (
                      dynamicSubcategories.map((sub: any) => {
                        const isSubActive = subcategory.includes(sub.name);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => handleSubcategoryChange(sub.name)}
                            className={cn(
                              "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer flex-shrink-0 snap-align-start",
                              isSubActive
                                ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/20"
                                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50 hover:text-gray-900 dark:bg-slate-900 dark:border-slate-800"
                            )}
                          >
                            {sub.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
};

export default FilterPanel;
