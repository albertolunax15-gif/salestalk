"use client"

import { Mic } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/PageHeader"
import VoiceRecognizer from "../voice/VoiceRecognizer"

interface SalesHeaderProps {
  title?: string
  description?: string
  voiceOpen: boolean
  onVoiceOpenChange: (open: boolean) => void
}

export function VoiceSaleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Mic />
      Registrar venta por voz
    </Button>
  )
}

export const SalesHeader = ({
  title = "Ventas",
  description = "Historial de ventas registradas. Usa el asistente de voz para registrar nuevas.",
  voiceOpen,
  onVoiceOpenChange,
}: SalesHeaderProps) => {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={<VoiceSaleButton onClick={() => onVoiceOpenChange(true)} />}
      />

      <Dialog open={voiceOpen} onOpenChange={onVoiceOpenChange}>
        <DialogContent className="flex h-[min(760px,calc(100dvh-2rem))] max-w-5xl flex-col gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Asistente de ventas por voz</DialogTitle>
          <DialogDescription className="sr-only">
            Dicta la venta, revisa la interpretación y confírmala.
          </DialogDescription>
          <VoiceRecognizer
            title="Asistente de ventas por voz"
            initialLang="es-PE"
            onClose={() => onVoiceOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
