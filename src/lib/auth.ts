import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { backend } from "@/lib/api/backendClient";

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
                    const res = await backend.post<any>(ENDPOINTS.AUTH.LOGIN, {
                        email: credentials.email,
                        password: credentials.password,
                    });

                    if (res.success && res.data) {
                        const result = res.data as any;
                        
                        // Handle both { status: "success", data: {...} } and direct data structures
                        const userData = result.status === "success" ? result.data : result;
                        
                        const { token, ...user } = userData;
                        return {
                            id: user.id || user.uid || "1",
                            name: user.full_name,
                            full_name: user.full_name,
                            email: user.email,
                            phone: user.phone || "",
                            business_name: user.business_name,
                            accessToken: token,
                        };
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
            (session as any).user = token.user;
            (session as any).shopId = token.shopId;
            if (session.user && token.shopId) {
                (session.user as any).shopId = token.shopId;
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
