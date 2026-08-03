'use client'

import { useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Flower2 } from 'lucide-react'

const ADMIN_PASSWORD = 'admin123'
const SESSION_KEY = 'flower_admin_auth'

export function AdminAuth({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem(SESSION_KEY) === 'true'
  })
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    setLoading(true)
    setError('')

    // Small delay to show loading state
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true')
        setIsAuthenticated(true)
      } else {
        setError('Неверный пароль')
      }
      setLoading(false)
    }, 300)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setIsAuthenticated(false)
    setPassword('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50 p-4">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
              <Flower2 className="w-7 h-7 text-rose-600" />
            </div>
            <CardTitle className="text-xl text-foreground">Панель администратора</CardTitle>
            <p className="text-sm text-muted-foreground">Введите пароль для входа</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-rose-600 text-center font-medium">{error}</p>
            )}
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              onClick={handleLogin}
              disabled={loading || !password}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}

export { handleLogout as adminLogout }

// Re-export a logout trigger component
export function AdminLogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onLogout}
      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
    >
      Выйти
    </Button>
  )
}
