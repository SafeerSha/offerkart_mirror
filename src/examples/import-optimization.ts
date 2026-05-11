/*
Example: src/app/shop-manager/page.tsx (optimized)

// BEFORE: 57 lines of imports
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { Heading, Text, SectionTitle } from "@/components/shared/Typography";
// ... 50+ more lines

// AFTER: 25 lines of imports (grouped and organized)
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { Heading, Text, SectionTitle, PremiumCard, PremiumButton } from "@/components/shared";
import { Product } from "@/lib/types";
import { AlertTriangle, ArrowRight, BarChart3 } from "@/lib/icons";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { cn, getRelativeTime } from "@/lib/utils";
import { storage } from "@/lib/storage";
import Breadcrumbs from "@/components/shared/Breadcrumbs";
import { ProductModal } from "@/components/shop-manager/ProductModal";
import { useMyShops, useBranches } from "@/hooks";
import { getOfferProductById } from "@/lib/api";
*/