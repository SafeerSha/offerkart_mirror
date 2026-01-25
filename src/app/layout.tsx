import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
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
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
