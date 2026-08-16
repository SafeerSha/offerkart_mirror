import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { sanitizeErrorMessage } from "@/lib/security";

const revalidateQuerySchema = z.object({
  path: z.string().startsWith("/", "Path must be a relative route pathname").optional(),
  tag: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate using Authorization: Bearer <secret>
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    let secret = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      secret = authHeader.substring(7);
    } else {
      // Fallback to query param or x-revalidation-secret header for backward compatibility
      secret = request.nextUrl.searchParams.get("secret") || request.headers.get("x-revalidation-secret") || "";
    }

    const expectedSecret = process.env.REVALIDATION_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return Response.json({ message: "Invalid secret" }, { status: 401 });
    }

    // 2. Validate request parameters
    const searchParams = request.nextUrl.searchParams;
    const query = revalidateQuerySchema.safeParse({
      path: searchParams.get("path") || undefined,
      tag: searchParams.get("tag") || undefined,
    });

    if (!query.success) {
      return Response.json(
        { message: "Invalid parameters", errors: query.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { path, tag } = query.data;

    if (path) {
      revalidatePath(path);
      return Response.json({ revalidated: true, path, now: Date.now() });
    }

    if (tag) {
      revalidateTag(tag, "max");
      return Response.json({ revalidated: true, tag, now: Date.now() });
    }

    return Response.json(
      { message: "Missing path or tag to revalidate" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error during revalidation:", error);
    return Response.json(
      { message: sanitizeErrorMessage(error, "Error revalidating") },
      { status: 500 }
    );
  }
}
