import React, { useState, useEffect } from "react";
import { AppModal } from "@/components/shared/AppModal";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Package, Tag, IndianRupee, Image as ImageIcon, Plus, Check, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getBranches } from "@/lib/api/branch";
import { getMyShops } from "@/lib/api/shop";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";

interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any | null; // Null when creating new
    onSubmit: (payload: any) => Promise<void>;
}

export const ProductModal = ({
    open,
    onOpenChange,
    product,
    onSubmit,
}: ProductModalProps) => {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [price, setPrice] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [image, setImage] = useState<any>(null);
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Fields
    const [validFrom, setValidFrom] = useState<Date | undefined>(undefined);
    const [validTo, setValidTo] = useState<Date | undefined>(undefined);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("active");
    const [branches, setBranches] = useState<any[]>([]);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);

    const { data: session } = useSession();
    const isEditMode = !!product && !!product.id;

    const mainCategories = [
        "Groceries",
        "Fashion & Apparel",
        "Electronics",
        "Footwear",
        "Books & Stationery",
        "Home & Kitchen",
        "Beauty & Personal Care",
        "Health & Wellness",
        "Sports & Fitness",
        "Toys & Games",
        "Others",
    ];

    const subCategoriesMap: { [key: string]: string[] } = {
        "Groceries": ["Vegetables & Fruits", "Snacks & Beverages", "Staples & Grains", "Dairy & Eggs", "Household & Cleaning"],
        "Fashion & Apparel": ["Men's Wear", "Women's Wear", "Kids & Infants", "Ethnic Wear", "Accessories"],
        "Electronics": ["Mobile Phones", "Computers & Laptops", "Home Audio & Video", "Smart Devices", "Gaming Accessories"],
        "Footwear": ["Men's Shoes", "Women's Shoes", "Kids' Shoes", "Sports Footwear", "Sandals & Slippers"],
        "Books & Stationery": ["Academic & Textbooks", "Fiction & Novels", "Notebooks & Diaries", "Art & Craft Supplies", "Office Supplies"],
        "Home & Kitchen": ["Cookware & Kitchenware", "Home Décor", "Furnishing & Bedding", "Appliances", "Tools & Hardware"],
        "Beauty & Personal Care": ["Skincare", "Haircare", "Fragrances", "Make Up", "Oral & Personal Hygiene"],
        "Health & Wellness": ["Fitness Supplements", "First Aid & Medicine", "Ayurveda & Organic", "Healthcare Devices", "Personal Wellness"],
        "Sports & Fitness": ["Fitness Equipment", "Outdoor Sports", "Indoor Games", "Sports Wear", "Gym Accessories"],
        "Toys & Games": ["Board Games", "Action Figures", "Puzzles & Building Blocks", "Remote Controlled Toys", "Educational Toys"],
        "Others": ["General Merchandise", "Seasonal Specials", "Gifting Items"]
    };

    useEffect(() => {
        if (!open) return;
        const fetchBranches = async () => {
            setIsBranchesLoading(true);
            try {
                let shopId = session?.shopId ?? (session?.user as any)?.shopId;
                if (!shopId) {
                    const shopRes = await getMyShops();
                    if (shopRes.success && shopRes.data) {
                        const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                        if (shopList.length > 0) shopId = shopList[0].id;
                    }
                }

                if (!shopId) {
                    setBranches([]);
                    return;
                }

                const res = await getBranches(shopId);
                if (res.success && res.data) {
                    const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
                    setBranches(Array.isArray(list) ? list : []);
                }
            } catch (error) {
                console.error("Failed to load branches:", error);
            } finally {
                setIsBranchesLoading(false);
            }
        };

        fetchBranches();
    }, [open, session]);

    useEffect(() => {
        if (open) {
            if (isEditMode) {
                setName(product.name || "");
                setCategory(product.category || "");
                setSubcategory(product.subcategory || "");
                setPrice(product.price ? String(product.price) : "");
                setOriginalPrice(product.originalPrice ? String(product.originalPrice) : "");
                setImage(product.image || null);
                setDescription(product.description || "");
                setValidFrom(product.validFrom ? new Date(product.validFrom) : undefined);
                setValidTo(product.validTo ? new Date(product.validTo) : undefined);
                setSelectedBranchIds(product.branchIds ? product.branchIds.map(String) : []);
                setStatus(product.status || "active");
            } else {
                setName("");
                setCategory("");
                setSubcategory("");
                setPrice("");
                setOriginalPrice("");
                setImage(null);
                setDescription("");
                setValidFrom(undefined);
                setValidTo(undefined);
                setSelectedBranchIds([]);
                setStatus("active");
            }
        }
    }, [open, isEditMode, product]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !category || !price) {
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name,
                category,
                subcategory,
                price: parseFloat(price),
                originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
                image,
                description,
                validFrom: validFrom ? validFrom.toISOString() : undefined,
                validTo: validTo ? validTo.toISOString() : undefined,
                branchIds: selectedBranchIds,
                status,
            };
            await onSubmit(payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    const branchOptions = branches.map(b => ({
        label: b.name || b.address || `Branch ${b.id}`,
        value: String(b.id)
    }));

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            title={isEditMode ? "Edit Product" : "Add New Product"}
            description={isEditMode ? "Modify your product information." : "Create a new product listing for your shop catalog."}
            className="sm:max-w-xl max-h-[90vh] overflow-hidden p-4"
        >
            <form onSubmit={handleFormSubmit} className="flex flex-col h-full font-sans">
                {/* Scrollable body with exact overflow control and gradient fade cues */}
                <div className="relative flex-1 min-h-0">
                    <div className="overflow-y-auto max-h-[55vh] px-1 pt-1 pr-2 pb-6 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Top row: Name & Square Image picker */}
                        <div className="flex gap-4 items-start">

                            <div className="shrink-0 flex flex-col items-center">
                                <label className="text-sm font-semibold text-gray-700 leading-tight block w-full text-center">Image</label>
                                <div className="relative w-[52px] h-[52px] bg-gray-50/50 border border-solid border-primary/20 rounded-xl overflow-hidden flex items-center justify-center group hover:border-primary/40 transition-all cursor-pointer">
                                    {image ? (
                                        <>
                                            <Image src={image} alt="Product preview" fill unoptimized className="object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); document.getElementById("product-image-upload")?.click(); }}
                                                    className="p-1 rounded-full bg-white/90 hover:bg-white text-primary transition-all hover:scale-105"
                                                    title="Change image"
                                                >
                                                    <ImageIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setImage(null); }}
                                                    className="p-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all hover:scale-105"
                                                    title="Remove image"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => document.getElementById("product-image-upload")?.click()}
                                            className="absolute inset-0 flex flex-col items-center justify-center text-primary/40 hover:text-primary transition-colors gap-1 bg-white/50 backdrop-blur-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[9px] font-bold leading-none">Add</span>
                                        </button>
                                    )}
                                    <input
                                        id="product-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <PremiumInput
                                    label="Product Name *"
                                    placeholder="Premium Cotton T-Shirt"
                                    icon={Package}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Existing category layout */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Main Category *</label>
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 bg-background/40 border border-primary/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all rounded-xl text-sm h-10 appearance-none bg-white/50 backdrop-blur-sm"
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            setSubcategory("");
                                        }}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {mainCategories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Sub Category</label>
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary pointer-events-none" />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 bg-background/40 border border-primary/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all rounded-xl text-sm h-10 appearance-none bg-white/50 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                        disabled={!category || !subCategoriesMap[category]}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {category && subCategoriesMap[category]?.map((sub) => (
                                            <option key={sub} value={sub}>
                                                {sub}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumInput
                                label="Price (₹) *"
                                type="number"
                                step="0.01"
                                placeholder="499"
                                icon={IndianRupee}
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />

                            <PremiumInput
                                label="Original Price (₹)"
                                type="number"
                                step="0.01"
                                placeholder="799"
                                icon={IndianRupee}
                                value={originalPrice}
                                onChange={(e) => setOriginalPrice(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <PremiumDatePicker
                                label="Start Date"
                                date={validFrom}
                                setDate={setValidFrom}
                                placeholder="Valid from"
                            />
                            <PremiumDatePicker
                                label="End Date"
                                date={validTo}
                                setDate={setValidTo}
                                placeholder="Valid to"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Applicable Branches</label>
                            <MultiSearchableSelect
                                options={branchOptions}
                                selectedValues={selectedBranchIds}
                                onChange={setSelectedBranchIds}
                                placeholder="Select branches..."
                                isLoading={isBranchesLoading}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Product Description</label>
                            <textarea
                                className="w-full px-3 py-2 bg-background/40 border border-primary/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:outline-none transition-all rounded-xl text-sm min-h-[70px] bg-white/50 backdrop-blur-sm"
                                placeholder="Add clear product features, size, and details."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bottom fade indicator cue */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
                </div>

                {/* Fixed Footer with the status toggle button at the left end */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-primary/5 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">Status:</span>
                        <div className="flex items-center h-8 bg-white/50 backdrop-blur-sm rounded-xl">
                            <StatusToggleButton
                                status={status === "active" ? "active" : "paused"}
                                onChange={(s) => setStatus(s === "active" ? "active" : "inactive")}
                            />
                        </div>
                        <span className={status === "active" ? "text-emerald-500 font-bold text-xs" : "text-gray-400 font-bold text-xs"}>
                            {status === "active" ? "Active" : "Inactive"}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <PremiumButton
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl px-4 h-9 text-xs"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </PremiumButton>
                        <PremiumButton
                            type="submit"
                            className="rounded-xl px-5 h-9 text-xs min-w-[110px]"
                            isLoading={isSubmitting}
                        >
                            {isEditMode ? "Save Changes" : "Create Product"}
                        </PremiumButton>
                    </div>
                </div>
            </form>
        </AppModal>
    );
};
