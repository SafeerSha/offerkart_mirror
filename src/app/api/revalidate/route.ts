import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const revalidateSchema = z.object({
  secret: z.string().min(1, "Secret is required"),
  path: z.string().startsWith("/", "Path must be a relative route pathname").optional(),
  tag: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = revalidateSchema.safeParse({
      secret: searchParams.get("secret"),
      path: searchParams.get("path") || undefined,
      tag: searchParams.get("tag") || undefined,
    });

    if (!query.success) {
      return Response.json(
        { message: "Invalid parameters", errors: query.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { secret, path, tag } = query.data;

    if (secret !== process.env.REVALIDATION_SECRET) {
      return Response.json({ message: "Invalid secret" }, { status: 401 });
    }

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
    return Response.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 }
    );
  }
}
