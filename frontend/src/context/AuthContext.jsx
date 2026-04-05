import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api'

const AuthContext = createContext(null)

function buildUser(data) {
  return {
    id: data.id,
    name: `${data.first_name} ${data.last_name}`,
    email: data.email,
    role: data.role,
    institution: data.institution || '',
    specialty: data.specialty || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

 
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(buildUser(res.data)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    try {
      const res = await api.post('/auth/login', { email, password })
      setUser(buildUser(res.data.user))
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      return { success: false, error: msg }
    }
  }

  async function signup(first_name, last_name, email, password, confirm_password) {
    try {
      await api.post('/auth/signup', { first_name, last_name, email, password, confirm_password })
      const loginRes = await api.post('/auth/login', { email, password })
      setUser(buildUser(loginRes.data.user))
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong'
      return { success: false, error: msg }
    }
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
  }

  const isResearcher = user?.role === 'researcher'

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isResearcher }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
