export interface LoginResponse {
  access_token?: string
  token_type?: string
  message?: string
  [key: string]: any
}

export interface LoginFormData {
  email: string
  password: string
}

export interface AuthState {
  isLoading: boolean
  error: string
  success: string
}