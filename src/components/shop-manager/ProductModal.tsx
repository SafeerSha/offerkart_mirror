"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ensureS3Url } from "@/lib/imageUtils";
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
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    // Tracks subcategory ID from backend until subcategories list loads
    const [pendingSubcategoryId, setPendingSubcategoryId] = useState<number | null>(null);

    const { mainCategories, categoryHierarchy, getCategoryId, resolveHierarchyById, isLoading: isCategoriesLoading } = useCategoryHierarchy();

    const activeCategoryId = category ? getCategoryId(category) : null;
    const { data: subcategoriesRes, isLoading: isLoadingSubcategories } = useSubcategories(activeCategoryId);
    const dynamicSubcategories = subcategoriesRes?.success && subcategoriesRes.data
        ? subcategoriesRes.data
        : [];

    const { data: session } = useSession();
    // Extract a stable primitive from session to avoid infinite re-render loops
    const sessionShopId = session?.shopId ?? (session?.user as any)?.shopId ?? null;
    const isEditMode = !!product && !!product.id;

    // Ref to prevent duplicate branch fetches within the same modal open
    const hasFetchedBranches = useRef(false);

    // Reset the fetch guard when modal closes
    useEffect(() => {
        if (!open) {
            hasFetchedBranches.current = false;
        }
    }, [open]);

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
        // Only fetch once per modal open
        if (hasFetchedBranches.current) return;
        hasFetchedBranches.current = true;

        const fetchBranches = async () => {
            setIsBranchesLoading(true);
            try {
                let shopId = sessionShopId;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, sessionShopId]);

    // Fix for mobile keyboard "stuck" UI bug where the window remains scrolled after keyboard dismiss
    useEffect(() => {
        if (!open) return;

        const handleBlur = () => {
            // Small timeout to check if we're actually leaving all inputs
            setTimeout(() => {
                const activeEl = document.activeElement;
                const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.tagName === "SELECT";
                if (!isInput) {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                }
            }, 100);
        };

        // We use a capture-phase listener on the form to catch all blurs
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('focusout', handleBlur);
            return () => form.removeEventListener('focusout', handleBlur);
        }
    }, [open]);

    // Form initialization — only when modal opens or product changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!open) return;

        if (isEditMode && product) {
            setName(product.name || product.displayName || "");

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
    }, [open, isEditMode, product]);

    // Category resolution — runs separately so loading state changes don't reset form fields
    useEffect(() => {
        if (!open || !isEditMode || !product || isCategoriesLoading) return;

        const apiCat = product.categoryObject || (typeof product.category === 'object' ? product.category : null);
        let catId = product.categoryId;
        let parentId = product.parentCategoryId;

        if (apiCat && apiCat.id) {
            if (apiCat.level === 2) {
                catId = apiCat.id;
                parentId = apiCat.parentId || parentId;
            } else if (apiCat.level === 1) {
                catId = apiCat.id;
                parentId = apiCat.id;
            }
        }

        const mainResolveId = parentId || catId;
        const resolved = resolveHierarchyById(mainResolveId);

        if (resolved.main) {
            setCategory(resolved.main);
        } else {
            const categoryRaw = product.category;
            if (typeof categoryRaw === "string" && isNaN(Number(categoryRaw)) && !parentId) {
                setCategory(categoryRaw);
            } else {
                setCategory("");
            }
        }

        let derivedSubId = product.subcategoryId;
        if (!derivedSubId && parentId && catId && parentId !== catId) {
            derivedSubId = catId;
        }

        if (derivedSubId) {
            setPendingSubcategoryId(Number(derivedSubId));
            setSubcategory("");
        } else if (resolved.sub) {
            setSubcategory(resolved.sub);
            setPendingSubcategoryId(null);
        } else {
            setSubcategory("");
            setPendingSubcategoryId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isEditMode, product, isCategoriesLoading]);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploadingImage(true);
            try {
                // Instantly upload to S3 in productsImage folder
                const response = await s3Api.uploadImage(file, "productsImage");
                debugger;
                if (response.success && response.data?.url) {
                    setImage(response.data.url);
                } else {
                    toast({
                        title: "Upload Failed",
                        description: response.message || "Could not upload the product image. Please try again.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error("Image upload failed:", error);
                toast({
                    title: "Upload Error",
                    description: "An unexpected error occurred during upload.",
                    variant: "destructive"
                });
            } finally {
                setIsUploadingImage(false);
                // Clear the input field value so the same file can be selected again if needed
                e.target.value = "";
            }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Lookup the final numeric categoryId
        let finalCategoryId = getCategoryId(category); // Fallback to main parent ID

        // Priority: If we have a chosen subcategory, look up its ID from the dynamic list
        if (subcategory && dynamicSubcategories.length > 0) {
            const matched = dynamicSubcategories.find((sub: any) =>
                (sub.name || sub.displayName || sub.category_name) === subcategory
            );
            if (matched) {
                finalCategoryId = matched.id;
            }
        } else if (!subcategory) {
            // Explicitly force lookup to check if getCategoryId(category, subcategory) had cached it (unlikely but safe)
            finalCategoryId = getCategoryId(category, subcategory);
        }

        const missingFields = [];
        if (!image) missingFields.push("Image");
        if (!name) missingFields.push("Product Name");
        if (!category) missingFields.push("Main Category");
        if (!subcategory) missingFields.push("Sub Category");
        if (!price) missingFields.push("Price");
        if (!validFrom) missingFields.push("Start Date");
        if (!validTo) missingFields.push("End Date");
        if (selectedBranchIds.length === 0) missingFields.push("Applicable Branches");

        if (missingFields.length > 0) {
            toast({
                title: "Required Fields Missing",
                description: `Please complete the following fields: ${missingFields.join(", ")}.`,
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = image;

            if (typeof uploadedImageUrl === 'string' && uploadedImageUrl.startsWith('data:')) {
                // Fallback for legacy base64 if somehow introduced
                const cleanUrl = await ensureS3Url(uploadedImageUrl);
                uploadedImageUrl = cleanUrl || "";
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
                isActive: status === "active", // Map status conditionally 
                validFrom: validFrom?.toISOString(),
                validTo: validTo?.toISOString(),
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
            className="sm:max-w-xl max-h-[90dvh] overflow-hidden px-4 pb-1 rounded-[32px] sm:rounded-3xl"
        >
            <form onSubmit={handleFormSubmit} className="flex flex-col h-full font-sans">
                {/* Scrollable body with exact overflow control and gradient fade cues */}
                <div className="relative flex-1 min-h-0">
                    <div className="overflow-y-auto max-h-[50dvh] px-1 pt-1 pr-2 pb-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Top row: Name & Square Image picker */}
                        <div className="flex gap-2 items-start">

                            <div className="shrink-0 flex flex-col items-center">
                                <label className="text-sm font-semibold text-gray-700 leading-tight block w-full text-center">Image *</label>
                                <div className="relative w-[52px] h-[52px] bg-gray-50/50 border border-solid border-primary/20 rounded-xl overflow-hidden flex items-center justify-center group hover:border-primary/40 transition-all cursor-pointer">
                                    {isUploadingImage ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px]">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span className="text-[8px] font-bold mt-1 text-primary">Uploading</span>
                                        </div>
                                    ) : image ? (
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
                                <label className="text-sm font-semibold text-gray-700 ml-1">Sub Category *</label>
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
                                label="Start Date *"
                                date={validFrom}
                                setDate={setValidFrom}
                                placeholder="Valid from"
                            />
                            <PremiumDatePicker
                                label="End Date *"
                                date={validTo}
                                setDate={setValidTo}
                                placeholder="Valid to"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Applicable Branches *</label>
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
                            disabled={isUploadingImage}
                        >
                            {isEditMode ? "Save Changes" : "Create Product"}
                        </PremiumButton>
                    </div>
                </div>
            </form>
        </AppModal>
    );
};
