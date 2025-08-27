import { useState } from 'react'
import { AuthState, LoginFormData } from '@/types/auth'
import { authService } from '@/services/authService'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants/auth'
import { useAuth } from '@/contexts/AuthContext'

export const useLogin = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: false,
    error: '',
    success: ''
  })

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })

  const { login } = useAuth()

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar errores al empezar a escribir
    if (authState.error) {
      setAuthState(prev => ({ ...prev, error: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.email || !formData.password) {
      setAuthState(prev => ({ 
        ...prev, 
        error: ERROR_MESSAGES.REQUIRED_FIELDS 
      }))
      return
    }
    
    setAuthState(prev => ({ ...prev, isLoading: true, error: '', success: '' }))

    try {
      const data = await authService.login(formData.email, formData.password)

      if (data.access_token) {
        setAuthState(prev => ({ ...prev, success: SUCCESS_MESSAGES.LOGIN }))
        login(data.access_token) // Usar el contexto de autenticación
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          error: data.message || ERROR_MESSAGES.INVALID_CREDENTIALS 
        }))
      }
    } catch (err) {
      console.error("Login error:", err)
      setAuthState(prev => ({ ...prev, error: ERROR_MESSAGES.CONNECTION }))
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }

  return {
    formData,
    authState,
    handleInputChange,
    handleSubmit
  }
}