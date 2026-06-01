import NextAuth, { DefaultSession } from "next-auth";
import type { AuthUser } from "@/lib/types/auth";

declare module "next-auth" {
    interface Session {
        shopId?: string;
        user: AuthUser & {
            accessToken?: string;
            shopId?: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        full_name?: string;
        business_name?: string;
        phone?: string;
        accessToken?: string;
        shopId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        shopId?: string;
        user?: AuthUser & { accessToken?: string; shopId?: string };
    }
}
