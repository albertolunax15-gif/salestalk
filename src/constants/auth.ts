export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://apisalestalk.onrender.com"
export const LOGIN_ENDPOINT = "/auth/login"

export const ERROR_MESSAGES = {
  CONNECTION: "Error de conexión. Por favor, intenta de nuevo.",
  INVALID_CREDENTIALS: "Credenciales inválidas. Por favor, verifica tus datos.",
  UNEXPECTED: "Error inesperado. Por favor, intenta de nuevo.",
  REQUIRED_FIELDS: "Por favor, completa todos los campos"
} as const

export const SUCCESS_MESSAGES = {
  LOGIN: "¡Inicio de sesión exitoso!"
} as const