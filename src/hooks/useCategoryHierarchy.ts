import { useMemo, useCallback } from "react";
import { useCategories } from "./useApi";

export function useCategoryHierarchy() {
    const { data, isLoading, isError, error } = useCategories();
    
    // Default fallback to ensure UI doesn't crash while loading
    const FALLBACK_HIERARCHY: Record<string, string[]> = {};
    
    const { hierarchy, mainCategories, categoryLookup } = useMemo(() => {
        const hierarchicalData: Record<string, string[]> = {};
        const mainCategoryNames: string[] = [];
        
        // Detailed map to lookup details by category name
        // Format: { [mainCategoryName]: { id: number, subcategories: { [subCategoryName]: { id, name } } } }
        const lookup: Record<string, { id: number, name: string, subcategories: Record<string, { id: number, name: string }> }> = {};

        const serverData = data?.success ? data.data : [];

        if (serverData && Array.isArray(serverData) && serverData.length > 0) {
            // FIRST PASS: Gather all categories, whether main or children (if provided as flat)
            serverData.forEach((cat: any) => {
                // Use .name primarily, fallback to .displayName
                const catName = cat.name || cat.displayName;
                if (!catName) return; // Skip invalid objects

                const isMain = !cat.parentId && !cat.categoryId; // Guess if it's a main category in flat array

                // 1. PROCESS MAIN CATEGORY LOGIC
                // If explicitly nested data structure OR it appears to be a main category
                if (cat.subcategories || isMain) {
                    if (!hierarchicalData[catName]) {
                        hierarchicalData[catName] = [];
                        mainCategoryNames.push(catName);
                    }
                    
                    if (!lookup[catName]) {
                        lookup[catName] = {
                            id: cat.id,
                            name: catName,
                            subcategories: {}
                        };
                    }

                    // IF NESTED SUBCATEGORIES EXIST, PROCESS THEM IMMEDIATELY
                    if (Array.isArray(cat.subcategories)) {
                        cat.subcategories.forEach((sub: any) => {
                            const subName = sub.name || sub.displayName;
                            if (!subName) return;

                            if (!hierarchicalData[catName].includes(subName)) {
                                hierarchicalData[catName].push(subName);
                            }

                            if (lookup[catName]) {
                                lookup[catName].subcategories[subName] = {
                                    id: sub.id,
                                    name: subName
                                };
                            }
                        });
                    }
                }
            });

            // SECOND PASS: Handle any items that are children in a FLAT structure, 
            // in case API doesn't return nested array but flat list with parent links
            serverData.forEach((cat: any) => {
                const parentId = cat.parentId || cat.categoryId;
                const catName = cat.name || cat.displayName;
                
                if (parentId && catName) {
                    const parent = serverData.find((p: any) => p.id === parentId);
                    if (parent) {
                        const parentName = parent.name || (parent as any).displayName;
                        
                        if (parentName && hierarchicalData[parentName]) {
                            if (!hierarchicalData[parentName].includes(catName)) {
                                hierarchicalData[parentName].push(catName);
                            }
                            
                            if (lookup[parentName]) {
                                lookup[parentName].subcategories[catName] = {
                                    id: cat.id,
                                    name: catName
                                };
                            }
                        }
                    }
                }
            });
        }

        return {
            hierarchy: Object.keys(hierarchicalData).length > 0 ? hierarchicalData : FALLBACK_HIERARCHY,
            mainCategories: mainCategoryNames,
            categoryLookup: lookup
        };
    }, [data]);

    // Helper utility to quickly get the correct ID (prioritizing subcategory, fallback to main)
    const getCategoryId = useCallback((main: string, sub?: string): number | null => {
        if (!main) return null;
        const mainRecord = categoryLookup[main];
        if (!mainRecord) return null;
        
        if (sub && mainRecord.subcategories[sub]) {
            return mainRecord.subcategories[sub].id;
        }
        return mainRecord.id;
    }, [categoryLookup]);

    // Reverse lookup helper: find category/subcategory strings from an ID OR Name
    const resolveHierarchyById = useCallback((idOrName: number | string | null | undefined) => {
        if (!idOrName) return { main: "", sub: "" };

        // 1. FIRST CHECK: Is it already a valid string name present in our lookup?
        const inputStr = String(idOrName).trim();
        if (categoryLookup[inputStr]) {
            return { main: inputStr, sub: "" };
        }

        // Also check subcategories across all main categories by name match
        for (const mainName of Object.keys(categoryLookup)) {
            const mainRecord = categoryLookup[mainName];
            if (mainRecord.subcategories[inputStr]) {
                return { main: mainName, sub: inputStr };
            }
        }
        
        // 2. SECOND CHECK: Attempt to match by ID
        const targetId = Number(idOrName);
        if (!isNaN(targetId)) {
            for (const mainName of Object.keys(categoryLookup)) {
                const mainRecord = categoryLookup[mainName];
                
                // Check if it matches the main category ID
                if (mainRecord.id === targetId) {
                    return { main: mainName, sub: "" };
                }
                
                // Check subcategories by ID
                for (const subName of Object.keys(mainRecord.subcategories)) {
                    if (mainRecord.subcategories[subName].id === targetId) {
                        return { main: mainName, sub: subName };
                    }
                }
            }
        }
        
        return { main: "", sub: "" };
    }, [categoryLookup]);

    return {
        isLoading,
        isError,
        error,
        categoryHierarchy: hierarchy,
        mainCategories,
        categoryLookup,
        getCategoryId,
        resolveHierarchyById
    };
}
