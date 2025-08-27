"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Lee bandera de "cerrando sesión" una sola vez
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLoggingOut(sessionStorage.getItem("isLoggingOut") === "1")
    }
  }, [])

  // Redirige si no está autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/') // usar replace para evitar regresar a la ruta protegida
    }
  }, [isAuthenticated, isLoading, router])

  // Mientras carga o mientras estamos cerrando sesión, muestra spinner limpio
  if (isLoading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600">
            {isLoggingOut ? "Cerrando sesión…" : "Verificando autenticación…"}
          </p>
        </div>
      </div>
    )
  }

  // Si ya no está autenticado, no renders UI de "no autorizado" (evita el flash)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}