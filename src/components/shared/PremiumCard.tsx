import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    children: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    headerContent?: React.ReactNode;
    variant?: "glass" | "premium" | "default";
    padding?: "none" | "sm" | "md" | "lg";
}

export const PremiumCard = ({
    children,
    title,
    description,
    headerContent,
    className,
    variant = "glass",
    padding = "md",
    ...props
}: PremiumCardProps) => {
    const paddingMap = {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <Card
            className={cn(
                "overflow-hidden relative border-primary/20 transition-all duration-300",
                variant === "glass" && "glass-card",
                variant === "premium" && "card-premium",
                className
            )}
            {...props}
        >
            {(title || description || headerContent) && (
                <CardHeader className={cn(paddingMap[padding], "pb-0")}>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            {title && <CardTitle className="font-serif text-2xl md:text-3xl">{title}</CardTitle>}
                            {description && <CardDescription className="font-sans text-base">{description}</CardDescription>}
                        </div>
                        {headerContent}
                    </div>
                </CardHeader>
            )}
            <CardContent className={cn(
                paddingMap[padding],
                className?.includes("flex") && "flex-1 flex flex-col h-full"
            )}>
                {children}
            </CardContent>
        </Card>
    );
};
