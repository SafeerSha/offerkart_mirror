import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft, MapPin, Eye, Cookie, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - OfferNearU",
  description: "Learn how OfferNearU collects, uses, and protects your personal and location data when discovering local deals.",
  openGraph: {
    title: "Privacy Policy - OfferNearU",
    description: "Learn how OfferNearU collects, uses, and protects your personal and location data.",
  },
};

export default function PrivacyPage() {
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold mb-4 border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            Privacy &amp; Data Security
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>

          <p className="text-slate-600 text-base leading-relaxed max-w-2xl">
            At OfferNearU, your privacy and trust are paramount. This Privacy Policy details how we handle 
            your personal information, location coordinates, and cookies when you use our local discovery platform.
          </p>

          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span>Last Updated: <strong className="text-slate-700 font-semibold">{lastUpdated}</strong></span>
            <span>Version: <strong className="text-slate-700 font-semibold">2.0 (Strict Transparency)</strong></span>
          </div>
        </div>

        {/* Content Sections */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-sm space-y-10 text-slate-700 leading-relaxed text-sm md:text-base">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">1</span>
              Information We Collect
            </h2>
            <p>
              Depending on how you interact with OfferNearU, we collect:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong>Account Information:</strong> Name, phone number, email address, and authentication credentials when you register as a merchant or save favorite offers.</li>
              <li><strong>Search &amp; Interaction Data:</strong> Search keywords, viewed categories, and redeemed coupons to deliver personalized local deals.</li>
              <li><strong>Device &amp; Usage Data:</strong> Browser type, operating system, IP address, and platform usage metrics.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">2</span>
              How We Use Location Coordinates
            </h2>
            <p>
              OfferNearU is fundamentally built around hyper-local relevance:
            </p>
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 text-sm space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                Explicit Consent &amp; Local Storage
              </div>
              <p>
                We only access GPS location when you explicitly click &quot;Detect My Location&quot; or select a city. 
                Your approximate coordinates are used strictly to calculate proximity distances to participating shops 
                and sort nearby deals. We do not track your location in the background.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">3</span>
              Cookies &amp; Local Storage
            </h2>
            <p>
              We use functional cookies and browser local storage to maintain session state, preserve your selected city 
              preference, and ensure fast re-rendering. You can configure your browser to reject cookies, though some 
              personalized features may have reduced functionality.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">4</span>
              Data Sharing &amp; Third Parties
            </h2>
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal data to third-party advertisers. We only share information 
              with trusted infrastructure providers (cloud hosting, database persistence, and SMS/OTP delivery) required to run the service securely.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">5</span>
              Your Rights &amp; Control
            </h2>
            <p>
              You have the right to access, update, or request the deletion of your personal data at any time. Merchant partners 
              can update or remove shop listings directly via the Shop Manager portal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-bold">6</span>
              Privacy Inquiries &amp; Data Protection Officer
            </h2>
            <p>
              If you have questions about our data handling practices or want to exercise your data rights, contact us at:
            </p>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">OfferNearU Privacy Officer</p>
              <p>Email: <a href="mailto:privacy@offernearu.com" className="text-orange-600 hover:underline">privacy@offernearu.com</a></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
