import type { LucideIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"

interface KpiCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  loading?: boolean
}

export function KpiCard({ label, value, hint, icon: Icon, loading }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent">
          <Icon className="size-4 text-accent-foreground" aria-hidden />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3.5 w-24" />
        </>
      ) : (
        <>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-3xl">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </>
      )}
    </div>
  )
}
