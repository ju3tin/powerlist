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
      // If LinkedIn gave an email → normal login
      if (user.email) {
        return true;
      }

      // No email → send user to claim page
      return "/claim-profile";
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

      return token;
    },

    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email as string;
      }
      session.linkedinUrl = (token.linkedinUrl as string) || undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});