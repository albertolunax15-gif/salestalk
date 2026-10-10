"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLogin } from "@/hooks/useLogin"
import { useAuth } from "@/contexts/AuthContext"

export function LoginForm() {
  const { formData, authState, handleInputChange, handleSubmit } = useLogin()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <div className="relative mb-6 size-12 overflow-hidden rounded-xl shadow-sm ring-1 ring-border lg:hidden">
          <Image src="/salestalk-logo.png" alt="SalesTalk" fill sizes="48px" className="object-cover" priority />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inicia sesión</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Ingresa tus credenciales para acceder al panel.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              autoFocus
              className="h-11 bg-card pl-10"
              disabled={authState.isLoading}
              autoComplete="email"
              aria-invalid={Boolean(authState.error) || undefined}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              className="h-11 bg-card px-10"
              disabled={authState.isLoading}
              autoComplete="current-password"
              aria-invalid={Boolean(authState.error) || undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={showPassword}
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div aria-live="polite">
          {authState.error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{authState.error}</span>
            </div>
          )}
          {authState.success && (
            <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{authState.success}</span>
            </div>
          )}
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={authState.isLoading}>
          {authState.isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Ingresando…
            </>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </div>
  )
}
