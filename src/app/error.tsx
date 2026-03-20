"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Heading, Text } from "@/components/shared/Typography";
import { PremiumButton } from "@/components/shared/PremiumButton";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 bg-red-50/50 text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <Heading className="text-2xl md:text-3xl font-bold mb-3 text-center">
        Something went wrong!
      </Heading>
      <Text className="text-muted-foreground text-center max-w-md mb-8">
        We apologize for the inconvenience. An unexpected error has occurred. Our team has been notified.
      </Text>
      <PremiumButton
        onClick={() => reset()}
        leftIcon={RefreshCcw}
        className="rounded-xl px-8"
      >
        Try again
      </PremiumButton>
    </div>
  );
}
