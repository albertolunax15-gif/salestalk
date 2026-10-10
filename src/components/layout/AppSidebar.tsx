"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { NAV_ITEMS, isActivePath } from "./nav"

interface AppSidebarProps {
  collapsed: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
  onLogout: () => void
  /** En el drawer móvil siempre se muestra expandido y sin botón de colapsar */
  variant?: "desktop" | "mobile"
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  variant = "desktop",
}: AppSidebarProps) {
  const pathname = usePathname()
  const isCollapsed = variant === "desktop" && collapsed

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Marca */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b px-4", isCollapsed && "justify-center px-0")}>
        <div className="relative size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
          <Image src="/salestalk-logo.png" alt="" fill sizes="32px" className="object-cover" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">SalesTalk</p>
            <p className="truncate text-xs text-muted-foreground">Panel de ventas</p>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 py-4">
        {!isCollapsed && (
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">General</p>
        )}
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  title={isCollapsed ? label : undefined}
                  className={cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-0"
                  )}
                >
                  {active && (
                    <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-primary" />
                  )}
                  <Icon className={cn("size-[18px] shrink-0", active ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {isCollapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Pie */}
      <div className="shrink-0 space-y-1 border-t p-3">
        <button
          type="button"
          onClick={onLogout}
          title={isCollapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground outline-none transition-colors",
            "hover:bg-destructive/10 hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="size-[18px] shrink-0" />
          {isCollapsed ? <span className="sr-only">Cerrar sesión</span> : <span>Cerrar sesión</span>}
        </button>

        {variant === "desktop" && onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-xs text-muted-foreground outline-none transition-colors",
              "hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isCollapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            {!isCollapsed && <span>Contraer menú</span>}
          </button>
        )}
      </div>
    </div>
  )
}
