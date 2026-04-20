import React from "react";
import { cn } from "@/lib/utils";

interface TypographyProps {
    children: React.ReactNode;
    className?: string;
    id?: string;
}

export const Heading = ({ children, className, id }: TypographyProps) => {
    return (
        <h1
            id={id}
            className={cn(
                "font-sans font-bold tracking-tight text-foreground",
                "text-4xl md:text-5xl lg:text-6xl", // Default large
                className
            )}
        >
            {children}
        </h1>
    );
};

export const Subheading = ({ children, className, id }: TypographyProps) => {
    return (
        <h2
            id={id}
            className={cn(
                "font-sans font-semibold tracking-tight text-foreground",
                "text-2xl md:text-3xl",
                className
            )}
        >
            {children}
        </h2>
    );
};

export const Text = ({ children, className, id }: TypographyProps) => {
    return (
        <p
            id={id}
            className={cn(
                "font-sans text-muted-foreground leading-relaxed",
                "text-base md:text-lg",
                className
            )}
        >
            {children}
        </p>
    );
};

export const Label = ({ children, className, id }: TypographyProps) => {
    return (
        <span
            id={id}
            className={cn(
                "font-sans text-xs font-medium uppercase tracking-wider text-muted-foreground",
                className
            )}
        >
            {children}
        </span>
    );
};

export const SectionTitle = ({ children, className, id }: TypographyProps) => {
    return (
        <h3
            id={id}
            className={cn(
                "font-sans text-sm font-semibold uppercase tracking-widest text-primary/70 mb-4",
                className
            )}
        >
            {children}
        </h3>
    );
};
