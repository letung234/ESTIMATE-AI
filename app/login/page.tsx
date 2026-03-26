import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { LoginForm } from "@/components/auth/LoginForm"

export const metadata = {
  title: "Sign In - Project Estimator",
  description: "Sign in to access the Project Estimator",
}

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Project Estimator</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Project Estimation Tool
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
