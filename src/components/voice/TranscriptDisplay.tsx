type TranscriptDisplayProps = {
  finalText: string
  interimText: string
}

export const TranscriptDisplay = ({ finalText, interimText }: TranscriptDisplayProps) => {
  const empty = !finalText && !interimText

  return (
    <div aria-live="polite" className="text-base leading-relaxed">
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Presiona <span className="font-medium text-foreground">Iniciar</span> y dicta la venta. Por ejemplo:{" "}
          <em>“Vendí dos Coca Cola de medio litro, pago con Yape”</em>.
        </p>
      ) : (
        <p className="whitespace-pre-wrap">
          <span className="text-foreground">{finalText}</span>
          {interimText && <span className="text-muted-foreground italic"> {interimText}</span>}
        </p>
      )}
    </div>
  )
}
