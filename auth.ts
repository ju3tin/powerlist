import NextAuth from "next-auth";
import LinkedIn from "next-auth/providers/linkedin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID,
      clientSecret: process.env.AUTH_LINKEDIN_SECRET,
      authorization: {
        params: {
          scope: "openid profile email",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.linkedinUrl =
          (profile as any).profile ||
          (profile as any).url ||
          `https://www.linkedin.com/in/${(profile as any).vanityName || ""}`;
      }
      return token;
    },
    async session({ session, token }) {
      session.linkedinUrl = token.linkedinUrl as string;
      return session;
    },
  },
});
