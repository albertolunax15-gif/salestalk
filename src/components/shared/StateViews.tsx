import type { ComponentType, ReactNode } from "react"
import { AlertTriangle, Inbox, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  error: string
  onRetry?: () => void
}

/** Traduce mensajes técnicos tipo "GET /sales 500 Internal Server Error {...}" a texto legible. */
export function friendlyError(error: string) {
  if (/failed to fetch|networkerror/i.test(error)) return "No se pudo conectar con el servidor. Revisa tu conexión."
  if (/\b401\b/.test(error)) return "Tu sesión expiró. Vuelve a iniciar sesión."
  if (/\b5\d\d\b/.test(error)) return "El servidor no respondió correctamente. Intenta nuevamente en unos segundos."
  return error
}

export function ErrorState({ title = "No se pudieron cargar los datos", error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{friendlyError(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RotateCw />
          Reintentar
        </Button>
      )}
    </div>
  )
}

export function TableSkeletonRows({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <div className="divide-y" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={c === 0 ? "h-4 flex-[2]" : "h-4 flex-1"} />
          ))}
        </div>
      ))}
    </div>
  )
}
