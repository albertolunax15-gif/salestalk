"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { RecognitionStatus } from "./RecognitionStatus";
import { ErrorDisplay } from "./ErrorDisplay";
import { TranscriptDisplay } from "./TranscriptDisplay";
import { LanguageSelector } from "./LanguageSelector";
import { ActionButtons } from "./ActionButtons";

import { nlpInterpret, nlpConfirmSale } from "@/lib/nlpClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { emitSaleCreated } from "@/lib/salesBus";

export type Language = { code: string; name: string };

// Tipo EXACTO que tu nlpClient espera
type StrictPaymentMethod = "Efectivo" | "Tarjeta" | "Yape" | "Plin" | "Transferencia";

// Normaliza cualquier string a uno de los 5 valores válidos
function normalizePaymentMethod(pm?: unknown): StrictPaymentMethod {
  const v = String(pm ?? "").trim().toLowerCase();
  switch (v) {
    case "efectivo":
      return "Efectivo";
    case "tarjeta":
      return "Tarjeta";
    case "yape":
      return "Yape";
    case "plin":
      return "Plin";
    case "transferencia":
      return "Transferencia";
    default:
      return "Efectivo"; // fallback seguro
  }
}

type Candidate = {
  id: string;
  name: string;
  score?: number;
};

type Entities = {
  product_id?: string;
  product_name?: string;
  quantity?: number;
  payment_method?: string; // string libre; lo normalizamos al enviar
  date?: string; // ISO
  _candidates?: Candidate[];
};

type NLPInterpretResponse = {
  intent: "crear_venta" | "listar_ventas" | "ayuda";
  confidence: number;
  entities: Entities;
  notes: string[];
  command?: { action: string; data: Record<string, unknown> };
  needs_confirmation?: boolean;
  candidates?: Candidate[];
};

type SaleCreated = {
  id: string;
  product_id: string;
  quantity: number;
  payment_method: string;
  date: string;
  created_at: string;
};

export type VoiceRecognizerProps = {
  title?: string;
  initialLang?: string;
  languages?: Language[];
  onFinalText?: (text: string) => void;
  onInterimText?: (text: string) => void;
  className?: string;
  autoRestart?: boolean;
  candidateProducts?: Array<string | Candidate>;
  onClose?: () => void;
  onSaleCreated?: (sale: SaleCreated) => void;
};

// Utilidad para mensajes de error sin any
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Error desconocido";
  }
}

// Convierte candidates mixtos a string[] (id o name) para la firma actual de nlpInterpret
function normalizeCandidates(input?: Array<string | Candidate>): string[] | undefined {
  if (!input) return undefined;
  const out = input.map((c) => (typeof c === "string" ? c : c.id || c.name)).filter((v): v is string => Boolean(v));
  return out.length ? out : undefined;
}

