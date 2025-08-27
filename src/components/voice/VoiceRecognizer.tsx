"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import { RecognitionStatus } from "./RecognitionStatus"
import { ErrorDisplay } from "./ErrorDisplay"
import { TranscriptDisplay } from "./TranscriptDisplay"
import { LanguageSelector } from "./LanguageSelector"
import { ActionButtons } from "./ActionButtons"

import { nlpInterpret, nlpConfirmSale } from "@/lib/nlpClient"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

import { emitSaleCreated } from "@/lib/salesBus";

declare global {
  interface Window {
    webkitSpeechRecognition?: any
    SpeechRecognition?: any
  }
}

export type Language = { code: string; name: string }

type SaleCreated = {
  id: string
  product_id: string
  quantity: number
  payment_method: string
  date: string
  created_at: string
}

export type VoiceRecognizerProps = {
  title?: string
  initialLang?: string
  languages?: Language[]
  onFinalText?: (text: string) => void
  onInterimText?: (text: string) => void
  className?: string
  autoRestart?: boolean
  candidateProducts?: string[] | Array<{ id?: string; name: string }>
  onClose?: () => void
  onSaleCreated?: (sale: SaleCreated) => void
}

const DEFAULT_LANGUAGES: Language[] = [
  { code: "es-ES", name: "Español (España)" },
  { code: "es-MX", name: "Español (México)" },
  { code: "es-PE", name: "Español (Perú)" },
  { code: "es-AR", name: "Español (Argentina)" },
  { code: "es-CO", name: "Español (Colombia)" },
  { code: "en-US", name: "English (US)" },
]

type NLPInterpretResponse = {
  intent: "crear_venta" | "listar_ventas" | "ayuda"
  confidence: number
  entities: Record<string, any>
  notes: string[]
  command?: { action: string; data: Record<string, any> }
  needs_confirmation?: boolean
  candidates?: Array<{ id: string; name: string; score?: number }>
}

