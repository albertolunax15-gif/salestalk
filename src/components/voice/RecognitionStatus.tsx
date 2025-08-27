type RecognitionStatusProps = {
  supported: boolean
  isListening: boolean
}

export const RecognitionStatus = ({ supported, isListening }: RecognitionStatusProps) => {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-md ${
        supported ? (isListening ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700")
                  : "bg-red-100 text-red-700"
      }`}
    >
      {supported ? (isListening ? "Escuchando" : "Listo") : "No soportado"}
    </span>
  )
}