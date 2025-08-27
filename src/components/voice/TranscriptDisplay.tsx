type TranscriptDisplayProps = {
  finalText: string
  interimText: string
}

export const TranscriptDisplay = ({ finalText, interimText }: TranscriptDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1">Transcripción (final):</div>
        <div className="min-h-[120px] rounded-md border p-3 text-sm whitespace-pre-wrap bg-gray-50">
          {finalText || <span className="text-gray-400">Aquí aparecerá el texto final…</span>}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-1">Intermedio (en vivo):</div>
        <div className="min-h-[120px] rounded-md border p-3 text-sm text-gray-600 italic whitespace-pre-wrap bg-gray-50">
          {interimText || <span className="text-gray-400">Aquí aparecerá el texto intermedio…</span>}
        </div>
      </div>
    </div>
  )
}