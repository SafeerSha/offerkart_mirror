"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { Link as LinkIcon, ChevronDown, Check, Plus } from "lucide-react";
import { 
    SiFacebook, 
    SiInstagram, 
    SiYoutube, 
    SiWhatsapp, 
    SiThreads, 
    SiX 
} from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";

export interface SocialLink {
    platform: string;
    url: string;
}

interface SocialLinksEditorProps {
    socialLinks: SocialLink[];
    onChange: (links: SocialLink[]) => void;
}

// Reordered to match user request: Youtube, Instagram, Facebook, WhatsApp, Threads. Then others.
const PLATFORMS = [
    { id: "YOUTUBE", label: "YouTube", icon: SiYoutube, color: "text-[#FF0000]", activeBorder: "border-[#FF0000]", activeBg: "bg-[#FF0000]/10" },
    { id: "INSTAGRAM", label: "Instagram", icon: SiInstagram, color: "text-[#E4405F]", activeBorder: "border-[#E4405F]", activeBg: "bg-[#E4405F]/10" },
    { id: "FACEBOOK", label: "Facebook", icon: SiFacebook, color: "text-[#1877F2]", activeBorder: "border-[#1877F2]", activeBg: "bg-[#1877F2]/10" },
    { id: "WHATSAPP", label: "WhatsApp", icon: SiWhatsapp, color: "text-[#25D366]", activeBorder: "border-[#25D366]", activeBg: "bg-[#25D366]/10" },
    { id: "THREADS", label: "Threads", icon: SiThreads, color: "text-[#000000] dark:text-white", activeBorder: "border-[#000000] dark:border-white", activeBg: "bg-[#000000]/5 dark:bg-white/10" },
    { id: "X", label: "X (Twitter)", icon: SiX, color: "text-[#000000] dark:text-white", activeBorder: "border-[#000000] dark:border-white", activeBg: "bg-[#000000]/5 dark:bg-white/10" },
    { id: "LINKEDIN", label: "LinkedIn", icon: FaLinkedin, color: "text-[#0A66C2]", activeBorder: "border-[#0A66C2]", activeBg: "bg-[#0A66C2]/10" },
    { id: "WEBSITE", label: "Website", icon: LinkIcon, color: "text-indigo-600", activeBorder: "border-indigo-500", activeBg: "bg-indigo-50" },
];

