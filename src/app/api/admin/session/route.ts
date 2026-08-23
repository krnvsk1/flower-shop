import { NextResponse } from 'next/server'
import { isAdminSession } from '@/lib/admin-auth'

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSession() })
}
