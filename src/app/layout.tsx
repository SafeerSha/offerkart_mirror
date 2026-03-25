import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

import { ConditionalHeader } from "@/components/layout/ConditionalHeader";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "OfferKart - Discover Local Deals & Offers",
  description: "Find the best local deals, coupons, and exclusive offers from trusted businesses in your neighborhood. Save money with OfferKart.",
  keywords: ["local deals", "coupons", "offers", "discounts", "local businesses", "savings"],
  authors: [{ name: "OfferKart" }],
  openGraph: {
    title: "OfferKart - Discover Local Deals & Offers",
    description: "Find the best local deals and exclusive offers near you",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rubik.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <ConditionalHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
