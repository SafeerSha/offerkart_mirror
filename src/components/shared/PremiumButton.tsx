import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PremiumButtonProps extends ButtonProps {
    isLoading?: boolean;
    leftIcon?: React.ElementType;
    rightIcon?: React.ElementType;
    glow?: boolean;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, children, isLoading, leftIcon: LeftIcon, rightIcon: RightIcon, glow = true, variant = "default", asChild = false, ...props }, ref) => {
        const content = (
            <>
                {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : LeftIcon ? (
                    <LeftIcon className="w-4 h-4 mr-2" />
                ) : null}

                {children}

                {!isLoading && RightIcon && (
                    <RightIcon className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                )}
            </>
        );

        return (
            <Button
                ref={ref}
                variant={variant}
                asChild={asChild}
                className={cn(
                    "transition-all duration-300 active:scale-95 disabled:opacity-70",
                    variant === "default" && "gradient-primary text-white border-none",
                    variant === "ghost" && "hover:bg-primary/5",
                    glow && "hover:glow shadow-lg shadow-primary/20",
                    className
                )}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {asChild ? children : content}
            </Button>
        );
    }
);

PremiumButton.displayName = "PremiumButton";
