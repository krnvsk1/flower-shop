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
  { key: 'inbound', label: 'Приход', description: 'Фото накладной, CSV и закупка', icon: PackagePlus },
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
    <div className="admin-shell min-h-screen flex p-3 gap-3 text-foreground">
      <aside
        className={cn(
          'admin-nav sticky top-3 h-[calc(100vh-1.5rem)] flex flex-col border border-border/70 backdrop-blur-md transition-all duration-300 z-50',
          collapsed ? 'w-[76px]' : 'w-[248px]'
        )}
      >
        <div className={cn('flex items-center flex-shrink-0 pt-3', collapsed ? 'px-2' : 'px-3')}>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              'admin-nav-item flex items-center gap-2.5 transition-colors cursor-pointer w-full',
              collapsed ? 'justify-center p-1.5' : 'px-1.5 py-1.5 hover:bg-foreground/5'
            )}
          >
            <span className="size-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-[15px] font-semibold leading-none shadow-sm">
              A
            </span>
            {collapsed ? (
              <span className="sr-only">Развернуть меню</span>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-[15px] font-medium text-foreground whitespace-nowrap overflow-hidden"
                  >
                    Atelier
                  </motion.span>
                </AnimatePresence>
                <PanelLeftClose className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-auto" />
              </>
            )}
          </button>
        </div>
        {collapsed ? (
          <div className="px-2 pt-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(false)}
                  className="admin-nav-item w-full flex items-center justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5 cursor-pointer"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Развернуть
              </TooltipContent>
            </Tooltip>
          </div>
        ) : null}

        <nav className={cn('flex-1 flex flex-col gap-1 py-4', collapsed ? 'px-2' : 'px-3')}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.key

            const button = (
              <button
                type="button"
                onClick={() => openTab(item.key)}
                data-active={isActive}
                className={cn(
                  'admin-nav-item w-full flex items-center text-sm cursor-pointer',
                  collapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-1.5',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex items-center justify-center size-8 rounded-2xl flex-shrink-0 transition-colors',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.05]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden text-left"
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
                  <TooltipContent side="right" sideOffset={12}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.key}>{button}</div>
          })}
        </nav>

        <div className={cn('flex-shrink-0 space-y-1 pb-3', collapsed ? 'px-2' : 'px-3')}>
          {collapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="/"
                    className="admin-nav-item w-full flex items-center justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  >
                    <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  На витрину
                </TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="admin-nav-item w-full flex items-center justify-center p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/8 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Выйти
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="admin-nav-item w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5"
              >
                <span className="flex items-center justify-center size-8 rounded-2xl bg-foreground/[0.05]">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span>На витрину</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="admin-nav-item w-full flex items-center gap-2.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/8 cursor-pointer"
              >
                <span className="flex items-center justify-center size-8 rounded-2xl bg-foreground/[0.05]">
                  <LogOut className="w-4 h-4" />
                </span>
                <span>Выйти</span>
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="admin-main flex-1 flex flex-col min-h-[calc(100vh-1.5rem)] min-w-0">
        <header className="sticky top-3 z-40">
          <div className="px-7 py-5">
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

        <footer className="px-7 py-5 mt-auto">
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
