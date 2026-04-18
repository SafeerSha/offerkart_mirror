import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        shopId?: string;
        user: {
            id: string;
            full_name: string;
            business_name: string;
            phone?: string;
            shopId?: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        full_name: string;
        business_name: string;
        phone?: string;
        accessToken?: string;
        shopId?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        shopId?: string;
        user?: any;
    }
}
