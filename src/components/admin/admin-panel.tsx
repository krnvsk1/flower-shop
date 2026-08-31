'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminAuth } from './admin-auth'
import { Dashboard } from './dashboard'
import { FlowerManager } from './flower-manager'
import { OrderManager } from './order-manager'
import { WriteOffManager } from './writeoff-manager'
import { PromoManager } from './promo-manager'
import { ClientManager } from './client-manager'
import { InboundManager } from './inbound-manager'
import { DeliveryZoneManager } from './delivery-zone'
import { NewOrderAlert } from './new-order-alert'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Flower2,
  LayoutDashboard,
  ShoppingCart,
  PackageX,
  PackagePlus,
  Percent,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  LogOut,
  ArrowUpRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabKey = 'dashboard' | 'flowers' | 'orders' | 'inbound' | 'writeoffs' | 'promo' | 'clients' | 'delivery'

const NAV_ITEMS: { key: TabKey; label: string; description: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Панель управления', description: 'Сводка по заказам, витрине и складу', icon: LayoutDashboard },
  { key: 'flowers', label: 'Товары', description: 'Ассортимент, цены и остатки', icon: Flower2 },
  { key: 'orders', label: 'Заказы', description: 'Онлайн-заказы и продажа в зале', icon: ShoppingCart },
  { key: 'clients', label: 'Клиенты', description: 'История, адреса и бонусы', icon: Users },
  { key: 'inbound', label: 'Приход', description: 'Накладные и список закупки', icon: PackagePlus },
  { key: 'writeoffs', label: 'Списания', description: 'Учёт испорченных цветов', icon: PackageX },
  { key: 'promo', label: 'Акции', description: 'Скидки, баннер и бонусы', icon: Percent },
  { key: 'delivery', label: 'Доставка', description: 'Зона на карте: круг или многоугольник', icon: MapPin },
]

function AdminContent() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const openTab = (tab: TabKey) => {
    setActiveTab(tab)
    setOrderFilter('all')
    setLowStockOnly(false)
  }

  const onDashboardNavigate = (nav: { tab: TabKey; orderStatus?: string; lowStock?: boolean }) => {
    setActiveTab(nav.tab)
    setOrderFilter(nav.orderStatus ?? 'all')
    setLowStockOnly(Boolean(nav.lowStock))
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin'
  }

  const currentNav = NAV_ITEMS.find((n) => n.key === activeTab)!

  return (
    <div className="admin-shell min-h-screen flex text-foreground">
      <aside
        className={cn(
          'sticky top-0 h-screen flex flex-col border-r border-border/80 backdrop-blur-md transition-all duration-300 z-50',
          collapsed ? 'w-[68px]' : 'w-[240px]'
        )}
      >
        <div className="flex items-center px-3 h-16 border-b border-border/60 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'flex items-center gap-2 transition-colors cursor-pointer flex-shrink-0',
              collapsed ? 'p-2 mx-auto hover:text-primary' : 'px-2 py-1.5 hover:text-primary w-full'
            )}
          >
            <span className="text-xl font-semibold leading-none">A</span>
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
                    className="text-lg font-semibold text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Atelier
                  </motion.span>
                </AnimatePresence>
                <PanelLeftClose className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
              </>
            )}
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            const button = (
              <button
                key={item.key}
                type="button"
                onClick={() => openTab(item.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors cursor-pointer border-l-2',
                  isActive
                    ? 'border-primary text-foreground bg-card/50'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card/40'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary')} />
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
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return button
          })}
        </nav>

        <div className="border-t border-border/60 px-2 py-3 flex-shrink-0 space-y-1">
          {collapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="w-full flex items-center justify-center px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowUpRight className="w-5 h-5 flex-shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  На витрину
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10}>
                  Выйти
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowUpRight className="w-5 h-5 flex-shrink-0" />
                <span>На витрину</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Выйти</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-40 border-b border-border/80 bg-[oklch(0.9_0.02_80)]/92 backdrop-blur-md">
          <div className="px-6 py-5">
            <p className="text-[10px] tracking-[0.42em] uppercase text-brass mb-1">Atelier · кабинет</p>
            <h1 className="font-medium text-3xl sm:text-4xl leading-none tracking-tight">
              {currentNav.label}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{currentNav.description}</p>
          </div>
        </header>

        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && <Dashboard onNavigate={onDashboardNavigate} />}
          {activeTab === 'flowers' && <FlowerManager lowStockOnly={lowStockOnly} />}
          {activeTab === 'orders' && <OrderManager initialStatus={orderFilter} />}
          {activeTab === 'clients' && <ClientManager />}
          {activeTab === 'inbound' && <InboundManager />}
          {activeTab === 'writeoffs' && <WriteOffManager />}
          {activeTab === 'promo' && <PromoManager />}
          {activeTab === 'delivery' && <DeliveryZoneManager />}
        </main>

        <NewOrderAlert
          onOpenOrders={() => {
            setActiveTab('orders')
            setOrderFilter('new')
          }}
        />

        <footer className="border-t border-border/60 px-6 py-6 mt-auto">
          <div className="flex items-end justify-between gap-4">
            <p className="italic text-2xl leading-none">Atelier</p>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
              Только для сотрудников
            </p>
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
