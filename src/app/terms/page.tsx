import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, ArrowLeft, Store, AlertCircle, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - OfferNearU",
  description: "Read the Terms of Service for using OfferNearU, including rules for browsing deals, coupon redemption, and shop interactions.",
  openGraph: {
    title: "Terms of Service - OfferNearU",
    description: "Read the Terms of Service for using OfferNearU.",
  },
};

export default function TermsPage() {
  const lastUpdated = "September 2026";

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 md:py-16">
      {/* Spacer for fixed header */}
      <div className="h-44 sm:h-40 lg:h-28" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-sm mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold mb-4 border border-orange-100">
            <FileText className="w-4 h-4" />
            Legal Documentation
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Terms of Service
          </h1>

          <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
            Welcome to OfferNearU. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the 
            OfferNearU platform, website, and related hyper-local discovery services. Please read them carefully.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span>Last Updated: <strong className="text-slate-700 font-semibold">{lastUpdated}</strong></span>
            <span>Applicable to: <strong className="text-slate-700 font-semibold">Consumers &amp; Partner Shops</strong></span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm md:text-base">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing or using OfferNearU, you confirm that you are at least 18 years of age or have legal parental consent, 
              and you agree to comply with and be bound by these Terms. If you do not agree to these terms, you must discontinue 
              using the platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">2</span>
              Platform Role &amp; Local Marketplace
            </h2>
            <p>
              OfferNearU provides a digital discovery platform connecting consumers with local brick-and-mortar merchants. 
              We facilitate the discovery of promotions, offers, catalog products, and shop details.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Merchant Responsibility Notice
              </div>
              <p>
                Offers, pricing, stock availability, and guarantee claims are determined solely by the respective local merchant. 
                Unless explicitly stated, transactions and fulfillments take place directly between you and the merchant.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">3</span>
              Offer Claims, Discounts &amp; Expirations
            </h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Each promotional offer or discount coupon has specific validity dates, limitations, and terms determined by the merchant.</li>
              <li>Offers cannot be redeemed for cash or combined with other offers unless stated otherwise by the merchant.</li>
              <li>OfferNearU reserves the right to remove expired or fraudulent promotions at any time.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">4</span>
              User Conduct &amp; Prohibited Actions
            </h2>
            <p>
              When using OfferNearU, you agree not to:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Scrape, crawl, or extract automated data from our services without written consent.</li>
              <li>Circumvent rate limits, authentication tokens, or access controls.</li>
              <li>Submit false, misleading, or defamatory reviews or shop listings.</li>
              <li>Engage in any activity that disrupts or harms the platform infrastructure or user experience.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">5</span>
              Intellectual Property Rights
            </h2>
            <p>
              All trademarks, logos, brand assets, graphics, and interface designs on OfferNearU are the property of OfferNearU 
              or its licensed partners. You may not use, replicate, or modify any brand materials without explicit written authorization.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">6</span>
              Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by applicable law, OfferNearU and its affiliates shall not be liable for any indirect, 
              incidental, consequential, or punitive damages resulting from your use or inability to use our discovery service or 
              any dispute with a third-party merchant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-600 text-sm font-bold">7</span>
              Contact &amp; Legal Inquiries
            </h2>
            <p>
              For questions regarding these Terms of Service or to report a violation, please contact our team:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">OfferNearU Legal &amp; Compliance Team</p>
              <p>Email: <a href="mailto:support@offernearu.com" className="text-orange-600 hover:underline">support@offernearu.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
