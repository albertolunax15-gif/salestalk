import { API_BASE_URL, LOGIN_ENDPOINT } from '@/constants/auth'
import { LoginResponse } from '@/types/auth'

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const url = `${API_BASE_URL}${LOGIN_ENDPOINT}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }
}