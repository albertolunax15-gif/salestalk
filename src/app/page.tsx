import { LoginForm } from "@/components/login/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}