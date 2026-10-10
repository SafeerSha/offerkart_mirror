import { NextRequest, NextResponse } from "next/server";
import { ContactFormSchema } from "@/lib/validations/contact";
import { sanitizeInput } from "@/lib/security";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);

        if (!body) {
            return NextResponse.json(
                { success: false, message: "Invalid request payload" },
                { status: 400 }
            );
        }

        const parseResult = ContactFormSchema.safeParse(body);

        if (!parseResult.success) {
            const firstError = parseResult.error.issues[0]?.message || "Validation failed";
            return NextResponse.json(
                {
                    success: false,
                    message: firstError,
                    errors: parseResult.error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        const { firstName, lastName, email, phone, businessName, message } = parseResult.data;

        // Sanitize string values
        const sanitizedData = {
            firstName: sanitizeInput(firstName),
            lastName: sanitizeInput(lastName),
            email: sanitizeInput(email),
            phone: phone ? sanitizeInput(phone) : "",
            businessName: businessName ? sanitizeInput(businessName) : "",
            message: sanitizeInput(message)
        };

        const ticketId = `OFFER-DESK-${Date.now().toString(36).toUpperCase()}`;

        return NextResponse.json(
            {
                success: true,
                message: `Thank you ${sanitizedData.firstName}! A dedicated OfferKart merchant specialist has received your request and will reach out shortly.`,
                ticketId
            },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Error handling contact submission:", error);
        return NextResponse.json(
            { success: false, message: "An unexpected server error occurred. Please try again later." },
            { status: 500 }
        );
    }
}
