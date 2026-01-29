import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AppModalProps {
    trigger?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

export const AppModal = ({
    trigger,
    title,
    description,
    children,
    open,
    onOpenChange,
    className,
}: AppModalProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={cn("glass-card border-primary/20 sm:max-w-[525px]", className)}>
                <DialogHeader>
                    <DialogTitle className="font-serif text-3xl text-gradient">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="font-sans text-base">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-4 font-sans">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
};
