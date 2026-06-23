"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
    Package,
    Tag,
    IndianRupee,
    Image as ImageIcon,
    Plus,
    Check,
    Loader2,
    X,
    AlertTriangle,
    UploadCloud,
    Trash2,
    Calendar,
    ArrowLeft,
    Sparkles,
    Eye,
    Upload
} from "lucide-react";

import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { PremiumDatePicker } from "@/components/shared/PremiumDatePicker";
import { SearchableSelect } from "@/components/shared/SearchableSelect";
import { MultiSearchableSelect } from "@/components/shared/MultiSearchableSelect";
import { StatusToggleButton } from "@/components/shared/StatusToggleButton";
import { AppModal } from "@/components/shared/AppModal";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import ProductCard from "@/components/products/ProductCard";

import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useSubcategories } from "@/hooks/useApi";
import { getBranches } from "@/lib/api/branch";
import { getMyShops } from "@/lib/api/shop";
import { s3Api } from "@/lib/api/s3";
import { ensureS3Url } from "@/lib/imageUtils";
import { useMyShops } from "@/hooks";
import { toast } from "sonner";

interface ProductFormProps {
    product: any | null; // Null when creating new
    onSubmit: (payload: any) => Promise<void>;
    onCancel: () => void;
}

export const ProductForm = ({
    product,
    onSubmit,
    onCancel,
}: ProductFormProps) => {
    const { data: session } = useSession();
    const sessionShopId = session?.shopId ?? (session?.user as any)?.shopId ?? null;
    const isEditMode = !!product && !!product.id;

    // Form state
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [subcategory, setSubcategory] = useState("");
    const [price, setPrice] = useState("");
    const [originalPrice, setOriginalPrice] = useState("");
    const [image, setImage] = useState<any>(null);
    const [productDescription, setProductDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

    // New Fields
    const [validFrom, setValidFrom] = useState<Date | undefined>(undefined);
    const [validTo, setValidTo] = useState<Date | undefined>(undefined);
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
    const [status, setStatus] = useState<string>("active");
    const [branches, setBranches] = useState<any[]>([]);
    const [isBranchesLoading, setIsBranchesLoading] = useState(false);
    const [resolvedShopId, setResolvedShopId] = useState<string | null>(null);

    // File/Image upload handling
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
    const [isEnlargedPreviewOpen, setIsEnlargedPreviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Tracks subcategory ID from backend until subcategories list loads
    const [pendingSubcategoryId, setPendingSubcategoryId] = useState<number | null>(null);

    const { mainCategories, categoryHierarchy, getCategoryId, resolveHierarchyById, isLoading: isCategoriesLoading } = useCategoryHierarchy();

    const activeCategoryId = category ? getCategoryId(category) : null;
    const { data: subcategoriesRes, isLoading: isLoadingSubcategories } = useSubcategories(activeCategoryId);
    const dynamicSubcategories = subcategoriesRes?.success && subcategoriesRes.data
        ? subcategoriesRes.data
        : [];

    // Fetch active shop name for preview
    const { data: shopsResponse } = useMyShops();
    const shops = useMemo(() => {
        if (!shopsResponse?.success || !shopsResponse?.data) return [];
        const result = shopsResponse.data as any;
        return Array.isArray(result) ? result : (result.data || []);
    }, [shopsResponse]);
    const shopName = useMemo(() => {
        return shops[0]?.shop_name || "Your Shop";
    }, [shops]);

    // Fetch branches
    const fetchBranches = useCallback(async (force = false) => {
        setIsBranchesLoading(true);
        try {
            let shopId = sessionShopId;
            if (!shopId && shops.length > 0) {
                shopId = shops[0].id;
            } else if (!shopId) {
                const shopRes = await getMyShops();
                if (shopRes.success && shopRes.data) {
                    const shopList = Array.isArray(shopRes.data) ? shopRes.data : (shopRes.data as any).data || [];
                    if (shopList.length > 0) shopId = shopList[0].id;
                }
            }

            if (!shopId) {
                setBranches([]);
                setResolvedShopId(null);
                return;
            }
            setResolvedShopId(String(shopId));

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
    }, [sessionShopId, shops]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    // Form initialization — runs when product changes
    useEffect(() => {
        if (isEditMode && product) {
            setName(product.name || product.displayName || "");

            const currentPrice = product.price ?? product.offerPrice;
            const currentOriginalPrice = product.originalPrice ?? product.price ?? product.offerPrice;

            setPrice(currentPrice ? String(currentPrice) : "");
            setOriginalPrice(currentOriginalPrice ? String(currentOriginalPrice) : "");
            setImage(product.image || product.imageUrl || null);
            setProductDescription(product.description || product.displayDescription || "");
            setValidFrom(product.validFrom ? new Date(product.validFrom) : undefined);
            setValidTo(product.validTo ? new Date(product.validTo) : undefined);
            setSelectedBranchIds(product.branchIds ? product.branchIds.map(String) : []);

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
            setProductDescription("");
            setValidFrom(new Date());
            setValidTo(undefined);
            setSelectedBranchIds([]);
            setStatus("active");
        }
        setIsDirty(false);
    }, [isEditMode, product]);

    // Category resolution
    useEffect(() => {
        if (!isEditMode || !product || isCategoriesLoading) return;

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
    }, [isEditMode, product, isCategoriesLoading, resolveHierarchyById]);

    // Match pending subcategoryId
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

    // File Upload Handler
    const handleUploadFile = async (file: File) => {
        setIsUploadingImage(true);
        try {
            const response = await s3Api.uploadImage(file, "productsImage");
            if (response.success && response.data?.url) {
                setImage(response.data.url);
                setIsDirty(true);
                toast.success("Image uploaded successfully");
            } else {
                toast.error(response.message || "Could not upload the product image.");
            }
        } catch (error) {
            console.error("Image upload failed:", error);
            toast.error("An unexpected error occurred during image upload.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleUploadFile(file);
            e.target.value = ""; // Reset
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.type.startsWith("image/")) {
                handleUploadFile(file);
            } else {
                toast.error("Please drop an image file.");
            }
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let finalCategoryId = getCategoryId(category);

        if (subcategory && dynamicSubcategories.length > 0) {
            const matched = dynamicSubcategories.find((sub: any) =>
                (sub.name || sub.displayName || sub.category_name) === subcategory
            );
            if (matched) {
                finalCategoryId = matched.id;
            }
        } else if (!subcategory) {
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
            toast.error(`Please complete the following fields: ${missingFields.join(", ")}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = image;

            if (typeof uploadedImageUrl === 'string' && uploadedImageUrl.startsWith('data:')) {
                const cleanUrl = await ensureS3Url(uploadedImageUrl);
                uploadedImageUrl = cleanUrl || "";
            }

            const priceNum = Number(price);
            const originalPriceNum = originalPrice ? Number(originalPrice) : priceNum;

            if (originalPrice && priceNum >= originalPriceNum) {
                toast.error("Offer price must be less than original price");
                setIsSubmitting(false);
                return;
            }

            const backendPayload = {
                displayName: name,
                displayDescription: productDescription || "",
                imageUrl: typeof uploadedImageUrl === 'string' ? uploadedImageUrl : "",
                categoryId: Number(finalCategoryId),
                originalPrice: originalPriceNum,
                offerPrice: priceNum,
                currencyId: 1,
                branchIds: selectedBranchIds.map(id => Number(id)),
                isActive: status === "active",
                validFrom: validFrom?.toISOString(),
                validTo: validTo?.toISOString(),
            };

            await onSubmit(backendPayload);
            setIsDirty(false);
        } catch (err: any) {
            console.error("Submission failed", err);
            toast.error(err.message || "Failed to submit product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelClick = () => {
        if (isDirty) {
            setShowConfirmDiscard(true);
        } else {
            onCancel();
        }
    };

    const branchOptions = branches.map(b => ({
        label: b.branch_name || b.branchName || b.name || `Branch ${b.id}`,
        value: String(b.id)
    }));

    // Calculate saving percentage for preview
    const savingPercentage = useMemo(() => {
        const offer = Number(price);
        const original = originalPrice ? Number(originalPrice) : 0;
        if (original && offer && original > offer) {
            return Math.round(((original - offer) / original) * 100);
        }
        return 0;
    }, [price, originalPrice]);

    return (
        <div className="container mx-auto px-4 max-w-6xl">
            {/* Header section with back navigation */}
            <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", href: "/shop-manager" },
                            { label: "Products", href: "/shop-manager/products" },
                            { label: isEditMode ? "Edit Product" : "Add Product" }
                        ]}
                    />
                </div>

                <PremiumButton
                    variant="outline"
                    onClick={handleCancelClick}
                    className="rounded-xl h-10 px-4 flex items-center gap-1.5 border-gray-200 text-gray-650 hover:bg-gray-50 active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to List
                </PremiumButton>
            </div>

            {/* Split layout: Form on Left, Live Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Form fields */}
                <form onSubmit={handleFormSubmit} className="lg:col-span-2 space-y-3">
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-100/50 space-y-6">

                        {/* Inline Image Uploader zone */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block pl-1">
                                Product Image <span className="text-red-500">*</span>
                            </label>

                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !image && fileInputRef.current?.click()}
                                className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-h-[220px] ${image
                                    ? "border-transparent bg-gray-50"
                                    : isDragging
                                        ? "border-orange-500 bg-orange-50/30"
                                        : "border-gray-200 bg-gray-50/30 hover:border-orange-400/50 hover:bg-orange-50/10 cursor-pointer"
                                    }`}
                            >
                                {isUploadingImage ? (
                                    <div className="flex flex-col items-center justify-center p-6 space-y-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                        <p className="text-sm font-bold text-orange-600">Uploading product image...</p>
                                    </div>
                                ) : image ? (
                                    <div className="relative w-full h-[260px]">
                                        <Image
                                            src={image}
                                            alt="Uploaded preview"
                                            fill
                                            unoptimized
                                            className="object-contain bg-white"
                                        />

                                        {/* Premium overlay tools for editing */}
                                        <div className="absolute bottom-2 right-2 z-20 flex gap-1.5 lg:bottom-auto lg:right-auto lg:inset-0 lg:bg-black/25 lg:opacity-0 lg:hover:opacity-100 lg:transition-opacity lg:duration-200 lg:flex lg:items-center lg:justify-center lg:gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 w-8 h-8 rounded-lg border border-gray-200 shadow-sm transition-all active:scale-95 duration-150 flex items-center justify-center"
                                                title="Reupload Image"
                                            >
                                                <Upload className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsEnlargedPreviewOpen(true);
                                                }}
                                                className="bg-gray-900 hover:bg-black text-white w-8 h-8 rounded-lg shadow-sm transition-all active:scale-95 duration-150 flex items-center justify-center"
                                                title="View Image"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center flex flex-col items-center space-y-3 select-none">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-500/5 flex items-center justify-center text-orange-500 border border-orange-500/10">
                                            <UploadCloud className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm text-gray-800">
                                                Drag & drop your product image here, or <span className="text-orange-500 hover:underline">browse</span>
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Supports PNG, JPG, JPEG (Max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {/* Title Input */}
                        <PremiumInput
                            label="Product Name *"
                            placeholder="e.g., Premium Wireless Headphones"
                            icon={Package}
                            value={name}
                            onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                            required
                        />

                        {/* Category Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 pl-1 block">Main Category *</label>
                                <SearchableSelect
                                    options={mainCategories}
                                    value={category}
                                    onChange={(val) => {
                                        setCategory(val);
                                        setSubcategory("");
                                        setIsDirty(true);
                                    }}
                                    placeholder="Select Category"
                                    isLoading={isCategoriesLoading}
                                    allowCustom={false}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 pl-1 block">Sub Category *</label>
                                <SearchableSelect
                                    options={dynamicSubcategories.map((sub: any) => sub.name)}
                                    value={subcategory}
                                    onChange={(val) => { setSubcategory(val); setIsDirty(true); }}
                                    placeholder={isLoadingSubcategories ? "Loading subcategories..." : "Select Subcategory"}
                                    disabled={!category || isLoadingSubcategories}
                                    isLoading={isLoadingSubcategories}
                                    allowCustom={false}
                                />
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PremiumInput
                                label="Offer Price (₹) *"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 499"
                                icon={IndianRupee}
                                value={price}
                                onChange={(e) => { setPrice(e.target.value); setIsDirty(true); }}
                                required
                            />

                            <PremiumInput
                                label="Original Price (₹)"
                                type="number"
                                step="0.01"
                                placeholder="e.g., 799"
                                icon={IndianRupee}
                                value={originalPrice}
                                onChange={(e) => { setOriginalPrice(e.target.value); setIsDirty(true); }}
                            />
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PremiumDatePicker
                                label="Start Date *"
                                date={validFrom}
                                setDate={(date) => { setValidFrom(date); setIsDirty(true); }}
                                placeholder="Valid from"
                                minDate={new Date()}
                            />
                            <PremiumDatePicker
                                label="End Date *"
                                date={validTo}
                                setDate={(date) => { setValidTo(date); setIsDirty(true); }}
                                placeholder="Valid to"
                                minDate={validFrom || new Date()}
                            />
                        </div>

                        {/* Branches Select */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 pl-1 block">Applicable Branches *</label>
                            <MultiSearchableSelect
                                options={branchOptions}
                                selectedValues={selectedBranchIds}
                                onChange={(val) => { setSelectedBranchIds(val); setIsDirty(true); }}
                                placeholder="Select branches where this product is available..."
                                isLoading={isBranchesLoading}
                                emptyAction={
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const shopId = resolvedShopId || sessionShopId;
                                            if (shopId) {
                                                window.open(`/shop-manager/${shopId}/add-branch`, "_blank");
                                            } else {
                                                window.open(`/shop-manager`, "_blank");
                                            }
                                        }}
                                        className="text-xs font-bold text-orange-600 hover:underline mt-0.5 cursor-pointer block"
                                    >
                                        Add Branch +
                                    </button>
                                }
                            />
                            {branches.length === 0 && !isBranchesLoading && (
                                <div className="flex items-center justify-between p-3 mt-1.5 rounded-xl border border-dashed border-orange-500/20 bg-orange-500/5 text-xs text-gray-600 animate-in fade-in duration-200">
                                    <div className="flex items-center gap-1.5 font-medium">
                                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                                        <span>No branches available. You must add a branch first.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const shopId = resolvedShopId || sessionShopId;
                                            if (shopId) {
                                                window.open(`/shop-manager/${shopId}/add-branch`, "_blank");
                                            } else {
                                                window.open(`/shop-manager`, "_blank");
                                            }
                                        }}
                                        className="text-orange-600 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                                    >
                                        Add Branch +
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 pl-1 block">Product Description</label>
                            <textarea
                                className="w-full px-4 py-3 bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-50/50 focus:outline-none transition-all rounded-xl text-sm min-h-[110px]"
                                placeholder="Describe product details, sizes, colors, material, features..."
                                value={productDescription}
                                onChange={(e) => { setProductDescription(e.target.value); setIsDirty(true); }}
                            />
                        </div>

                        {/* Status Select */}
                        <div className="flex items-center justify-between py-4 border-t border-gray-100 flex-wrap gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-bold text-gray-800 block">Product Status</label>
                                <span className="text-xs text-gray-400">Specify whether this product is active in shop catalog</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center h-8 bg-gray-50 px-2 rounded-xl">
                                    <StatusToggleButton
                                        status={status === "active" ? "active" : "paused"}
                                        onChange={(s) => { setStatus(s === "active" ? "active" : "inactive"); setIsDirty(true); }}
                                    />
                                </div>
                                <span className={`font-bold text-sm ${status === "active" ? "text-emerald-600" : "text-gray-400"}`}>
                                    {status === "active" ? "Active" : "Inactive"}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <PremiumButton
                            type="button"
                            variant="outline"
                            onClick={handleCancelClick}
                            className="rounded-lg h-9 px-4 text-xs font-semibold"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </PremiumButton>

                        <PremiumButton
                            type="submit"
                            className="rounded-lg h-9 px-5 text-xs font-semibold shadow-md shadow-orange-500/10"
                            isLoading={isSubmitting}
                            disabled={isUploadingImage}
                        >
                            {isEditMode ? "Save Changes" : "Create Product"}
                        </PremiumButton>
                    </div>
                </form>

                {/* Sticky Right Preview column */}
                <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-32">
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl shadow-gray-100/50 space-y-5">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Live Customer Preview
                            </h3>
                            <p className="text-xs text-gray-400 leading-snug">
                                This card displays in real-time exactly how users will view this product in deals catalog.
                            </p>
                        </div>

                        {/* Consumer Card Mock Container */}
                        <div className="border border-gray-50 rounded-2xl p-4 bg-gray-50/50 flex justify-center">
                            <div className="w-[230px] shadow-lg rounded-2xl bg-white overflow-hidden shrink-0">
                                <ProductCard
                                    id={0}
                                    name={name || "Premium Wireless Headphones"}
                                    shopName={shopName}
                                    price={Number(price) || 0}
                                    originalPrice={originalPrice ? Number(originalPrice) : undefined}
                                    image={image}
                                    category={category}
                                    subcategory={subcategory}
                                    savingPercentage={savingPercentage}
                                />
                            </div>
                        </div>

                        {/* Real-time Summary Card details */}
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                                Summary details
                            </h4>

                            <div className="grid grid-cols-3 text-xs gap-y-2.5">
                                <div className="text-gray-450 font-medium">Status:</div>
                                <div className="col-span-2 font-bold flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                    <span className={status === 'active' ? 'text-emerald-600' : 'text-gray-500'}>
                                        {status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="text-gray-450 font-medium">Pricing:</div>
                                <div className="col-span-2 font-bold">
                                    {price ? `₹${price}` : "—"}
                                    {originalPrice && originalPrice !== price ? (
                                        <span className="text-red-500 font-normal line-through text-[10px] ml-1.5">₹{originalPrice}</span>
                                    ) : null}
                                </div>

                                <div className="text-gray-450 font-medium">Category:</div>
                                <div className="col-span-2 font-bold truncate">
                                    {category || "—"} {subcategory ? `> ${subcategory}` : ""}
                                </div>

                                <div className="text-gray-450 font-medium">Branches:</div>
                                <div className="col-span-2 font-bold text-[11px] leading-tight truncate">
                                    {selectedBranchIds.length > 0
                                        ? `${selectedBranchIds.length} branch(es) selected`
                                        : <span className="text-red-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Select branch</span>
                                    }
                                </div>

                                <div className="text-gray-450 font-medium">Validity:</div>
                                <div className="col-span-2 font-bold text-[11px] leading-tight">
                                    {validFrom ? validFrom.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                    {validTo ? ` to ${validTo.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " (Onwards)"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* CONFIRM DISCARD MODAL */}
            <AppModal
                open={showConfirmDiscard}
                onOpenChange={setShowConfirmDiscard}
                title="Discard Unsaved Changes?"
                description="You have made edits to this product. Are you sure you want to discard them? This action cannot be undone."
                className="sm:max-w-md p-6 rounded-[28px] sm:rounded-2xl"
            >
                <div className="flex flex-col gap-4 mt-2">
                    <div className="flex justify-end gap-3">
                        <PremiumButton
                            type="button"
                            variant="outline"
                            onClick={() => setShowConfirmDiscard(false)}
                            className="rounded-xl px-4 h-9 text-xs cursor-pointer font-bold"
                            glow={false}
                        >
                            Keep Editing
                        </PremiumButton>
                        <PremiumButton
                            type="button"
                            variant="destructive"
                            onClick={() => {
                                setShowConfirmDiscard(false);
                                setIsDirty(false);
                                onCancel();
                            }}
                            className="rounded-xl px-4 h-9 text-xs cursor-pointer font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/20"
                            glow={false}
                        >
                            Discard Changes
                        </PremiumButton>
                    </div>
                </div>
            </AppModal>

            {/* Simple mobile preview button */}
            <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(true)}
                className="lg:hidden fixed bottom-6 right-6 z-40 bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-all active:scale-95 text-xs font-semibold"
            >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
            </button>

            {/* Slide-out mobile preview drawer */}
            {isMobilePreviewOpen && (
                <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop overlay */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
                        onClick={() => setIsMobilePreviewOpen(false)}
                    />

                    {/* Drawer container */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-xs bg-white border-l border-gray-100 shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300 ease-out">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                    Live Preview
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setIsMobilePreviewOpen(false)}
                                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 leading-snug">
                                This card displays in real-time exactly how users will view this product in deals catalog.
                            </p>

                            {/* Consumer Card Mock Container */}
                            <div className="border border-gray-50 rounded-2xl p-4 bg-gray-50/50 flex justify-center">
                                <div className="w-[220px] shadow-lg rounded-2xl bg-white overflow-hidden shrink-0">
                                    <ProductCard
                                        id={0}
                                        name={name || "Premium Wireless Headphones"}
                                        shopName={shopName}
                                        price={Number(price) || 0}
                                        originalPrice={originalPrice ? Number(originalPrice) : undefined}
                                        image={image}
                                        category={category}
                                        subcategory={subcategory}
                                        savingPercentage={savingPercentage}
                                    />
                                </div>
                            </div>

                            {/* Real-time Summary Card details */}
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <h4 className="text-xs font-bold text-gray-405 uppercase tracking-widest pl-1">
                                    Summary details
                                </h4>

                                <div className="grid grid-cols-3 text-xs gap-y-2.5">
                                    <div className="text-gray-450 font-medium">Status:</div>
                                    <div className="col-span-2 font-bold flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                        <span className={status === 'active' ? 'text-emerald-600' : 'text-gray-500'}>
                                            {status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="text-gray-450 font-medium">Pricing:</div>
                                    <div className="col-span-2 font-bold">
                                        {price ? `₹${price}` : "—"}
                                        {originalPrice && originalPrice !== price ? (
                                            <span className="text-red-500 font-normal line-through text-[10px] ml-1.5">₹{originalPrice}</span>
                                        ) : null}
                                    </div>

                                    <div className="text-gray-450 font-medium">Category:</div>
                                    <div className="col-span-2 font-bold truncate">
                                        {category || "—"} {subcategory ? `> ${subcategory}` : ""}
                                    </div>

                                    <div className="text-gray-450 font-medium">Branches:</div>
                                    <div className="col-span-2 font-bold text-[11px] leading-tight truncate">
                                        {selectedBranchIds.length > 0
                                            ? `${selectedBranchIds.length} branch(es) selected`
                                            : <span className="text-red-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Select branch</span>
                                        }
                                    </div>

                                    <div className="text-gray-450 font-medium">Validity:</div>
                                    <div className="col-span-2 font-bold text-[11px] leading-tight">
                                        {validFrom ? validFrom.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                        {validTo ? ` to ${validTo.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " (Onwards)"}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <PremiumButton
                                    type="button"
                                    onClick={() => setIsMobilePreviewOpen(false)}
                                    className="w-full rounded-lg h-9 text-xs font-semibold"
                                >
                                    Close Preview
                                </PremiumButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enlarged image preview overlay */}
            {isEnlargedPreviewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Backdrop click to close */}
                    <div
                        className="absolute inset-0 cursor-zoom-out"
                        onClick={() => setIsEnlargedPreviewOpen(false)}
                    />

                    {/* Content container */}
                    <div className="relative max-w-lg w-full bg-white rounded-3xl p-3 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center">
                        {/* Close button X */}
                        <button
                            type="button"
                            onClick={() => setIsEnlargedPreviewOpen(false)}
                            className="absolute -top-3 -right-3 sm:top-3 sm:right-3 z-10 w-8 h-8 rounded-full bg-gray-900 hover:bg-black text-white flex items-center justify-center shadow-lg transition-all active:scale-95 duration-150"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white">
                            {image && (
                                <Image
                                    src={image}
                                    alt="Product Enlarged View"
                                    fill
                                    unoptimized
                                    className="object-contain"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
