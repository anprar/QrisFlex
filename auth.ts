import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";

import { env, featureFlags } from "@/lib/env";
import { slugify } from "@/lib/utils";

const credentialsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>> = [
  Credentials({
    name: "QrisFlex Instant Access",
    credentials: {
      name: { label: "Nama", type: "text" },
      email: { label: "Email", type: "email" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);

      if (!parsed.success) {
        return null;
      }

      const email = parsed.data.email.toLowerCase();

      return {
        id: email,
        name: parsed.data.name,
        email,
        plan: email.endsWith("@pro.qrisflex.id") ? "pro" : "free",
        image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(slugify(parsed.data.name))}`,
      };
    },
  }),
];

if (featureFlags.googleAuth) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID!,
      clientSecret: env.AUTH_GOOGLE_SECRET!,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.NEXTAUTH_SECRET || "qrisflex-default-insecure-secret-for-demo",
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan ?? "free";
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "guest@qrisflex.id");
        session.user.plan = (token.plan as "free" | "pro" | undefined) ?? "free";
      }

      return session;
    },
  },
});
