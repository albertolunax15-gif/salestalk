"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

type UseSpeechRecognitionProps = {
  initialLang: string;
  onFinalText?: (text: string) => void;
  onInterimText?: (text: string) => void;
  autoRestart?: boolean;
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
}: UseSpeechRecognitionProps): UseSpeechRecognitionReturn {
  const RecognitionCtor = useMemo<SpeechRecognitionConstructor | null>(() => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  }, []);

  const [supported, setSupported] = useState<boolean>(Boolean(RecognitionCtor));
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [lang, setLang] = useState(initialLang);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const recogRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldAutoRestartRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(Boolean(RecognitionCtor));
    if (!RecognitionCtor) return;

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
      } catch {
        /* noop */
      }
      recogRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [RecognitionCtor, autoRestart, onFinalText, onInterimText]);

  useEffect(() => {
    if (recogRef.current) {
      recogRef.current.lang = lang;
    }
  }, [lang]);

  const start = useCallback(() => {
    setErrorMsg(null);
    if (!recogRef.current) return;
    try {
      shouldAutoRestartRef.current = true;
      recogRef.current.start();
      setIsListening(true);
    } catch {
      /* noop */
    }
  }, []);

  const stop = useCallback(() => {
    if (!recogRef.current) return;
    try {
      shouldAutoRestartRef.current = false;
      recogRef.current.stop();
      setIsListening(false);
    } catch {
      /* noop */
    }
  }, []);

  const clear = useCallback(() => {
    setInterim("");
    setFinalText("");
    setConfidence(null);
    setErrorMsg(null);
  }, []);

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
