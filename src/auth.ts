import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { getEmailConfig, getPublicSiteUrl } from "@/lib/paladin/env";
import { prisma } from "@/lib/prisma";

const siteUrl = getPublicSiteUrl();
const emailConfig = getEmailConfig();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
    verifyRequest: "/login?status=check-email",
    error: "/login",
  },
  providers: [
    Nodemailer({
      from: emailConfig.from,
      maxAge: 10 * 60,
      server: emailConfig.server,
    }),
  ],
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
  secret: process.env.AUTH_SECRET,
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
});
