export const tokenManager = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("token", token)
    }
  },
  
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("token")
    }
    return null
  },
  
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
    }
  },
  
  hasToken: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem("token")
    }
    return false
  }
}