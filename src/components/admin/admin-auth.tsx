'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Flower2 } from 'lucide-react'

export function AdminAuth({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)

    fetch('/api/admin/session', { signal: controller.signal, credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false))
      .finally(() => {
        window.clearTimeout(timer)
        setChecking(false)
      })

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError('Неверный пароль')
        return
      }
      setIsAuthenticated(true)
      setPassword('')
    } catch {
      setError('Не удалось войти')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleLogin()
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50/60 text-sm text-muted-foreground">
        Проверка сессии...
      </div>
    )
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
              onClick={() => void handleLogin()}
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
