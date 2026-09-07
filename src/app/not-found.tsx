import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-xl w-full flex flex-col items-center text-center space-y-8 relative z-10 mt-16 md:mt-24">
        <div className="w-24 h-24 rounded-3xl bg-orange-500/5 flex items-center justify-center text-orange-500 relative z-10 shadow-[inset_0px_4px_20px_rgba(249,115,22,0.15)] mb-2">
          <MapPinOff className="w-12 h-12 opacity-90" />
        </div>

        <div className="space-y-4">
          <h1 className="text-7xl md:text-8xl font-serif text-gradient font-bold tracking-tighter">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            Not Found
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto pt-2">
            We couldn't find the page you're looking for.
          </p>
        </div>

        <div className="pt-6">
          <Link href="/" className="inline-block">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3.5 px-10 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95">
              Return to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
