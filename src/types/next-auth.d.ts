import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        accessToken?: string;
        user: {
            id: string;
            full_name: string;
            business_name: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        full_name: string;
        business_name: string;
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
        user?: any;
    }
}
