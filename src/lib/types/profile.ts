import { z } from "zod";

export const BasicProfileSchema = z.object({
    full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
    business_name: z.string().trim().max(100, "Business name is too long").optional().or(z.literal("")),
});

export type BasicProfileFormData = z.infer<typeof BasicProfileSchema>;

export const UserProfileSchema = z.object({
    full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
    email: z.string().trim().email("Please enter a valid email address"),
    phone: z.string().trim().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional().or(z.literal("")),
    business_name: z.string().trim().max(100, "Business name is too long").optional().or(z.literal("")),
});

export type UserProfileFormData = z.infer<typeof UserProfileSchema>;

export const ContactChangeTypeSchema = z.enum(["EMAIL", "PHONE"]);
export type ContactChangeType = z.infer<typeof ContactChangeTypeSchema>;

export const VerifyCurrentOtpSchema = z.object({
    otp: z.string().trim().min(4, "OTP must be at least 4 digits").max(10, "Invalid OTP"),
});
export type VerifyCurrentOtpFormData = z.infer<typeof VerifyCurrentOtpSchema>;

export const RequestNewContactOtpSchema = z.object({
    type: ContactChangeTypeSchema,
    newValue: z.string().trim().min(1, "New contact information is required"),
}).superRefine((data, ctx) => {
    if (data.type === "EMAIL") {
        const isValidEmail = z.string().email().safeParse(data.newValue).success;
        if (!isValidEmail) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["newValue"],
                message: "Please enter a valid email address",
            });
        }
    } else if (data.type === "PHONE") {
        const isValidPhone = /^\+?[0-9]{10,15}$/.test(data.newValue);
        if (!isValidPhone) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["newValue"],
                message: "Please enter a valid phone number (10-15 digits)",
            });
        }
    }
});
export type RequestNewContactOtpFormData = z.infer<typeof RequestNewContactOtpSchema>;

export const VerifyNewContactOtpSchema = z.object({
    type: ContactChangeTypeSchema,
    otp: z.string().trim().min(4, "OTP must be at least 4 digits").max(10, "Invalid OTP"),
});
export type VerifyNewContactOtpFormData = z.infer<typeof VerifyNewContactOtpSchema>;

export interface UserProfileResponse {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role?: number;
    role_id?: number;
    business_name?: string;
    shopId?: string;
}

export const PasswordChangeSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(6, "Password must be at least 6 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords don't match",
    path: ["confirm_password"],
});

export type PasswordChangeFormData = z.infer<typeof PasswordChangeSchema>;
