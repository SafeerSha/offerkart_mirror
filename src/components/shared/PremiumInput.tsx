import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/shared/Typography";
import { cn } from "@/lib/utils";

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ElementType;
    error?: string;
    containerClassName?: string;
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
    ({ label, icon: Icon, error, className, containerClassName, ...props }, ref) => {
        return (
            <div className={cn("space-y-2", containerClassName)}>
                {label && <Label className="ml-1">{label}</Label>}
                <div className="relative group">
                    {Icon && (
                        <Icon className={cn(
                            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                            error ? "text-destructive" : "text-muted-foreground group-focus-within:text-primary"
                        )} />
                    )}
                    <Input
                        ref={ref}
                        className={cn(
                            "bg-background/40 border-primary/10 focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary/40 focus-visible:border-primary/50",
                            Icon && "pl-10",
                            error && "border-destructive focus:ring-destructive/20",
                            className
                        )}
                        aria-invalid={!!error}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-xs font-medium text-destructive ml-1 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

PremiumInput.displayName = "PremiumInput";
