import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { backend } from "@/lib/api/backendClient";
import type { AuthUser, AuthLoginData } from "@/lib/types/auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const res = await backend.post<AuthLoginData>(ENDPOINTS.AUTH.LOGIN, {
                        email: credentials.email,
                        password: credentials.password,
                    });

                    if (res.success && res.data) {
                        const userData = res.data && typeof res.data === 'object' && (res.data as Record<string, unknown>).status === "success"
                            ? (res.data as Record<string, unknown>).data as AuthLoginData ?? res.data
                            : res.data;
                        const { token, ...user } = userData as Record<string, unknown>;
                        
                        const authUser: AuthUser = {
                            id: String(user?.id ?? user?.uid ?? "1"),
                            full_name: (user?.full_name as string | undefined) ?? "",
                            email: (user?.email as string | undefined) ?? "",
                            phone: (user?.phone as string | undefined) ?? "",
                            business_name: (user?.business_name as string | undefined) ?? "",
                        };
                        
                        return {
                            ...authUser,
                            name: authUser.full_name || undefined,
                            accessToken: token as string | undefined,
                        } as any;
                    }
                    return null;
                } catch (error) {
                    console.error("NextAuth Authorize Error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.accessToken = (user as any).accessToken;
                token.user = user;
                if ((user as any).shopId) {
                    token.shopId = (user as any).shopId;
                }
            }
            if (trigger === "update" && session?.shopId) {
                token.shopId = session.shopId;
            }
            return token;
        },
        async session({ session, token }) {
            (session as unknown as Record<string, unknown>).user = token.user;
            (session as unknown as Record<string, unknown>).shopId = token.shopId;
            if (session.user && token.shopId) {
                (session.user as unknown as Record<string, unknown>).shopId = token.shopId;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
