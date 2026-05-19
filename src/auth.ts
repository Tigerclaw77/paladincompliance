import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { authConfig } from "@/auth.config";
import { getEmailConfig } from "@/lib/paladin/env";
import { prisma } from "@/lib/prisma";

const emailConfig = getEmailConfig();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      from: emailConfig.from,
      maxAge: 10 * 60,
      server: emailConfig.server,
    }),
  ],
  secret: process.env.AUTH_SECRET,
});
