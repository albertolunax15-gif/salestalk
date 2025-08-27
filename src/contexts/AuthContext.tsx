"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { tokenManager } from '@/utils/tokenManager'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null                 // 👈 expuesto en el tipo
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)  // 👈 estado del token

  useEffect(() => {
    // Verificar si hay un token al cargar la aplicación
    const t = tokenManager.getToken()
    setToken(t)
    setIsAuthenticated(!!t)
    setIsLoading(false)
  }, [])

  const login = (t: string) => {
    tokenManager.setToken(t)
    setToken(t)
    setIsAuthenticated(true)
  }

  const logout = () => {
    tokenManager.removeToken()
    setToken(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}