export default function VoiceRecognizer({
  title = "Reconocedor de Voz",
  initialLang = "es-ES",
  languages = DEFAULT_LANGUAGES,
  onFinalText,
  onInterimText,
  className,
  autoRestart = true,
  candidateProducts,
  onClose,
  onSaleCreated,
}: VoiceRecognizerProps) {
  const { token } = useAuth()
  const { toast } = useToast()

  const {
    supported,
    isListening,
    interim,
    finalText,
    lang,
    setLang,
    errorMsg,
    confidence,
    start,
    stop,
    clear,
  } = useSpeechRecognition({
    initialLang,
    onFinalText,
    onInterimText,
    autoRestart,
  })

  // ---- Estado de NLP / Confirmación ----
  const [sending, setSending] = useState(false)
  const [nlpResult, setNlpResult] = useState<NLPInterpretResponse | null>(null)
  const [nlpError, setNlpError] = useState<string | null>(null)

  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const canSend = Boolean(finalText?.trim() && token)

  // ---- Enviar a /nlp/interpret ----
  const handleSendToNLP = async () => {
    const text = finalText?.trim()
    if (!text) return

    if (!token) {
      setNlpError("No hay token de autenticación. Inicia sesión.")
      return
    }

    setSending(true)
    setNlpError(null)
    setNlpResult(null)
    setConfirmError(null)
    setSelectedProductId(null)

    try {
      const resp = await nlpInterpret({
        text,
        token,
        candidateProducts: candidateProducts as any,
      })
      setNlpResult(resp)

      // Pre-selección si ya viene product_id o hay un solo candidato
      const pid = (resp?.entities as any)?.product_id as string | null
      const cands =
        (resp?.candidates ?? (resp?.entities as any)?._candidates) as
          | Array<{ id: string; name: string }>
          | undefined

      if (pid) setSelectedProductId(pid)
      else if (cands && cands.length === 1 && cands[0].id) setSelectedProductId(cands[0].id)
    } catch (e: any) {
      setNlpError(e?.message ?? "Error llamando a NLP")
    } finally {
      setSending(false)
    }
  }

  // ---- Confirmar venta (POST /nlp/confirm_sale) ----
  const handleConfirm = async () => {
    if (!token) {
      setConfirmError("No hay token de autenticación. Inicia sesión.")
      return
    }
    setConfirming(true)
    setConfirmError(null)

    try {
      const quantity: number = (nlpResult?.entities as any)?.quantity ?? 1
      const paymentMethod: string = (nlpResult?.entities as any)?.payment_method ?? "Efectivo"
      const dateIso: string | undefined = (nlpResult?.entities as any)?.date

      if (!selectedProductId) {
        throw new Error("Selecciona un producto para confirmar.")
      }

      const sale = await nlpConfirmSale({
        token,
        productId: selectedProductId,
        quantity,
        paymentMethod: paymentMethod as any,
        date: dateIso,
      })

      // --- UI: toast + cerrar modal + limpiar estado ---
      const candidates = (nlpResult?.candidates ??
        (nlpResult?.entities as any)?._candidates) as
        | Array<{ id: string; name: string }>
        | undefined

      const productName =
        candidates?.find((c) => c.id === selectedProductId)?.name ||
        (nlpResult?.entities as any)?.product_name ||
        "Producto"

      toast({
        title: "Venta creada",
        description: `${productName} • ${quantity} unid • ${paymentMethod}`,
      })

      emitSaleCreated(sale);
      onSaleCreated?.(sale)
      onClose?.()
      clear()
      setNlpResult(null)
      setSelectedProductId(null)
    } catch (e: any) {
      setConfirmError(e?.message ?? "Error confirmando la venta")
    } finally {
      setConfirming(false)
    }
  }

  // ---- Panel de confirmación ----
  const confirmPanel = useMemo(() => {
    if (!nlpResult) return null
    if (nlpResult.intent !== "crear_venta") return null

    const needs =
      Boolean(nlpResult.needs_confirmation) || !(nlpResult.entities as any)?.product_id

    const cands: Array<{ id: string; name: string; score?: number }> =
      nlpResult.candidates ?? (nlpResult.entities as any)?._candidates ?? []

    const q = (nlpResult.entities as any)?.quantity ?? 1
    const pm = (nlpResult.entities as any)?.payment_method ?? "Efectivo"

    return (
      <div className="space-y-2">
        <div className="text-sm">
          <strong>Resumen:</strong> {q} unidad(es) — Pago: {pm}
        </div>

        {needs ? (
          <>
            <div className="text-sm">Selecciona el producto detectado:</div>
            <select
              className="w-full border rounded p-2 text-sm"
              value={selectedProductId ?? ""}
              onChange={(e) => setSelectedProductId(e.target.value || null)}
            >
              <option value="">-- Elegir producto --</option>
              {cands?.map((c) => (
                <option key={c.id ?? c.name} value={c.id ?? ""}>
                  {c.name}
                  {typeof c.score === "number" ? ` (score ${c.score})` : ""}
                </option>
              ))}
            </select>

            <div className="pt-1">
              <Button onClick={handleConfirm} disabled={!selectedProductId || confirming}>
                {confirming ? "Confirmando..." : "Confirmar venta"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm">
              Producto:{" "}
              <span className="font-medium">
                {(nlpResult.entities as any)?.product_name ?? "—"}
              </span>
            </div>
            <Button onClick={handleConfirm} disabled={confirming || !selectedProductId}>
              {confirming ? "Confirmando..." : "Confirmar venta"}
            </Button>
          </>
        )}

        {confirmError && (
          <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
            {confirmError}
          </div>
        )}
      </div>
    )
  }, [nlpResult, selectedProductId, confirming, confirmError])

  return (
    <Card className={`bg-white shadow-lg ${className ?? ""} max-h-[80vh] overflow-hidden`}>
      <CardHeader className="border-b p-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg md:text-xl font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <LanguageSelector lang={lang} languages={languages} onLanguageChange={setLang} />
            <RecognitionStatus supported={supported} isListening={isListening} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* GRID 2 columnas en md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {/* Columna izquierda: acciones + transcript en panel scrollable */}
          <div className="flex min-h-0 flex-col gap-3">
            <ActionButtons
              supported={supported}
              isListening={isListening}
              onStart={start}
              onStop={stop}
              onClear={() => {
                clear()
                setNlpError(null)
                setNlpResult(null)
                setConfirmError(null)
                setSelectedProductId(null)
              }}
              onSendToNLP={handleSendToNLP}
              canSend={canSend}
              sending={sending}
            />

            {!supported && (
              <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Tu navegador/entorno no permite Web Speech API. Usa Chrome/Edge en escritorio y HTTPS (o localhost).
              </div>
            )}

            {/* Panel scrollable para transcript/errores */}
            <div className="min-h-[220px] md:min-h-[280px] max-h-[48vh] overflow-y-auto rounded border bg-white p-3 space-y-2">
              <ErrorDisplay errorMsg={errorMsg} />
              {confidence !== null && (
                <div className="text-xs text-gray-500">
                  Confianza última frase: {(confidence * 100).toFixed(1)}%
                </div>
              )}
              <TranscriptDisplay finalText={finalText} interimText={interim} />
            </div>

            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded-md">
              <strong>Consejo:</strong> Ejecuta en HTTPS (o localhost). En Brave, desactiva <em>Shields</em> o usa Chrome/Edge.
            </div>
          </div>

          {/* Columna derecha: resultado NLP + confirmación en panel scrollable */}
          <div className="flex min-h-0 flex-col">
            <div className="min-h-[220px] md:min-h-[280px] max-h-[48vh] overflow-y-auto rounded border bg-white p-3">
              {nlpError && (
                <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">
                  {nlpError}
                </div>
              )}

              {!nlpResult ? (
                <div className="text-sm text-gray-500">Envía el texto reconocido para interpretar la intención.</div>
              ) : (
                <div className="text-sm space-y-3">
                  <div>
                    <strong>Intent:</strong> {nlpResult.intent} (
                    {Math.round((nlpResult.confidence ?? 0) * 100)}%)
                  </div>

                  <div>
                    <strong>Entities:</strong>
                    <pre className="mt-1 text-xs overflow-auto max-h-40 border rounded bg-gray-50 p-2">
                      {JSON.stringify(nlpResult.entities, null, 2)}
                    </pre>
                  </div>

                  {nlpResult.notes?.length > 0 && (
                    <div className="text-amber-700">
                      <strong>Notas:</strong> {nlpResult.notes.join(" • ")}
                    </div>
                  )}

                  {/* Confirmación */}
                  {confirmPanel}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}