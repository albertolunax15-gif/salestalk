"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import VoiceRecognizer from "../voice/VoiceRecognizer"

interface SalesHeaderProps {
  title?: string
  description?: string
}

export const SalesHeader = ({
  title = "Gestión de Ventas",
  description = ""
}: SalesHeaderProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Texto principal */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>

      {/* Botón que abre el modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            Abrir Reconocedor de Voz
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Reconocimiento de Voz</DialogTitle>
          </DialogHeader>
          {/* Aquí insertamos tu componente */}
          <VoiceRecognizer
            title="Asistente de Ventas por Voz"
            initialLang="es-PE"
            onFinalText={(text) => console.log("Texto final:", text)}
            onInterimText={(text) => console.log("Texto en vivo:", text)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}