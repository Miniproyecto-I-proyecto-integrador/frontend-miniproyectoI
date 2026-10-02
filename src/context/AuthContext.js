import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// Hook para leer la sesión desde cualquier componente: const { user, isAuthenticated, login, logout } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
