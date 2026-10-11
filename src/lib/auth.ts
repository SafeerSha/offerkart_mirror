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
                        const rawData = res.data as Record<string, unknown>;
                        // Handle potential double envelope where data contains the actual user info
                        const userData = rawData.data && typeof rawData.data === 'object'
                            ? rawData.data as Record<string, unknown>
                            : rawData;
                            
                        console.log("==> NEXTAUTH LOGIN API RESPONSE:", JSON.stringify(res.data));
                        console.log("==> EXTRACTED USERDATA:", JSON.stringify(userData));
                            
                        const { token, ...user } = userData;
                        
                        const authUser: AuthUser = {
                            id: String(user?.id ?? user?.uid ?? "1"),
                            full_name: (user?.full_name as string | undefined) ?? "",
                            email: (user?.email as string | undefined) ?? "",
                            phone: (user?.phone as string | undefined) ?? "",
                            business_name: (user?.business_name as string | undefined) ?? "",
                            shopId: (user?.shopId as string | undefined) ?? (user?.shop_id as string | undefined) ?? undefined,
                            role: (user?.role as number | undefined),
                        };
                        console.log("==> FINAL AUTHUSER:", JSON.stringify(authUser));
                        
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
            if (trigger === "update" && session) {
                if (session.shopId) {
                    token.shopId = session.shopId;
                }
                if (session.user) {
                    token.user = {
                        ...(token.user as Record<string, unknown> || {}),
                        ...(session.user as Record<string, unknown>),
                    };
                }
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};
