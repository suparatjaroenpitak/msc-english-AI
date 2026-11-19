import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

async function ensureLearningData(userId: string) {
  await prisma.$transaction([
    prisma.learningProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.teacherPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
  ]);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  providers: googleClientId && googleClientSecret
    ? [GoogleProvider({ clientId: googleClientId, clientSecret: googleClientSecret })]
    : [],
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && !user.email) return false;
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        await ensureLearningData(user.id);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      await ensureLearningData(user.id);
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);
