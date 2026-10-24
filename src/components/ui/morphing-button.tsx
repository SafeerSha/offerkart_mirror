"use client";

import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MorphingButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  isLoading?: boolean;
  children?: React.ReactNode;
  circleSize?: number;
  spinner?: React.ReactNode;
}

export const MorphingButton = React.forwardRef<HTMLButtonElement, MorphingButtonProps>(
  (
    {
      isLoading = false,
      children,
      circleSize = 48,
      spinner,
      className,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex justify-center w-full">
        <motion.button
          ref={ref}
          type={type}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          initial={false}
          animate={{
            width: isLoading ? circleSize : "100%",
            borderRadius: isLoading ? circleSize / 2 : 12,
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 32,
            mass: 0.8,
          }}
          className={cn(
            "relative flex items-center justify-center overflow-hidden font-semibold transition-colors duration-200 select-none cursor-pointer",
            isLoading && "pointer-events-none cursor-wait",
            className
          )}
          {...props}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.div
                key="morphing-spinner"
                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                {spinner || (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="morphing-label"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className="flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    );
  }
);

MorphingButton.displayName = "MorphingButton";
