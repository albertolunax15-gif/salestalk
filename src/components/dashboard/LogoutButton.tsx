"use client"

import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    // Marca que estamos cerrando sesión (visible para ProtectedRoute)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isLoggingOut", "1")
    }

    try {
      await Promise.resolve(logout()) // por si logout no es async
      router.replace("/")            // evita volver a la ruta protegida con Back
    } catch (e) {
      setIsLoggingOut(false)
      // Si falla el logout, limpia la bandera
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("isLoggingOut")
      }
      console.error(e)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      disabled={isLoggingOut}
      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-70"
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Cerrando sesión…
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </>
      )}
    </Button>
  )
}