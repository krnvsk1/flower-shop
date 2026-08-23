import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminPanel } from '@/components/admin/admin-panel'

export const metadata: Metadata = {
  title: 'Админ — Цветочный магазин',
}

export default function AdminPage() {
  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-[60] bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm"
      >
        🌸 Магазин
      </Link>
      <AdminPanel />
    </div>
  )
}