const DEFAULT_LANGUAGES: Language[] = [
  { code: "es-ES", name: "Español (España)" },
  { code: "es-MX", name: "Español (México)" },
  { code: "es-PE", name: "Español (Perú)" },
  { code: "es-AR", name: "Español (Argentina)" },
  { code: "es-CO", name: "Español (Colombia)" },
  { code: "en-US", name: "English (US)" },
];

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
  const { token } = useAuth();
  const { toast } = useToast();

  const { supported, isListening, interim, finalText, lang, setLang, errorMsg, confidence, start, stop, clear } =
    useSpeechRecognition({
      initialLang,
      onFinalText,
      onInterimText,
      autoRestart,
    });

  // ======= TTS (mínimo necesario) =======
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  function speak(text: string) {
    if (!synth || !text) return;
    try {
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      // voz española si existe; si no, la primera disponible
      const voices = synth.getVoices();
      const v =
        voices.find((vv) => vv.lang?.toLowerCase() === "es-pe") ||
        voices.find((vv) => vv.lang?.toLowerCase() === "es-es") ||
        voices.find((vv) => vv.lang?.toLowerCase().startsWith("es-")) ||
        voices[0] ||
        null;
      if (v) u.voice = v;
      u.lang = v?.lang || "es-ES";
      u.rate = 1;
      u.pitch = 1;
      u.volume = 1;
      synth.speak(u);
    } catch {}
  }
  function speakAmbigua() {
    speak("Necesitamos validar los datos antes de crear la venta");
  }
  // ======================================

  // Estado
  const [sending, setSending] = useState(false);
  const [nlpResult, setNlpResult] = useState<NLPInterpretResponse | null>(null);
  const [nlpError, setNlpError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // 👇 Nuevo: estado para mantener layout tras confirmar
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [lastSale, setLastSale] = useState<SaleCreated | null>(null);

  const canSend = Boolean(finalText?.trim() && token);

  const resetForm = () => {
    clear();
    setNlpError(null);
    setNlpResult(null);
    setConfirmError(null);
    setSelectedProductId(null);
    setJustConfirmed(false);
    setLastSale(null);
  };

  // Interpretación
  const handleSendToNLP = async (): Promise<void> => {
    const text = finalText?.trim();
    if (!text) return;
    if (!token) {
      setNlpError("No hay token de autenticación. Inicia sesión.");
      return;
    }

    setSending(true);
    setNlpError(null);
    setConfirmError(null);
    setJustConfirmed(false); // si re-interpretas, vuelves al estado normal

    try {
      const resp = await nlpInterpret({
        text,
        token,
        candidateProducts: normalizeCandidates(candidateProducts),
      });

      const parsed = resp as NLPInterpretResponse;
      setNlpResult(parsed);

      // === AUDIO: si la interpretación luce ambigua, hablar ===
      try {
        const notes = parsed.notes ?? [];
        const hasAmbWord = notes.some((n) => /ambig(uo|ua|uidad)/i.test(n));
        const needs = parsed.needs_confirmation === true;
        const cands = parsed.candidates ?? parsed.entities._candidates ?? [];
        const missingIdOrMany = !parsed.entities?.product_id && cands.length !== 1; // 0 o >1
        if (hasAmbWord || needs || missingIdOrMany) {
          speakAmbigua();
        }
      } catch {}

      const pid = parsed.entities.product_id ?? null;
      const cands = parsed.candidates ?? parsed.entities._candidates ?? [];

      if (pid) setSelectedProductId(pid);
      else if (cands.length === 1 && cands[0]?.id) setSelectedProductId(cands[0].id);
    } catch (e: unknown) {
      setNlpError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  // Confirmación → crear venta
  const handleConfirm = async (): Promise<void> => {
    if (!token) {
      setConfirmError("No hay token de autenticación. Inicia sesión.");
      return;
    }
    setConfirming(true);
    setConfirmError(null);

    try {
      const quantity = nlpResult?.entities.quantity ?? 1;
      const paymentMethod: StrictPaymentMethod = normalizePaymentMethod(nlpResult?.entities.payment_method);
      const dateIso: string | undefined = nlpResult?.entities.date;

      if (!selectedProductId) throw new Error("Selecciona un producto para confirmar.");

      const saleResp = await nlpConfirmSale({
        token,
        productId: selectedProductId,
        quantity,
        paymentMethod,
        date: dateIso,
      });

      const sale: SaleCreated = saleResp as SaleCreated;

      const cands: Candidate[] = nlpResult?.candidates ?? nlpResult?.entities._candidates ?? [];
      const productName = cands.find((c) => c.id === selectedProductId)?.name ?? nlpResult?.entities.product_name ?? "Producto";

      toast({
        title: "Venta creada",
        description: `${productName} • ${quantity} unid • ${paymentMethod}`,
      });

      // 👇 NUEVO: voz al crear con éxito
      try { speak(`Venta creada correctamente`); } catch {}

      emitSaleCreated(sale);
      onSaleCreated?.(sale);

      // ✅ Mantener layout...
      setLastSale(sale);
      setJustConfirmed(true);
      clear();

      emitSaleCreated(sale);
      onSaleCreated?.(sale);

      // ✅ Mantener layout: no cerramos ni borramos todo; mostramos estado "justConfirmed"
      setLastSale(sale);
      setJustConfirmed(true);

      // Opcional: limpiar solo la transcripción para nueva orden por voz
      clear();
    } catch (e: unknown) {
      // === AUDIO: si el backend sugiere que el producto no existe / ambigüedad ===
      try {
        const msg = (typeof e === "string" ? e : (e as any)?.message ?? "").toString().toLowerCase();
        if (
          /404|no\s*encontrad[oa]|no\s*existe|producto\s*(in|)valido|ambig|no\s*se\s*pudo\s*resolver/.test(msg)
        ) {
          speakAmbigua();
        }
      } catch {}
      setConfirmError(errorMessage(e));
    } finally {
      setConfirming(false);
    }
  };

  // Footer de acciones (sticky) — permanece montado siempre para evitar saltos
  const ConfirmFooter = ({
    disabled,
  }: {
    disabled: boolean;
  }) => {
    return (
      <div
        className="sticky bottom-0 z-10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80
                   border-t h-16 flex items-center gap-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {justConfirmed ? (
          <>
            <Button variant="secondary" className="w-full sm:w-auto" onClick={resetForm}>
              Nueva venta
            </Button>
            {onClose && (
              <Button className="w-full sm:w-auto" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </>
        ) : (
          <Button className="w-full sm:w-auto" onClick={handleConfirm} disabled={disabled}>
            {confirming ? "Confirmando..." : "Confirmar venta"}
          </Button>
        )}
      </div>
    );
  };

  // Panel de confirmación (contenido; el footer siempre está)
  const confirmPanelBody = useMemo(() => {
    if (!nlpResult || nlpResult.intent !== "crear_venta") return null;

    const needs = Boolean(nlpResult.needs_confirmation) || !nlpResult.entities.product_id;
    const cands: Candidate[] = nlpResult.candidates ?? nlpResult.entities._candidates ?? [];
    const q = nlpResult.entities.quantity ?? 1;
    const pmDisplay = nlpResult.entities.payment_method ?? normalizePaymentMethod(undefined);

    return (
      <div className="space-y-3">
        {/* Estado después de confirmar, mostramos un pequeño resumen */}
        {justConfirmed && lastSale && (
          <div className="p-2 rounded bg-green-50 text-green-800 text-sm">
            Venta #{lastSale.id.slice(0, 8)} creada correctamente.
          </div>
        )}

        <div className="text-sm">
          <strong>Resumen:</strong> {q} unidad(es) — Pago: {pmDisplay}
        </div>

        {needs ? (
          <>
            <div className="text-sm">Selecciona el producto detectado:</div>
            <select
              className="w-full border rounded p-2 text-sm"
              value={selectedProductId ?? ""}
              onChange={(e) => setSelectedProductId(e.target.value || null)}
              disabled={justConfirmed}
            >
              <option value="">-- Elegir producto --</option>
              {cands.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {typeof c.score === "number" ? ` (score ${c.score})` : ""}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div className="text-sm">
            Producto: <span className="font-medium">{nlpResult.entities.product_name ?? "—"}</span>
          </div>
        )}

        {confirmError && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{confirmError}</div>}
      </div>
    );
  }, [nlpResult, selectedProductId, confirmError, justConfirmed, lastSale]);

  return (
    <Card className={`bg-white shadow-lg ${className ?? ""} w-full max-w-full h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden`}>
      <CardHeader className="border-b p-3 shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg md:text-xl font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <LanguageSelector lang={lang} languages={languages} onLanguageChange={setLang} />
            </div>
            <RecognitionStatus supported={supported} isListening={isListening} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 h-full">
          {/* Izquierda: Controles y transcripción */}
          <div className="flex flex-col gap-3 min-h-0 lg:minh-full">
            <div className="shrink-0">
              <ActionButtons
                supported={supported}
                isListening={isListening}
                onStart={start}
                onStop={stop}
                onClear={() => {
                  resetForm();
                }}
                onSendToNLP={handleSendToNLP}
                canSend={canSend}
                sending={sending}
              />
            </div>

            {!supported && (
              <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md flex items-center gap-2 shrink-0">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Tu navegador/entorno no permite Web Speech API. Usa Chrome/Edge en escritorio y HTTPS (o localhost).
              </div>
            )}

            <div
              className="flex-1 min-h-[200px] lg:min-h-[280px] overflow-y-auto overflow-x-hidden rounded border bg-white p-3 space-y-2 overscroll-contain touch-pan-y"
              tabIndex={0}
            >
              <ErrorDisplay errorMsg={errorMsg} />
              {confidence !== null && (
                <div className="text-xs text-gray-500">Confianza última frase: {(confidence * 100).toFixed(1)}%</div>
              )}
              <TranscriptDisplay finalText={finalText} interimText={interim} />
            </div>

            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded-md shrink-0">
              <strong>Consejo:</strong> Ejecuta en HTTPS (o localhost). En Brave, desactiva <em>Shields</em> o usa Chrome/Edge.
            </div>
          </div>

          {/* Derecha: Resultado NLP */}
          <div className="flex flex-col min-h-0 lg:min-h-full">
            <div
              className="flex-1 min-h-[200px] lg:min-h-[280px] overflow-y-auto overflow-x-hidden rounded border bg-white p-3 overscroll-contain touch-pan-y pb-28 sm:pb-8"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)" }}
              tabIndex={0}
            >
              {nlpError && <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{nlpError}</div>}

              {!nlpResult ? (
                <div className="text-sm text-gray-500">Envía el texto reconocido para interpretar la intención.</div>
              ) : (
                <div className="text-sm space-y-3">
                  <div>
                    <strong>Intent:</strong> {nlpResult.intent} ({Math.round((nlpResult.confidence ?? 0) * 100)}%)
                  </div>

                  <div>
                    <strong>Entities:</strong>
                    <pre
                      className="mt-1 text-xs max-h-40 sm:max-h-48 border rounded bg-gray-50 p-2
                                 overflow-x-auto overflow-y-auto overscroll-contain
                                 touch-pan-x font-mono whitespace-pre"
                      role="region"
                      aria-label="Entities (scroll horizontal)"
                      tabIndex={0}
                    >
                      {JSON.stringify(nlpResult.entities, null, 2)}
                    </pre>
                  </div>

                  {nlpResult.notes?.length > 0 && (
                    <div className="text-amber-700">
                      <strong>Notas:</strong> {nlpResult.notes.join(" • ")}
                    </div>
                  )}

                  {/* Cuerpo del panel (inputs / mensajes) */}
                  {confirmPanelBody}
                </div>
              )}
            </div>

            {/* Footer sticky PERMANENTE (previene saltos de tamaño) */}
            <ConfirmFooter disabled={confirming || !selectedProductId || (justConfirmed && !nlpResult)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
