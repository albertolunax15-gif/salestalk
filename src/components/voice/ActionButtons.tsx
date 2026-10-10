import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, RotateCcw, Sparkles } from "lucide-react"

type ActionButtonsProps = {
  supported: boolean
  isListening: boolean
  onStart: () => void
  onStop: () => void
  onClear: () => void
  onSendToNLP?: () => void
  canSend?: boolean
  sending?: boolean
}

export const ActionButtons = ({
  supported,
  isListening,
  onStart,
  onStop,
  onClear,
  onSendToNLP,
  canSend = false,
  sending = false
}: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isListening ? (
        <Button onClick={onStop} variant="destructive">
          <Square className="fill-current" />
          Detener
        </Button>
      ) : (
        <Button onClick={onStart} disabled={!supported}>
          <Mic />
          Iniciar
        </Button>
      )}

      {onSendToNLP && (
        <Button onClick={onSendToNLP} variant="outline" disabled={!canSend || sending}>
          {sending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Interpretar
        </Button>
      )}

      <Button onClick={onClear} variant="ghost" className="ml-auto text-muted-foreground">
        <RotateCcw />
        Reiniciar
      </Button>
    </div>
  )
}
