import type { Metadata } from "next";
import { 
  Rubik, 
  Inter, 
  Playfair_Display, 
  Staatliches, 
  Montserrat, 
  Outfit, 
  Quicksand, 
  Bebas_Neue 
} from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { OfflineDetector } from "@/components/layout/OfflineDetector";
import { cookies } from "next/headers";
import { Locale } from "@/lib/i18n/config";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const staatliches = Staatliches({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-staatliches",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "OfferNearU - Discover Local Deals & Offers",
  description: "Find the best local deals, coupons, and exclusive offers from trusted businesses in your neighborhood. Save money with OfferNearU.",
  keywords: ["local deals", "coupons", "offers", "discounts", "local businesses", "savings"],
  authors: [{ name: "OfferNearU" }],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "OfferNearU - Discover Local Deals & Offers",
    description: "Find the best local deals and exclusive offers near you",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: Locale = "en"; // Default for static generation
  // We cannot read cookies() here without opting out of Static Site Generation.
  // The LanguageProvider will handle checking cookies and loading the correct locale on the client.

  const { getDictionary } = await import("@/lib/i18n/store");
  const dictionary = await getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${rubik.variable} ${inter.variable} ${playfair.variable} ${staatliches.variable} ${montserrat.variable} ${outfit.variable} ${quicksand.variable} ${bebasNeue.variable} antialiased min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers locale={locale} dictionary={dictionary}>
          <OfflineDetector>
            <div className="flex flex-col min-h-screen">
              <ConditionalHeader />
              <main id="main-content" className="flex-1 flex flex-col">
                {children}
              </main>
              <ConditionalFooter />
            </div>
          </OfflineDetector>
        </Providers>
      </body>
    </html>
  );
}
