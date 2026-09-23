import { z } from "zod";

export const UserProfileSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number").optional().or(z.literal("")),
    business_name: z.string().optional(),
});

export type UserProfileFormData = z.infer<typeof UserProfileSchema>;

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
