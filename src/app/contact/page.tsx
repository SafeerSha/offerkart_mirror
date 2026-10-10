'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Phone, Mail, ArrowRight, Zap, Target, LayoutDashboard, 
  Rocket, CheckCircle2, Loader2, AlertCircle, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Heading, Subheading, Text } from '@/components/shared/Typography';
import TutorialMediaPlayer from '@/components/showcase/TutorialMediaPlayer';
import { OFFICIAL_PLATFORM_CONTACT } from '@/lib/tutorialData';

const steps = [
  {
    id: 1,
    title: "Quick Registration",
    shortTitle: "Registration",
    brief: "Get your digital storefront up and running in minutes. Simply fill in your business details, upload your logo, and establish your brand identity instantly on OfferKart.",
    icon: Zap,
    image: "/tut-1.png",
    mobileImage: "/tut-1-mobile.png",
    highlights: ["Fast 3-min onboarding", "Logo & brand customization", "Verified merchant badge"]
  },
  {
    id: 2,
    title: "Create Irresistible Offers",
    shortTitle: "Offers",
    brief: "Use our intuitive dashboard to launch exclusive discounts, flash sales, and time-limited deals designed specifically to drive high-intent, immediate foot traffic to your physical store.",
    icon: Target,
    image: "/tut-2.png",
    mobileImage: "/tut-2-mobile.png",
    highlights: ["High-intent local footfall", "Custom discount schedules", "Real-time promotion toggle"]
  },
  {
    id: 3,
    title: "Upload Marketing Posters",
    shortTitle: "Posters",
    brief: "Enhance your store's visual appeal by uploading vibrant promotional banners and marketing posters that showcase your best products and ongoing campaigns in high definition.",
    icon: LayoutDashboard,
    image: "/tut-3.png",
    mobileImage: "/tut-3-mobile.png",
    highlights: ["High-definition banner feed", "Mobile & desktop optimized", "Campaign visual highlights"]
  },
  {
    id: 4,
    title: "Go Live & Get Discovered",
    shortTitle: "Go Live",
    brief: "Publish your shop and instantly appear on the OfferKart public app. Watch in real-time as local customers discover your deals and navigate straight to your doors.",
    icon: Rocket,
    image: "/tut-4.png",
    mobileImage: "/tut-4-mobile.png",
    highlights: ["Instant public app visibility", "Nearby customer notifications", "Live foot-traffic analytics"]
  }
];

const stepConnectors = [
  { label: "Store Verified → Launching Campaigns" },
  { label: "Offers Ready → Visual Merchandising" },
  { label: "Posters Live → Customer Discovery" }
];

