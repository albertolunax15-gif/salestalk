"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirige si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/') // usar replace para evitar regresar a la ruta protegida
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sesión…</p>
        </div>
      </div>
    )
  }

  // Si ya no está autenticado, no renderizamos nada (evita el flash)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
