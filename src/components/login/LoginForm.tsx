"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react"
import { useLogin } from "@/hooks/useLogin"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const { formData, authState, handleInputChange, handleSubmit } = useLogin()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  return (
    <Card className="w-full max-w-md shadow-xl border-primary/20 bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg">
            <Image 
              src="/salestalk-logo.png" 
              alt="SalesTalk Logo" 
              fill 
              className="object-cover" 
              priority
            />
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold text-foreground">
            Bienvenido a SalesTalk
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Inicia sesión para acceder a tu cuenta
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="pl-10 h-12 bg-input border-border focus:border-primary focus:ring-ring"
                disabled={authState.isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                className="pl-10 h-12 bg-input border-border focus:border-primary focus:ring-ring"
                disabled={authState.isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Mensajes de error */}
          {authState.error && (
            <Alert variant="destructive" className="border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authState.error}</AlertDescription>
            </Alert>
          )}

          {/* Mensajes de éxito */}
          {authState.success && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {authState.success}
              </AlertDescription>
            </Alert>
          )}

          {/* Botón */}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-lg"
            disabled={authState.isLoading}
          >
            {authState.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button 
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </CardContent>
    </Card>
  )
}