export default function ContactAndJourneyPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [mobileStep, setMobileStep] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Contact form submission state
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    ticketId?: string;
  } | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setSubmitError(data.message || 'Unable to submit request. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSubmitResult({
        success: true,
        message: data.message,
        ticketId: data.ticketId
      });
      setIsSubmitting(false);
    } catch {
      setSubmitError('Network error encountered. Please check your connection or contact us directly.');
      setIsSubmitting(false);
    }
  };

  const handleNextMobileStep = () => {
    setMobileStep(prev => (prev < steps.length - 1 ? prev + 1 : 0));
  };

  const handlePrevMobileStep = () => {
    setMobileStep(prev => (prev > 0 ? prev - 1 : steps.length - 1));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] font-sans selection:bg-primary/30">
      
      {/* Hero Header (Clean responsive padding, no giant dead space on mobile) */}
      <section className="pt-24 sm:pt-32 lg:pt-28 pb-6 sm:pb-10 px-4 sm:px-6 lg:px-12 text-center max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Heading className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 tracking-tight leading-tight">
            Built to Scale <span className="text-gradient">Designed for Growth</span>
          </Heading>
          <Text className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            See how local shop owners register their digital storefront, launch targeted offers, and expand customer footfall on OfferKart.
          </Text>
        </motion.div>
      </section>

      {/* Prominent Visual Media Player Section (Story 3: AC-3.1, AC-3.2, AC-3.3) */}
      <section className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 pb-12 sm:pb-20">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-2">
            <span>Interactive Walkthrough</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            See OfferKart in Action
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto mt-1.5">
            Explore the merchant workflow below or jump between chapters to review specific onboarding and promotion tools.
          </p>
        </div>

        <TutorialMediaPlayer />
      </section>

      {/* Deep-Dive Flow Showcase Section */}
      <section className="relative max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12 pb-20 sm:pb-28">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-2">
            <span>Step-by-Step Breakdown</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            The 4-Step Merchant Journey
          </h2>
        </div>

        {/* Desktop View: Interactive Side-by-Side Sticky Showcase (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-row gap-16 relative">
          
          {/* Left Side: Scrolling Text Blocks */}
          <div className="w-5/12 pt-[10vh] pb-[30vh]">
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              const Icon = step.icon;
              
              return (
                <React.Fragment key={step.id}>
                  <motion.div
                    initial={{ opacity: 0.3 }}
                    whileInView={{ opacity: 1 }}
                    onViewportEnter={() => setActiveStep(index)}
                    viewport={{ margin: "-45% 0px -45% 0px" }}
                    className="min-h-[60vh] flex flex-col justify-center"
                  >
                    <motion.div 
                      whileHover={{ y: -4 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className={`relative p-8 md:p-10 rounded-[2rem] transition-all duration-700 ease-out border ${
                        isActive 
                          ? 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10 shadow-2xl shadow-orange-500/5 backdrop-blur-xl scale-100 ring-1 ring-orange-500/10' 
                          : 'bg-transparent border-transparent opacity-30 hover:opacity-60 scale-95'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeAccent" 
                          className="absolute -left-[1px] top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-r-full shadow-[0_0_20px_rgba(255,165,0,0.8)] z-10" 
                        />
                      )}

                      <div className="flex items-center justify-between mb-8">
                        <div 
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl transition-all duration-500 ${
                            isActive 
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                          }`}
                        >
                          <Icon className="w-6 h-6 text-current" />
                        </div>

                        <div 
                          className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all duration-500 ${
                            isActive
                              ? 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm'
                              : 'border-gray-200/80 dark:border-gray-800 text-gray-400 bg-gray-50/50 dark:bg-gray-900/50'
                          }`}
                        >
                          STAGE 0{step.id}
                        </div>
                      </div>
                      
                      <Subheading className={`text-2xl md:text-3xl font-bold mb-4 tracking-tight transition-colors duration-500 ${
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </Subheading>
                      
                      <Text className={`text-base md:text-lg leading-relaxed transition-colors duration-500 ${
                        isActive ? 'text-foreground/80' : 'text-muted-foreground/80'
                      }`}>
                        {step.brief}
                      </Text>

                      {/* Feature Highlights */}
                      <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5 space-y-2">
                        {step.highlights.map((item, hIdx) => (
                          <div key={hIdx} className="flex items-center gap-2.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'}`} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Connected Workflow Bridge */}
                  {index < steps.length - 1 && (
                    <div className="py-4 flex flex-col items-center justify-center relative select-none">
                      <div className="w-[2px] h-10 bg-orange-500/20 rounded-full" />
                      <div className="my-2 px-3 py-1 rounded-full bg-white dark:bg-[#141414] border border-orange-500/20 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {stepConnectors[index].label}
                      </div>
                      <div className="w-[2px] h-10 bg-orange-500/20 rounded-full" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Right Side: Sticky Device Mockup */}
          <div className="w-7/12 sticky top-[12vh] self-start h-fit">
            <div className="flex items-center justify-end mb-4">
              <div className="inline-flex p-1 rounded-xl bg-gray-200/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-white/10 backdrop-blur-sm shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'desktop' 
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Desktop View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'mobile' 
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Mobile View
                </button>
              </div>
            </div>

            <div className="relative rounded-3xl p-3 bg-gradient-to-b from-gray-100 to-gray-200/50 dark:from-white/[0.05] dark:to-transparent border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex justify-center items-center min-h-[460px]">
              {viewMode === 'desktop' ? (
                <div className="flex flex-col w-full aspect-[16/10] bg-white dark:bg-[#0c0c0c] rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800 relative z-10">
                  <div className="h-10 bg-gray-50 dark:bg-[#151515] border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-2 shrink-0">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="ml-4 flex-1 max-w-xs h-6 bg-white dark:bg-[#222] rounded border border-gray-200 dark:border-gray-700 flex items-center px-2.5 text-[11px] text-gray-400">
                      app.offerkart.com
                    </div>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-white dark:bg-black">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`desktop-${activeStep}`}
                        src={steps[activeStep].image}
                        alt={steps[activeStep].title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-[300px] aspect-[627/895] rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0c0c0c] shadow-xl relative z-10 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`mobile-${activeStep}`}
                      src={steps[activeStep].mobileImage || steps[activeStep].image}
                      alt={steps[activeStep].title}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Mobile View: Natural-Flow Interactive Stage Explorer (No scroll-jacking! Native, smooth, touch-first) */}
        <div className="block lg:hidden w-full max-w-xl mx-auto">
          
          {/* Segmented Stage Tabs */}
          <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-gray-100/90 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/10 mb-4">
            {steps.map((step, idx) => {
              const isSelected = mobileStep === idx;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setMobileStep(idx)}
                  className={`py-2 px-1 rounded-lg text-center transition-all duration-150 flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none ${
                    isSelected
                      ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-xs font-semibold ring-1 ring-black/5 dark:ring-white/10'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`text-[10px] font-mono leading-none ${isSelected ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
                    0{step.id}
                  </span>
                  <span className="text-[11px] truncate max-w-[68px] leading-tight">
                    {step.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Presentation Card */}
          <div className="bg-white dark:bg-[#0f0f0f] rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/10 shadow-lg shadow-black/[0.03] p-4 sm:p-6 overflow-hidden">
            
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {React.createElement(steps[mobileStep].icon, { className: "w-4 h-4" })}
                </div>
                <span className="text-[11px] font-mono font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  Stage 0{steps[mobileStep].id} of 04
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMobileStep}
                  aria-label="Previous Stage"
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMobileStep}
                  aria-label="Next Stage"
                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stage Title and Description */}
            <div className="mb-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">
                {steps[mobileStep].title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {steps[mobileStep].brief}
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mb-4 p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 space-y-1.5">
              {steps[mobileStep].highlights.map((highlight, hIdx) => (
                <div key={hIdx} className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>

            {/* Mobile Screenshot Mockup */}
            <div className="mb-3 flex justify-center">
              <div className="relative w-full max-w-[260px] xs:max-w-[280px] aspect-[627/895] rounded-xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#0c0c0c] shadow-sm overflow-hidden">
                <Image
                  src={steps[mobileStep].mobileImage || steps[mobileStep].image}
                  alt={steps[mobileStep].title}
                  fill
                  sizes="(max-width: 640px) 280px, 320px"
                  className="object-cover object-top"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => setMobileStep(dotIdx)}
                    aria-label={`Jump to stage ${dotIdx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                      mobileStep === dotIdx
                        ? 'w-5 bg-orange-500'
                        : 'w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <Link
                href="/shop-registration"
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 py-1"
              >
                <span>Register store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </section>

      {/* Modern Contact Us Section (Story 2 & Form Handling) */}
      <section id="contact-form" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-12 bg-white dark:bg-[#050505] border-t border-gray-200/60 dark:border-gray-900 relative overflow-hidden">
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official Merchant Helpdesk · {OFFICIAL_PLATFORM_CONTACT.responseTime}</span>
            </div>
            <Heading className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3">
              Ready to <span className="text-gradient">Accelerate</span> Your Growth?
            </Heading>
            <Text className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Our onboarding team is standing by to help you verify your business, configure your store branches, and launch your first live offers.
            </Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Contact Channels Info */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              {/* Email */}
              <a 
                href={OFFICIAL_PLATFORM_CONTACT.channels[1].href}
                className="flex items-start gap-4 group p-3.5 sm:p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-gray-200/60 dark:hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all shadow-xs">
                  <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-0.5">Email Support</h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Fast responses to onboarding questions.<br/>
                    <span className="text-orange-500 font-semibold mt-0.5 inline-block truncate">{OFFICIAL_PLATFORM_CONTACT.supportEmail}</span>
                  </p>
                </div>
              </a>

              {/* Phone */}
              <a 
                href={OFFICIAL_PLATFORM_CONTACT.channels[0].href}
                className="flex items-start gap-4 group p-3.5 sm:p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-gray-200/60 dark:hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:border-orange-500 transition-all shadow-xs">
                  <Phone className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-0.5">Sales & Hotline</h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Direct phone support with onboarding managers.<br/>
                    <span className="text-orange-500 font-semibold mt-0.5 inline-block">{OFFICIAL_PLATFORM_CONTACT.formattedPhone}</span>
                  </p>
                </div>
              </a>

              {/* WhatsApp */}
              <a 
                href={OFFICIAL_PLATFORM_CONTACT.channels[3].href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 group p-3.5 sm:p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.03] border border-transparent hover:border-gray-200/60 dark:hover:border-white/10 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all shadow-xs">
                  <MessageSquare className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-0.5">WhatsApp Chat</h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    Instant messaging for quick queries.<br/>
                    <span className="text-emerald-500 font-semibold mt-0.5 inline-block">Start WhatsApp Chat →</span>
                  </p>
                </div>
              </a>

              {/* Headquarters */}
              <div className="flex items-start gap-4 p-3.5 sm:p-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg mb-0.5">Headquarters</h4>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                    {OFFICIAL_PLATFORM_CONTACT.headquarters}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-[#0c0c0c] p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/80 dark:border-gray-800 relative">
                
                {submitResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 px-2 text-center space-y-3"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Received!</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
                      {submitResult.message}
                    </p>
                    {submitResult.ticketId && (
                      <div className="inline-block px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-xs font-semibold">
                        Ticket Ref: {submitResult.ticketId}
                      </div>
                    )}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSubmitResult(null);
                          setFormState({ firstName: '', lastName: '', email: '', businessName: '', message: '' });
                        }}
                        className="text-xs font-bold text-orange-500 hover:text-orange-600 hover:underline cursor-pointer"
                      >
                        ← Submit another inquiry
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form
                    id="merchant-contact-form"
                    className="space-y-4 sm:space-y-5"
                    onSubmit={handleContactSubmit}
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-white/5">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                        Send Onboarding Inquiry
                      </h3>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Response &lt; 15 mins
                      </span>
                    </div>

                    {submitError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">First Name</label>
                        <input 
                          type="text" 
                          name="firstName"
                          required
                          value={formState.firstName}
                          onChange={handleFormChange}
                          className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Name</label>
                        <input 
                          type="text" 
                          name="lastName"
                          required
                          value={formState.lastName}
                          onChange={handleFormChange}
                          className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email Address</label>
                        <input 
                          type="email" 
                          name="email"
                          required
                          value={formState.email}
                          onChange={handleFormChange}
                          className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Business Name (Optional)</label>
                        <input 
                          type="text" 
                          name="businessName"
                          value={formState.businessName}
                          onChange={handleFormChange}
                          className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
                          placeholder="Acme Boutique"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">How can we help?</label>
                      <textarea 
                        rows={3}
                        name="message"
                        required
                        value={formState.message}
                        onChange={handleFormChange}
                        className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-base sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all resize-none"
                        placeholder="Tell us about your business goals or inquiry..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-base py-3.5 sm:py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-70 active:scale-[0.99]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Request</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
