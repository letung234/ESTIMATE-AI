import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "admin" | "user"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: "admin" | "user"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "admin" | "user"
  }
}
