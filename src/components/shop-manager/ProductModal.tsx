"use client";

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
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { s3Api } from "@/lib/api/s3";
import { toast } from "@/hooks/use-toast";
import { useSubcategories } from "@/hooks/useApi";

interface ProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: any | null; // Null when creating new
    onSubmit: (payload: any) => Promise<void>;
    availableBranches?: any[];
}

export const ProductModal = ({
    open,
    onOpenChange,
    product,
    onSubmit,
    availableBranches = []
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
    const [branches, setBranches] = useState<any[]>(availableBranches);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);

    // File handling
    const [rawFile, setRawFile] = useState<File | null>(null);
    // Tracks subcategory ID from backend until subcategories list loads
    const [pendingSubcategoryId, setPendingSubcategoryId] = useState<number | null>(null);

    const { mainCategories, categoryHierarchy, getCategoryId, resolveHierarchyById, isLoading: isCategoriesLoading } = useCategoryHierarchy();

    const activeCategoryId = category ? getCategoryId(category) : null;
    const { data: subcategoriesRes, isLoading: isLoadingSubcategories } = useSubcategories(activeCategoryId);
    const dynamicSubcategories = subcategoriesRes?.success && subcategoriesRes.data
        ? subcategoriesRes.data
        : [];

    const { data: session } = useSession();
    const isEditMode = !!product && !!product.id;

    // Update internal branches if prop updates
    useEffect(() => {
        if (availableBranches && availableBranches.length > 0) {
            setBranches(availableBranches);
        }
    }, [availableBranches]);

    useEffect(() => {
        if (!open) return;
        // Skip fetch if already provided by prop
        if (availableBranches && availableBranches.length > 0) {
            return;
        }
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
    }, [open, session, availableBranches]);

    useEffect(() => {
        if (open) {
            if (isEditMode && product) {
                setName(product.name || product.displayName || "");

                // product.category may be a string name ("Electronics") from the list mapping,
                // or a numeric categoryId from the detail API. Handle both.
                const categoryRaw = product.category;
                if (typeof categoryRaw === "string" && isNaN(Number(categoryRaw))) {
                    // It's already a display name (e.g. "Electronics")
                    setCategory(categoryRaw);
                } else {
                    // It's a numeric ID — resolve to display name
                    const categoryId = product.categoryId || categoryRaw;
                    const { main } = resolveHierarchyById(categoryId);
                    setCategory(main || "");
                }

                // Subcategory: store pending ID to match once subcategory list loads
                const rawSubId = product.subcategoryId ?? null;
                if (rawSubId) {
                    setPendingSubcategoryId(Number(rawSubId));
                    setSubcategory("");
                } else {
                    setSubcategory("");
                    setPendingSubcategoryId(null);
                }

                const currentPrice = product.price ?? product.offerPrice;
                const currentOriginalPrice = product.originalPrice ?? product.price ?? product.offerPrice;

                setPrice(currentPrice ? String(currentPrice) : "");
                setOriginalPrice(currentOriginalPrice ? String(currentOriginalPrice) : "");
                setImage(product.image || product.imageUrl || null);
                setDescription(product.description || product.displayDescription || "");
                setValidFrom(product.validFrom ? new Date(product.validFrom) : undefined);
                setValidTo(product.validTo ? new Date(product.validTo) : undefined);
                setSelectedBranchIds(product.branchIds ? product.branchIds.map(String) : []);

                // Map isActive/isHighlighted/status → internal string state
                if (product.status !== undefined) {
                    setStatus(product.status);
                } else if (product.isActive !== undefined) {
                    setStatus(product.isActive ? "active" : "inactive");
                } else if (product.isHighlighted !== undefined) {
                    setStatus(product.isHighlighted ? "active" : "inactive");
                } else {
                    setStatus("active");
                }
            } else {
                setName("");
                setCategory("");
                setSubcategory("");
                setPendingSubcategoryId(null);
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
    }, [open, isEditMode, product, isCategoriesLoading, resolveHierarchyById]);

    // When subcategories list finally loads, match the pending subcategoryId to a name
    useEffect(() => {
        if (!pendingSubcategoryId || isLoadingSubcategories) return;
        const matched = dynamicSubcategories.find(
            (sub: any) => sub.id === pendingSubcategoryId
        );
        if (matched) {
            setSubcategory(matched.name || (matched as any).displayName || "");
            setPendingSubcategoryId(null);
        }
    }, [dynamicSubcategories, isLoadingSubcategories, pendingSubcategoryId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRawFile(file); // Keep raw file for uploading
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Lookup the final numeric categoryId
        const finalCategoryId = getCategoryId(category, subcategory);

        if (!name || !finalCategoryId || !price) {
            toast({
                title: "Missing Fields",
                description: "Please select a name, category and price.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = image; // Fallback if existing

            // 1. Handle new image upload to S3
            if (rawFile) {
                const uploadRes = await s3Api.uploadImage(rawFile);
                if (uploadRes.success && uploadRes.data?.url) {
                    uploadedImageUrl = uploadRes.data.url;
                } else {
                    toast({
                        title: "Upload Failed",
                        description: "Image could not be uploaded. Creating product without image.",
                        variant: "destructive"
                    });
                }
            }

            // 2. Map and format payload for backend specs
            const backendPayload = {
                displayName: name,
                displayDescription: description || "",
                imageUrl: typeof uploadedImageUrl === 'string' ? uploadedImageUrl : "",
                categoryId: Number(finalCategoryId),
                originalPrice: originalPrice ? Number(originalPrice) : Number(price),
                offerPrice: Number(price),
                currencyId: 1, // Hardcoded standard
                branchIds: selectedBranchIds.map(id => Number(id)),
                isHighlighted: status === "active", // Map highlights conditionally 
            };

            await onSubmit(backendPayload);
        } catch (err: any) {
            console.error("Submission failed", err);
            toast({
                title: "Error",
                description: err.message || "Failed to submit product.",
                variant: "destructive"
            });
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
            className="sm:max-w-xl max-h-[90vh] overflow-hidden px-4 pb-1"
        >
            <form onSubmit={handleFormSubmit} className="flex flex-col h-full font-sans">
                {/* Scrollable body with exact overflow control and gradient fade cues */}
                <div className="relative flex-1 min-h-0">
                    <div className="overflow-y-auto max-h-[55vh] px-1 pt-1 pr-2 pb-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Top row: Name & Square Image picker */}
                        <div className="flex gap-2 items-start">

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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setImage(null);
                                                        setRawFile(null);
                                                    }}
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
                                <SearchableSelect
                                    options={mainCategories}
                                    value={category}
                                    onChange={(val) => {
                                        setCategory(val);
                                        setSubcategory("");
                                    }}
                                    placeholder="Select Category"
                                    isLoading={isCategoriesLoading}
                                    allowCustom={false}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Sub Category</label>
                                <SearchableSelect
                                    options={dynamicSubcategories.map((sub: any) => sub.name)}
                                    value={subcategory}
                                    onChange={(val) => setSubcategory(val)}
                                    placeholder={isLoadingSubcategories ? "Loading..." : "Select Subcategory"}
                                    disabled={!category || isLoadingSubcategories}
                                    isLoading={isLoadingSubcategories}
                                    allowCustom={false}
                                />
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
