import "next-auth";

declare module "next-auth" {
  interface Session {
    linkedinUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    linkedinUrl?: string;
  }
}