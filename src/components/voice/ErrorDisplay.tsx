import { AlertCircle } from "lucide-react"

type ErrorDisplayProps = {
  errorMsg: string | null
}

export const ErrorDisplay = ({ errorMsg }: ErrorDisplayProps) => {
  if (!errorMsg) return null

  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{errorMsg}</span>
    </div>
  )
}
