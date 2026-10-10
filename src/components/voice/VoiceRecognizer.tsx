"use client";

import { useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Loader2, Mic, Plus, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

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
        variant: "success",
        title: "Venta registrada",
        description: `${productName} · ${quantity} u · ${paymentMethod}`,
      });

      // 👇 NUEVO: voz al crear con éxito
      try { speak(`Venta creada correctamente`); } catch {}

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

  // Datos derivados de la interpretación
  const isSale = nlpResult?.intent === "crear_venta";
  const cands: Candidate[] = nlpResult?.candidates ?? nlpResult?.entities._candidates ?? [];
  const needsProduct = Boolean(nlpResult && (nlpResult.needs_confirmation || !nlpResult.entities.product_id));
  const confidencePct = Math.round((nlpResult?.confidence ?? 0) * 100);
  const canConfirm = isSale && !confirming && Boolean(selectedProductId) && !justConfirmed;

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col bg-card", className)}>
      {/* Encabezado */}
      <header className="flex shrink-0 flex-col gap-3 border-b px-5 py-4 pr-12 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <Mic className="size-4 text-accent-foreground" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">Dicta, revisa y confirma</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <LanguageSelector lang={lang} languages={languages} onLanguageChange={setLang} />
          </div>
          <RecognitionStatus supported={supported} isListening={isListening} />
        </div>
      </header>

      {/* Cuerpo */}
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
        {/* Paso 1: dictado */}
        <section aria-labelledby="step-dictate" className="flex min-h-0 flex-col gap-4 border-b p-5 lg:border-b-0 lg:border-r">
          <StepTitle id="step-dictate" n={1} title="Dicta la venta" />

          <ActionButtons
            supported={supported}
            isListening={isListening}
            onStart={start}
            onStop={stop}
            onClear={resetForm}
            onSendToNLP={handleSendToNLP}
            canSend={canSend}
            sending={sending}
          />

          {!supported && (
            <ErrorDisplay errorMsg="Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge en escritorio, con HTTPS o localhost." />
          )}
          <ErrorDisplay errorMsg={errorMsg} />

          <div
            className={cn(
              "min-h-[140px] flex-1 overflow-y-auto rounded-lg border bg-background p-4 transition-colors overscroll-contain lg:min-h-0",
              isListening && "border-primary/50 ring-[3px] ring-primary/10"
            )}
            tabIndex={0}
            aria-label="Transcripción"
          >
            <TranscriptDisplay finalText={finalText} interimText={interim} />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {confidence !== null ? `Confianza de reconocimiento: ${(confidence * 100).toFixed(0)}%` : "Funciona mejor en Chrome o Edge."}
            </span>
          </div>
        </section>

        {/* Paso 2: revisión */}
        <section aria-labelledby="step-review" className="flex min-h-0 flex-col gap-4 p-5 lg:overflow-y-auto">
          <StepTitle id="step-review" n={2} title="Revisa y confirma" />

          {nlpError && <ErrorDisplay errorMsg={nlpError} />}

          {!nlpResult ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
              <Sparkles className="mb-3 size-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Sin interpretación todavía</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Cuando termines de dictar, presiona <span className="font-medium">Interpretar</span> para extraer producto, cantidad y método de pago.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {justConfirmed && lastSale && (
                <div role="status" className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>
                    Venta <span className="font-mono text-xs">#{lastSale.id.slice(0, 8)}</span> registrada correctamente.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Badge variant={isSale ? "default" : "secondary"}>{INTENT_LABELS[nlpResult.intent] ?? nlpResult.intent}</Badge>
                <span className="text-xs text-muted-foreground tabular-nums">Confianza {confidencePct}%</span>
              </div>

              {isSale ? (
                <>
                  <dl className="grid grid-cols-2 gap-2">
                    <Field label="Cantidad">{nlpResult.entities.quantity ?? 1} u</Field>
                    <Field label="Método de pago">{normalizePaymentMethod(nlpResult.entities.payment_method)}</Field>
                    {!needsProduct && (
                      <div className="col-span-2">
                        <Field label="Producto">{nlpResult.entities.product_name ?? "—"}</Field>
                      </div>
                    )}
                  </dl>

                  {needsProduct && (
                    <div className="space-y-2">
                      <Label htmlFor="voice-product">Producto</Label>
                      <Select
                        id="voice-product"
                        value={selectedProductId ?? ""}
                        onChange={(e) => setSelectedProductId(e.target.value || null)}
                        disabled={justConfirmed}
                      >
                        <option value="">Selecciona el producto…</option>
                        {cands.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {typeof c.score === "number" ? ` (${Math.round(c.score * (c.score <= 1 ? 100 : 1))}%)` : ""}
                          </option>
                        ))}
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {cands.length > 0
                          ? "Encontramos varias coincidencias; elige la correcta."
                          : "No identificamos el producto. Vuelve a dictar mencionando su nombre."}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Esta instrucción no corresponde a una venta. Dicta una venta para continuar.
                </p>
              )}

              {nlpResult.notes?.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-foreground dark:text-warning" />
                  <ul className="space-y-0.5">
                    {nlpResult.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {confirmError && <ErrorDisplay errorMsg={confirmError} />}

              <details className="group rounded-lg border text-xs">
                <summary className="cursor-pointer select-none px-3 py-2 text-muted-foreground hover:text-foreground">
                  Ver datos técnicos
                </summary>
                <pre className="max-h-48 overflow-auto border-t bg-muted/50 p-3 font-mono">
                  {JSON.stringify(nlpResult.entities, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>
      </div>

      {/* Pie de acciones */}
      <footer
        className="flex shrink-0 items-center justify-end gap-2 border-t bg-muted/30 px-5 py-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            {justConfirmed ? "Cerrar" : "Cancelar"}
          </Button>
        )}
        {justConfirmed ? (
          <Button onClick={resetForm}>
            <Plus />
            Nueva venta
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {confirming ? <Loader2 className="animate-spin" /> : <Check />}
            Confirmar venta
          </Button>
        )}
      </footer>
    </div>
  );
}

const INTENT_LABELS: Record<NLPInterpretResponse["intent"], string> = {
  crear_venta: "Registrar venta",
  listar_ventas: "Consultar ventas",
  ayuda: "Ayuda",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function StepTitle({ id, n, title }: { id: string; n: number; title: string }) {
  return (
    <h3 id={id} className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {n}
      </span>
      {title}
    </h3>
  );
}
