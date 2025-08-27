export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

export const validateForm = (email: string, password: string): string | null => {
  if (!email || !password) {
    return "Por favor, completa todos los campos"
  }
  
  if (!validateEmail(email)) {
    return "Por favor, ingresa un correo electrónico válido"
  }
  
  if (!validatePassword(password)) {
    return "La contraseña debe tener al menos 6 caracteres"
  }
  
  return null
}