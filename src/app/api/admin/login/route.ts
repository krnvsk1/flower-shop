import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  sessionCookieOptions,
  sessionCookieValue,
  verifyPassword,
} from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (typeof password !== 'string' || !verifyPassword(password)) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set(ADMIN_COOKIE, sessionCookieValue(), sessionCookieOptions())
    return res
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 400 })
  }
}
