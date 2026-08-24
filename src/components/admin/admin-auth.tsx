'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">
        Проверка сессии...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm border border-border bg-card px-8 py-10">
          <p className="text-[11px] tracking-[0.32em] uppercase text-brass text-center mb-3">Atelier</p>
          <h1 className="font-display text-3xl text-center mb-2">Кабинет</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Введите пароль, чтобы продолжить</p>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 rounded-none h-11"
              autoFocus
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive text-center font-medium mb-4">{error}</p>
          ) : null}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer rounded-none h-11"
            onClick={() => void handleLogin()}
            disabled={loading || !password}
          >
            {loading ? 'Вход...' : 'Войти'}
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
