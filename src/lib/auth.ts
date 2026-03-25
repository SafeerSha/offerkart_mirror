import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ENDPOINTS } from "@/lib/api/endpoints";

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
                    const response = await fetch(ENDPOINTS.AUTH.LOGIN, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const result = await response.json();

                    if (response.ok && result.status === "success") {
                        const { token, ...user } = result.data;
                        return {
                            id: user.id,
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
            session.accessToken = token.accessToken as string;
            session.user = token.user as any;
            session.shopId = token.shopId;
            if (session.user && token.shopId) {
                session.user.shopId = token.shopId;
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
