import type { NextAuthConfig } from "next-auth";
import { getPublicSiteUrl } from "@/lib/paladin/env";

const siteUrl = getPublicSiteUrl();

export const authConfig = {
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    verifyRequest: "/login?status=check-email",
    error: "/login",
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${siteUrl}${url}`;
      }

      let targetUrl: URL;

      try {
        targetUrl = new URL(url);
      } catch {
        return `${siteUrl}/dashboard`;
      }

      const allowedOrigins = new Set([siteUrl, baseUrl]);

      if (allowedOrigins.has(targetUrl.origin)) {
        return url;
      }

      return `${siteUrl}/dashboard`;
    },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
    strategy: "jwt",
  },
  theme: {
    brandColor: "#1e3a8a",
    buttonText: "#ffffff",
    colorScheme: "dark",
    logo: `${siteUrl}/favicon.ico`,
  },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
} satisfies Partial<NextAuthConfig>;
