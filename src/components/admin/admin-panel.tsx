'use client'

import { useState } from 'react'
import { AdminAuth, AdminLogoutButton } from './admin-auth'
import { Dashboard } from './dashboard'
import { FlowerManager } from './flower-manager'
import { OrderManager } from './order-manager'
import { WriteOffManager } from './writeoff-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Flower2, LayoutDashboard, ShoppingCart, PackageX } from 'lucide-react'

const SESSION_KEY = 'flower_admin_auth'

function AdminContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <Flower2 className="w-4 h-4 text-rose-600" />
            </div>
            <h1 className="text-lg font-bold text-foreground hidden sm:block">
              Цветочный магазин{' '}
              <span className="text-muted-foreground font-normal">— Админ</span>
            </h1>
            <h1 className="text-lg font-bold text-foreground sm:hidden">
              Админ
            </h1>
          </div>
          <AdminLogoutButton onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="cursor-pointer">
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Панель управления
            </TabsTrigger>
            <TabsTrigger value="flowers" className="cursor-pointer">
              <Flower2 className="w-4 h-4 mr-1.5" />
              Товары
            </TabsTrigger>
            <TabsTrigger value="orders" className="cursor-pointer">
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Заказы
            </TabsTrigger>
            <TabsTrigger value="writeoffs" className="cursor-pointer">
              <PackageX className="w-4 h-4 mr-1.5" />
              Списания
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>

          <TabsContent value="flowers">
            <FlowerManager />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManager />
          </TabsContent>

          <TabsContent value="writeoffs">
            <WriteOffManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Цветочный магазин — Панель администратора
        </div>
      </footer>
    </div>
  )
}

export function AdminPanel() {
  return (
    <AdminAuth>
      <AdminContent />
    </AdminAuth>
  )
}
