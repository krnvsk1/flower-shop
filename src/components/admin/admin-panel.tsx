'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminAuth } from './admin-auth'
import { Dashboard } from './dashboard'
import { FlowerManager } from './flower-manager'
import { OrderManager } from './order-manager'
import { WriteOffManager } from './writeoff-manager'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Flower2, LayoutDashboard, ShoppingCart, PackageX, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const SESSION_KEY = 'flower_admin_auth'

type TabKey = 'dashboard' | 'flowers' | 'orders' | 'writeoffs'

const NAV_ITEMS: { key: TabKey; label: string; description: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Панель управления', description: 'Общая статистика магазина', icon: LayoutDashboard },
  { key: 'flowers', label: 'Товары', description: 'Управление ассортиментом цветов', icon: Flower2 },
  { key: 'orders', label: 'Заказы', description: 'Обработка и отслеживание заказов', icon: ShoppingCart },
  { key: 'writeoffs', label: 'Списания', description: 'Учёт испорченных товаров', icon: PackageX },
]

function AdminContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    window.location.reload()
  }

  const currentNav = NAV_ITEMS.find((n) => n.key === activeTab)!

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'sticky top-0 h-screen flex flex-col border-r bg-background/95 backdrop-blur transition-all duration-300 z-50',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        {/* Top: Logo+Arrow combined */}
        <div className="flex items-center px-3 h-14 border-b flex-shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'flex items-center gap-2 rounded-lg transition-colors cursor-pointer flex-shrink-0',
              collapsed ? 'p-2 mx-auto hover:bg-muted' : 'px-2 py-1.5 hover:bg-muted'
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Flower2 className="w-4 h-4 text-rose-600" />
            </div>
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <PanelLeftOpen className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Развернуть
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-bold text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Админ
                  </motion.span>
                </AnimatePresence>
                <PanelLeftClose className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            const button = (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-rose-100 text-rose-700 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-rose-600')} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.key} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return button
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="border-t px-3 py-3 flex-shrink-0">
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Выйти
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span className="whitespace-nowrap">Выйти</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Page header */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              activeTab === 'dashboard' && 'bg-rose-100',
              activeTab === 'flowers' && 'bg-emerald-100',
              activeTab === 'orders' && 'bg-amber-100',
              activeTab === 'writeoffs' && 'bg-rose-100',
            )}>
              <currentNav.icon className={cn(
                'w-5 h-5',
                activeTab === 'dashboard' && 'text-rose-600',
                activeTab === 'flowers' && 'text-emerald-600',
                activeTab === 'orders' && 'text-amber-600',
                activeTab === 'writeoffs' && 'text-rose-600',
              )} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{currentNav.label}</h1>
              <p className="text-sm text-muted-foreground">{currentNav.description}</p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'flowers' && <FlowerManager />}
          {activeTab === 'orders' && <OrderManager />}
          {activeTab === 'writeoffs' && <WriteOffManager />}
        </main>

        {/* Footer */}
        <footer className="border-t py-4 mt-auto">
          <div className="px-6 text-center text-sm text-muted-foreground">
            Цветочный магазин — Панель администратора
          </div>
        </footer>
      </div>
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
