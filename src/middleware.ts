import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    // Existing jobsync routes
    "/dashboard",
    "/dashboard/:path*",
    // HireTrue routes
    "/jobs",
    "/jobs/:path*",
    "/resume",
    "/resume/:path*",
    "/tracker",
    "/tracker/:path*",
    "/profile",
    "/profile/:path*",
    // API routes (except auth)
    "/api/((?!auth).*)",
  ],
};
