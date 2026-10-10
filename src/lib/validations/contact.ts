import { z } from "zod";

export const ContactFormSchema = z.object({
    firstName: z
        .string()
        .min(2, { message: "First name must be at least 2 characters" })
        .max(50, { message: "First name must not exceed 50 characters" })
        .trim(),
    lastName: z
        .string()
        .min(1, { message: "Last name is required" })
        .max(50, { message: "Last name must not exceed 50 characters" })
        .trim(),
    email: z
        .string()
        .email({ message: "Please provide a valid email address" })
        .max(100, { message: "Email must not exceed 100 characters" })
        .trim(),
    phone: z
        .string()
        .max(20, { message: "Phone number is too long" })
        .optional()
        .or(z.literal("")),
    businessName: z
        .string()
        .max(100, { message: "Business name must not exceed 100 characters" })
        .optional()
        .or(z.literal("")),
    message: z
        .string()
        .min(10, { message: "Please enter a message of at least 10 characters" })
        .max(2000, { message: "Message cannot exceed 2000 characters" })
        .trim()
});

export type ContactFormInput = z.infer<typeof ContactFormSchema>;
