import { AlertCircle } from "lucide-react"

type ErrorDisplayProps = {
  errorMsg: string | null
}

export const ErrorDisplay = ({ errorMsg }: ErrorDisplayProps) => {
  if (!errorMsg) return null
  
  return (
    <div className="text-sm text-red-600 p-2 bg-red-50 rounded-md flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      {errorMsg}
    </div>
  )
}