import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { PremiumInput } from "@/components/shared/PremiumInput";
import { PremiumButton } from "@/components/shared/PremiumButton";
import { Textarea } from "@/components/ui/textarea";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormFieldConfig {
    name: string;
    label: string;
    type?: string;
    placeholder?: string;
    icon?: LucideIcon;
    component?: "input" | "textarea";
    gridCols?: number;
}

interface DynamicFormProps {
    schema: z.ZodObject<any>;
    fields: FormFieldConfig[];
    onSubmit: (data: any) => Promise<void>;
    submitLabel: string;
    defaultValues?: any;
}

export const DynamicForm = ({ schema, fields, onSubmit, submitLabel, defaultValues }: DynamicFormProps) => {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues || {},
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    {fields.map((field) => (
                        <FormField
                            key={field.name}
                            control={form.control}
                            name={field.name}
                            render={({ field: formField, fieldState: { error } }) => (
                                <FormItem className={cn("md:col-span-" + (field.gridCols || 6))}>
                                    <FormControl>
                                        {field.component === "textarea" ? (
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground ml-1">
                                                    {field.label}
                                                </label>
                                                <Textarea
                                                    placeholder={field.placeholder}
                                                    className={cn(
                                                        "min-h-[120px] bg-background/40 border-primary/10 focus:border-primary/50 transition-all rounded-xl resize-none p-4",
                                                        error && "border-destructive focus:ring-destructive/20"
                                                    )}
                                                    {...formField}
                                                />
                                                {error && <p className="text-xs font-medium text-destructive ml-1">{error.message}</p>}
                                            </div>
                                        ) : (
                                            <PremiumInput
                                                label={field.label}
                                                placeholder={field.placeholder}
                                                type={field.type || "text"}
                                                icon={field.icon}
                                                error={error?.message}
                                                {...formField}
                                            />
                                        )}
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    ))}
                </div>

                <PremiumButton
                    type="submit"
                    className="w-full h-14 text-lg font-semibold"
                    isLoading={form.formState.isSubmitting}
                >
                    {submitLabel}
                </PremiumButton>
            </form>
        </Form>
    );
};

