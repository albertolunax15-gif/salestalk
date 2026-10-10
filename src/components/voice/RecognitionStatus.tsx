import { Badge } from "@/components/ui/badge"

type RecognitionStatusProps = {
  supported: boolean
  isListening: boolean
}

export const RecognitionStatus = ({ supported, isListening }: RecognitionStatusProps) => {
  if (!supported) return <Badge variant="destructive" dot>No soportado</Badge>
  if (isListening)
    return (
      <Badge variant="default" className="gap-2">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        Escuchando
      </Badge>
    )
  return <Badge variant="secondary" dot>Listo</Badge>
}
