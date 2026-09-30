import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    linkedinUrl?: string;
    needsClaim?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    linkedinUrl?: string;
    email?: string;
    needsClaim?: boolean;
  }
}