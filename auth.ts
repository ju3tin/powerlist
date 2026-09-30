import NextAuth from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      authorization: {
        params: {
          redirectUri: process.env.LINKEDIN_REDIRECT_URI,
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Always allow the sign-in (so a session is created)
      return true;
    },

    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        token.linkedinUrl =
          (profile as any).profile ||
          (profile as any).url ||
          undefined;
      }

      if (user?.email) {
        token.email = user.email;
      }

      // Mark that this user still needs to claim a profile
      if (user && !user.email) {
        token.needsClaim = true;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string;
      }
      session.linkedinUrl = (token.linkedinUrl as string) || undefined;
      (session as any).needsClaim = token.needsClaim === true;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});