import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const ADMIN_COOKIE = 'flower_admin_session'

function adminPassword() {
  return process.env.ADMIN_PASSWORD || 'admin123'
}

function signingSecret() {
  return process.env.ADMIN_SECRET || adminPassword()
}

function expectedToken() {
  return createHmac('sha256', signingSecret()).update('flower-admin-session').digest('hex')
}

export function verifyPassword(password: string) {
  const expected = adminPassword()
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function isAdminSession() {
  const jar = await cookies()
  const value = jar.get(ADMIN_COOKIE)?.value
  if (!value) return false
  const expected = expectedToken()
  const a = Buffer.from(value)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function requireAdmin() {
  if (await isAdminSession()) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function sessionCookieValue() {
  return expectedToken()
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}
