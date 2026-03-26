import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname === "/login"
      const isApiRoute = nextUrl.pathname.startsWith("/api")
      const isStaticAsset = nextUrl.pathname.match(/\.(ico|png|jpg|svg|css|js)$/)

      // Allow API routes and static assets
      if (isApiRoute || isStaticAsset) {
        return true
      }

      // Redirect authenticated users away from login page
      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl))
        }
        return true
      }

      // Protect all other routes
      if (!isLoggedIn) {
        return false
      }

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
