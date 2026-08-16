import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface AppModalProps {
    trigger?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

export const useMediaQuery = (query: string) => {
    const [matches, setMatches] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [matches, query]);

    return isMounted ? matches : false;
};

export const AppModal = ({
    trigger,
    title,
    description,
    children,
    footer,
    open,
    onOpenChange,
    className,
}: AppModalProps) => {
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
                <DrawerContent className={cn("px-4 pb-8 bg-white border-t border-gray-200 rounded-t-[32px] flex flex-col max-h-[95vh]", className)}>
                    <DrawerHeader className="text-left mt-2 shrink-0">
                        <DrawerTitle className="font-sans font-black text-2xl capitalize tracking-wider text-orange-600">{title}</DrawerTitle>
                        {description && (
                            <DrawerDescription className="font-sans text-sm font-medium text-gray-500">
                                {description}
                            </DrawerDescription>
                        )}
                    </DrawerHeader>
                    <div className="py-4 font-sans min-w-0 w-full overflow-y-auto flex-1">
                        {children}
                    </div>
                    {footer && (
                        <div className="pt-4 border-t border-gray-100 shrink-0">
                            {footer}
                        </div>
                    )}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={cn("glass-card border-primary/20 sm:max-w-[525px] flex flex-col max-h-[90vh]", className)}>
                <DialogHeader className="shrink-0">
                    <DialogTitle className="font-serif text-3xl text-gradient">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="font-sans text-base">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-4 font-sans min-w-0 w-full overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
                {footer && (
                    <div className="pt-4 border-t border-primary/10 shrink-0 bg-transparent">
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

