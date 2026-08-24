import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminPanel } from '@/components/admin/admin-panel'

export const metadata: Metadata = {
  title: 'Кабинет — Atelier',
}

export default function AdminPage() {
  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed bottom-4 left-4 z-[60] bg-card border border-border text-muted-foreground hover:text-primary rounded-none px-3 py-1.5 text-[10px] tracking-widest uppercase"
      >
        На витрину
      </Link>
      <AdminPanel />
    </div>
  )
}
