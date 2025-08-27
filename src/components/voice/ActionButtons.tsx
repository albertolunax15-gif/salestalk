import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2, Waves, Trash2, Send } from "lucide-react"

type ActionButtonsProps = {
  supported: boolean
  isListening: boolean
  onStart: () => void
  onStop: () => void
  onClear: () => void
  // 🔽 nuevo:
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
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onStart} disabled={!supported || isListening} className="gap-2">
        {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
        Iniciar
      </Button>

      <Button onClick={onStop} variant="outline" disabled={!isListening} className="gap-2">
        <Square className="h-4 w-4" />
        Detener
      </Button>

      <Button onClick={onClear} variant="ghost" className="gap-2 text-red-600 hover:text-red-700">
        <Trash2 className="h-4 w-4" />
        Limpiar
      </Button>

      {/* 🔽 nuevo botón */}
      {onSendToNLP && (
        <Button onClick={onSendToNLP} disabled={!canSend || sending} className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar a NLP
        </Button>
      )}

      {isListening && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Waves className="h-4 w-4 animate-pulse" />
          Habla ahora...
        </div>
      )}
    </div>
  )
}