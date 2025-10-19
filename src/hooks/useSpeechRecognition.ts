"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WS_REALTIME_ENDPOINT } from "@/constants/auth";

/* ===== Tipos mínimos Web Speech API ===== */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionResultListLike {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}
interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultListLike;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((ev: Event) => void) | null;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}
declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

/* ===== Hook público ===== */

type Engine = "webspeech" | "vosk";

type UseSpeechRecognitionProps = {
  initialLang: string;
  onFinalText?: (text: string) => void;
  onInterimText?: (text: string) => void;
  autoRestart?: boolean;

  /** Elige motor (default: "webspeech") */
  engine?: Engine;

  /** URL del WebSocket Vosk cuando engine === "vosk" */
  wsUrl?: string; // p.ej. "ws://127.0.0.1:8000/api/realtime/ws"
};

type UseSpeechRecognitionReturn = {
  supported: boolean;
  isListening: boolean;
  interim: string;
  finalText: string;
  lang: string;
  setLang: (l: string) => void;
  errorMsg: string | null;
  confidence: number | null;
  start: () => void;
  stop: () => void;
  clear: () => void;
};

export function useSpeechRecognition({
  initialLang,
  onFinalText,
  onInterimText,
  autoRestart = true,
  engine = "webspeech",
  wsUrl,
}: UseSpeechRecognitionProps): UseSpeechRecognitionReturn {
  /* ==============================
     Modo A) WebSpeech (navegador)
     ============================== */
  const RecognitionCtor = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }, []);

  /* ==============================
     Estado común a ambos motores
     ============================== */
  const [supported, setSupported] = useState<boolean>(true);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [lang, setLang] = useState(initialLang);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  /* refs comunes */
  const shouldAutoRestartRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  /* ==============================
     Internos WebSpeech
     ============================== */
  const recogRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (engine !== "webspeech") return;

    const has = Boolean(RecognitionCtor);
    setSupported(has);
    if (!has || !RecognitionCtor) return;

    const recog = new RecognitionCtor();
    recogRef.current = recog;

    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = lang;
    recog.maxAlternatives = 1;

    recog.onresult = (ev: SpeechRecognitionEventLike) => {
      let interimText = "";
      let finalChunk = "";
      let lastConf: number | undefined;

      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        const alt = res[0];
        if (!alt) continue;

        if (res.isFinal) {
          finalChunk += (finalChunk ? " " : "") + alt.transcript;
          lastConf = alt.confidence;
        } else {
          interimText += (interimText ? " " : "") + alt.transcript;
        }
      }

      setInterim(interimText);
      if (interimText && onInterimText) onInterimText(interimText);

      if (finalChunk) {
        setFinalText((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk));
        if (onFinalText) onFinalText(finalChunk);
        setConfidence(typeof lastConf === "number" ? lastConf : null);
      }
    };

    recog.onerror = (ev: SpeechRecognitionErrorEventLike) => {
      setErrorMsg(ev.message ?? ev.error ?? "Error de reconocimiento de voz");
    };

    recog.onend = () => {
      setIsListening(false);
      if (autoRestart && shouldAutoRestartRef.current) {
        if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = window.setTimeout(() => {
          try {
            recog.start();
            setIsListening(true);
          } catch {
            /* noop */
          }
        }, 150);
      }
    };

    return () => {
      if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
      try {
        recog.onresult = null;
        recog.onerror = null;
        recog.onend = null;
        recog.abort();
      } catch {}
      recogRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RecognitionCtor, autoRestart, onFinalText, onInterimText, engine]);

  useEffect(() => {
    if (engine === "webspeech" && recogRef.current) {
      recogRef.current.lang = lang;
    }
  }, [lang, engine]);

  /* ==============================
     Modo B) Vosk WS (servidor)
     ============================== */
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const srcRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // URL por defecto del WS tomada de constants/auth
  const DEFAULT_WS_URL = WS_REALTIME_ENDPOINT;

  // util: downsample + float32 -> Int16 PCM16@16k
  const toPCM16_16k = useCallback((float32: Float32Array, inRate: number) => {
    const outRate = 16000;
    const ratio = inRate / outRate;
    const len = Math.floor(float32.length / ratio);
    const out = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(i * ratio);
      let s = Math.max(-1, Math.min(1, float32[idx] || 0));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }, []);

  // setup / cleanup para Vosk
  const setupVosk = useCallback(async () => {
    // usa wsUrl si la pasas, si no la de constants/auth
    const effectiveWsUrl = wsUrl || DEFAULT_WS_URL;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);

    const bufferSize = 4096;
    const proc = ctx.createScriptProcessor(bufferSize, 1, 1);
    proc.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = toPCM16_16k(input, ctx.sampleRate);
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(pcm16.buffer);
      }
    };

    source.connect(proc);
    proc.connect(ctx.destination);

    const ws = new WebSocket(effectiveWsUrl);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => setIsListening(true);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === "partial") {
          setInterim(msg.text || "");
          if (msg.text && onInterimText) onInterimText(msg.text);
        } else if (msg.type === "final") {
          const txt = (msg.text || "").trim();
          if (txt) {
            setFinalText((prev) => (prev ? `${prev} ${txt}` : txt));
            if (onFinalText) onFinalText(txt);
          }
          setInterim("");
        } else if (msg.type === "error") {
          setErrorMsg(msg.error || "Error en WS");
        }
      } catch {
        // ignorar mensajes no-JSON
      }
    };
    ws.onerror = () => setErrorMsg("Error en WebSocket");
    ws.onclose = () => setIsListening(false);

    wsRef.current = ws;
    audioCtxRef.current = ctx;
    procRef.current = proc;
    srcRef.current = source;
    streamRef.current = stream;

    setSupported(true);
  }, [wsUrl, DEFAULT_WS_URL, toPCM16_16k, onFinalText, onInterimText]);

  const cleanupVosk = useCallback(() => {
    try { wsRef.current?.close(); } catch {}
    try { procRef.current?.disconnect(); } catch {}
    try { srcRef.current?.disconnect(); } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    wsRef.current = null;
    procRef.current = null;
    srcRef.current = null;
    streamRef.current = null;
    audioCtxRef.current = null;
    setIsListening(false);
  }, []);

  /* ==============================
     start/stop/clear unificados
     ============================== */
  const start = useCallback(() => {
    setErrorMsg(null);
    if (engine === "webspeech") {
      if (!recogRef.current) { setSupported(false); return; }
      try {
        shouldAutoRestartRef.current = true;
        recogRef.current.start();
        setIsListening(true);
      } catch {}
    } else {
      setupVosk().catch((e) => {
        setErrorMsg(e?.message || String(e));
        setSupported(false);
      });
    }
  }, [engine, setupVosk]);

  const stop = useCallback(() => {
    if (engine === "webspeech") {
      if (!recogRef.current) return;
      try {
        shouldAutoRestartRef.current = false;
        recogRef.current.stop();
        setIsListening(false);
      } catch {}
    } else {
      cleanupVosk();
    }
  }, [engine, cleanupVosk]);

  const clear = useCallback(() => {
    setInterim("");
    setFinalText("");
    setConfidence(null);
    setErrorMsg(null);
  }, []);

  useEffect(() => {
    return () => {
      if (engine === "vosk") cleanupVosk();
    };
  }, [engine, cleanupVosk]);

  useEffect(() => {
    if (engine === "webspeech") {
      setSupported(Boolean(RecognitionCtor));
    }
  }, [engine, RecognitionCtor]);

  return {
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
  };
}