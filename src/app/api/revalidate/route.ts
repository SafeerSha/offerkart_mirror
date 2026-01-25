import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");
        const path = searchParams.get("path");
        const tag = searchParams.get("tag");

        // Check for secret to prevent unauthorized access
        if (secret !== process.env.REVALIDATION_SECRET) {
            return Response.json({ message: "Invalid secret" }, { status: 401 });
        }

        if (path) {
            revalidatePath(path);
            return Response.json({ revalidated: true, path, now: Date.now() });
        }

        if (tag) {
            // @ts-expect-error: Next.js type mismatch
            revalidateTag(tag);
            return Response.json({ revalidated: true, tag, now: Date.now() });
        }

        return Response.json(
            { message: "Missing path or tag to revalidate" },
            { status: 400 }
        );
    } catch (error) {
        return Response.json(
            { message: "Error revalidating", error: String(error) },
            { status: 500 }
        );
    }
}