export function SocialLinksEditor({ socialLinks, onChange }: SocialLinksEditorProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>(socialLinks.map(l => l.platform));

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const togglePlatform = (platformId: string) => {
        const existing = socialLinks.find(link => link.platform === platformId);
        if (existing) {
            // Unselect and remove
            onChange(socialLinks.filter(link => link.platform !== platformId));
            setExpandedPlatforms(prev => prev.filter(id => id !== platformId));
        } else {
            // Select and add
            onChange([...socialLinks, { platform: platformId, url: "" }]);
            if (!expandedPlatforms.includes(platformId)) {
                setExpandedPlatforms(prev => [...prev, platformId]);
            }
        }
    };

    const updateUrl = (platformId: string, url: string) => {
        onChange(socialLinks.map(link =>
            link.platform === platformId ? { ...link, url } : link
        ));
    };

    const removePlatform = (platformId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(socialLinks.filter(link => link.platform !== platformId));
        setExpandedPlatforms(prev => prev.filter(id => id !== platformId));
    };

    const toggleInputVisibility = (platformId: string) => {
        setExpandedPlatforms(prev =>
            prev.includes(platformId) ? prev.filter(id => id !== platformId) : [...prev, platformId]
        );
    };

    // To only show the requested logos by default:
    const visiblePlatformsForLogos = PLATFORMS.filter(p => ["YOUTUBE", "INSTAGRAM", "FACEBOOK", "WHATSAPP", "THREADS"].includes(p.id));

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-muted-foreground ml-1" />
                        <label className="text-sm font-medium text-foreground">Social Media</label>
                    </div>

                    {/* Custom Platform Selector - Commented Out */}
                    {/* 
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={cn(
                                "flex items-center gap-1 min-h-[36px] px-3 py-1.5 bg-white border border-gray-200 rounded-xl transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
                                dropdownOpen && "border-orange-300 ring-2 ring-orange-500/20"
                            )}
                        >
                            {socialLinks.length === 0 ? (
                                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Links
                                </span>
                            ) : (
                                <div className="flex items-center gap-1.5 flex-wrap max-w-[150px]">
                                    {socialLinks.map(link => {
                                        const p = PLATFORMS.find(x => x.id === link.platform);
                                        if (!p) return null;
                                        const Icon = p.icon;
                                        return <Icon key={p.id} className={cn("w-4 h-4", p.color)} />;
                                    })}
                                </div>
                            )}
                            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform ml-1", dropdownOpen && "rotate-180")} />
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 animate-in slide-in-from-top-2 fade-in duration-200">
                                {PLATFORMS.map((platform) => {
                                    const isSelected = socialLinks.some(link => link.platform === platform.id);
                                    const Icon = platform.icon;
                                    return (
                                        <button
                                            key={platform.id}
                                            type="button"
                                            className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-orange-50 transition-colors"
                                            onClick={() => togglePlatform(platform.id)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={cn("w-4 h-4", isSelected ? platform.color : "text-gray-400")} />
                                                <span className={cn("font-medium", isSelected ? "text-orange-900" : "text-gray-600")}>
                                                    {platform.label}
                                                </span>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div> 
                    */}
                </div>
                
                <p className="text-xs text-muted-foreground ml-1">
                    Click on the logos to add or remove links to your promotion.
                </p>
            </div>

            {/* Display static logos for user to toggle */}
            <div className="flex flex-wrap gap-2.5 mt-2">
                {visiblePlatformsForLogos.map((platformDef) => {
                    const isSelected = socialLinks.some(link => link.platform === platformDef.id);
                    const Icon = platformDef.icon;

                    return (
                        <button
                            key={platformDef.id}
                            type="button"
                            onClick={() => togglePlatform(platformDef.id)}
                            className={cn(
                                "flex items-center justify-center w-12 h-10 rounded-lg transition-all border-2",
                                isSelected
                                    ? `bg-white shadow-sm ${platformDef.activeBorder} ${platformDef.color}`
                                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            )}
                            title={platformDef.label}
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>

            {/* Display selected platforms that are not in the top logos (just in case they have legacy ones) */}
            {socialLinks.filter(l => !visiblePlatformsForLogos.some(p => p.id === l.platform)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {socialLinks.filter(l => !visiblePlatformsForLogos.some(p => p.id === l.platform)).map((link) => {
                        const platformDef = PLATFORMS.find(p => p.id === link.platform);
                        if (!platformDef) return null;
                        const Icon = platformDef.icon;
                        const isExpanded = expandedPlatforms.includes(link.platform);

                        return (
                            <button
                                key={link.platform}
                                type="button"
                                onClick={() => toggleInputVisibility(link.platform)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wide font-bold transition-all border",
                                    isExpanded
                                        ? `bg-white shadow-sm border-2 ${platformDef.activeBorder} ${platformDef.color}`
                                        : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {platformDef.label}
                                <div
                                    onClick={(e) => removePlatform(link.platform, e)}
                                    className={cn(
                                        "ml-1 transition-colors p-0.5 rounded-full hover:bg-black/10",
                                        isExpanded ? "opacity-50 hover:opacity-100" : "hover:text-foreground"
                                    )}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Inputs for active platforms */}
            {socialLinks.length > 0 && expandedPlatforms.length > 0 && (
                <div className="space-y-3 mt-4 pt-4 border-t border-primary/5 max-h-[240px] overflow-y-auto pr-2 styled-scrollbar">
                    {socialLinks.map((link) => {
                        if (!expandedPlatforms.includes(link.platform)) return null;
                        
                        const platformDef = PLATFORMS.find(p => p.id === link.platform);
                        if (!platformDef) return null;
                        const Icon = platformDef.icon;
                        
                        return (
                            <div key={link.platform} className="animate-in slide-in-from-top-2 fade-in duration-200">
                                <PremiumInput
                                    label={`${platformDef.label} Link`}
                                    icon={Icon}
                                    type="url"
                                    value={link.url}
                                    onChange={(e) => updateUrl(link.platform, e.target.value)}
                                    placeholder={`Paste your ${platformDef.label} URL here...`}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
