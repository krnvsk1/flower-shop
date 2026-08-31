import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin/admin-panel'

export const metadata: Metadata = {
  title: 'Кабинет — Atelier',
}

export default function AdminPage() {
  return <AdminPanel />
}
