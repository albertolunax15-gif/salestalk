import { useState, useRef, useMemo, useCallback, useEffect } from "react"

type UseSpeechRecognitionProps = {
  initialLang: string
  onFinalText?: (text: string) => void
  onInterimText?: (text: string) => void
  autoRestart?: boolean
}

export const useSpeechRecognition = ({
  initialLang,
  onFinalText,
  onInterimText,
  autoRestart = true,
}: UseSpeechRecognitionProps) => {
  const [supported, setSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [finalText, setFinalText] = useState("")
  const [lang, setLang] = useState(initialLang)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)

  const Recognition = useMemo(
    () =>
      typeof window !== "undefined"
        ? (window.SpeechRecognition || window.webkitSpeechRecognition)
        : null,
    []
  )

  const recogRef = useRef<any>(null)
  const startingRef = useRef(false)
  const retryRef = useRef({ count: 0, timer: 0 as any })
  const keepAliveTimer = useRef<any>(0)
  const userStoppedRef = useRef(false)
  const lastActivityRef = useRef<number>(0) // ⬅️ marca de actividad

  const clearRetry = useCallback(() => {
    if (retryRef.current.timer) {
      window.clearTimeout(retryRef.current.timer)
      retryRef.current.timer = 0
    }
    retryRef.current.count = 0
  }, [])

  // ⬇️ reinicio suave: detiene y vuelve a iniciar si procede
  const softRestart = useCallback((delay = 250) => {
    if (!autoRestart) return
    if (!recogRef.current) return
    try { recogRef.current.stop() } catch {}
    window.setTimeout(() => {
      try {
        if (recogRef.current) {
          recogRef.current.lang = lang
          startingRef.current = true
          recogRef.current.start()
        }
      } catch {}
    }, delay)
  }, [autoRestart, lang])

  // ⬇️ watchdog: si no hay actividad por ~10s, reiniciamos suave
  const scheduleKeepAlive = useCallback(() => {
    if (keepAliveTimer.current) window.clearTimeout(keepAliveTimer.current)
    keepAliveTimer.current = window.setTimeout(() => {
      if (!isListening || !recogRef.current) return
      const now = Date.now()
      const idleFor = now - (lastActivityRef.current || 0)
      // 10s sin actividad y seguimos “escuchando” => reinicio silencioso
      if (idleFor > 10_000) {
        softRestart(150)
        return
      }
      // Refrescar cada 55s para evitar timeouts internos del servicio
      try { recogRef.current.stop() } catch {}
    }, 55_000)
  }, [isListening, softRestart])

  const ensureMicPermission = useCallback(async () => {
    try {
      // Primero pedir permiso
      await navigator.mediaDevices.getUserMedia({ audio: true })
      // Validar que exista al menos 1 dispositivo de entrada
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasMic = devices.some(d => d.kind === "audioinput")
      if (!hasMic) {
        setErrorMsg("No se detectó micrófono. Verifica tu dispositivo.")
        return false
      }
      return true
    } catch {
      setErrorMsg("No se pudo acceder al micrófono. Revisa permisos del navegador/SO.")
      return false
    }
  }, [])

  const start = useCallback(async () => {
    if (!Recognition) {
      setErrorMsg(
        typeof window !== "undefined" && window.isSecureContext
          ? "El reconocimiento de voz no es compatible con tu navegador (prueba Chrome/Edge)."
          : "Necesitas ejecutar en HTTPS o localhost para usar el micrófono."
      )
      return
    }
    if (!navigator.onLine) {
      setErrorMsg("Estás sin conexión. Conéctate a Internet para iniciar el reconocimiento.")
      return
    }
    if (startingRef.current || isListening) return

    setErrorMsg(null)
    setConfidence(null)
    clearRetry()

    const ok = await ensureMicPermission()
    if (!ok) return

    try {
      startingRef.current = true
      if (recogRef.current) recogRef.current.lang = lang
      lastActivityRef.current = Date.now()
      recogRef.current!.start()
    } catch (e: any) {
      const msg = e?.name === "InvalidStateError"
        ? "El reconocimiento ya está en curso."
        : e?.message ?? "No se pudo iniciar el reconocimiento."
      setErrorMsg(msg)
      startingRef.current = false
    }
  }, [Recognition, isListening, lang, clearRetry, ensureMicPermission])

  const stop = useCallback(() => {
    userStoppedRef.current = true
    clearRetry()
    if (keepAliveTimer.current) window.clearTimeout(keepAliveTimer.current)
    try { recogRef.current?.stop() } catch {}
    setIsListening(false)
    startingRef.current = false
  }, [clearRetry])

  const clear = useCallback(() => {
    setFinalText("")
    setInterim("")
    setConfidence(null)
    onFinalText?.("")
    onInterimText?.("")
  }, [onFinalText, onInterimText])

  useEffect(() => {
    const isSecure =
      typeof window !== "undefined" &&
      (window.isSecureContext || window.location.hostname === "localhost")
    setSupported(Boolean(Recognition) && isSecure)

    if (!Recognition) return

    const recog = new Recognition()
    recogRef.current = recog
    recog.continuous = true
    recog.interimResults = true
    recog.maxAlternatives = 1
    recog.lang = lang

    recog.onstart = () => {
      userStoppedRef.current = false
      setIsListening(true)
      setErrorMsg(null)
      lastActivityRef.current = Date.now()
      scheduleKeepAlive()
    }

    recog.onerror = (evt: any) => {
      const err = (evt && (evt.error || evt.name || evt.message)) || "unknown"

      // ⚠️ “no-speech” => silencio. No lo tratamos como error fatal ni lo mostramos.
      if (err === "no-speech") {
        // actualizar última actividad para no entrar en bucle
        lastActivityRef.current = Date.now()
        // reintento discreto si el usuario no detuvo manualmente
        if (!userStoppedRef.current) softRestart(120)
        return
      }

      // Mensaje de usuario para otros casos
      let msg =
        err === "not-allowed" ? "Permiso de micrófono denegado. Revisa permisos del sitio."
        : err === "service-not-allowed" ? "El servicio de voz está bloqueado por políticas del navegador."
        : err === "audio-capture" ? "No se detectó micrófono. Verifica tu dispositivo."
        : err === "aborted" ? "" // no mostrarlo; ocurre al refrescar keep-alive
        : err === "network" ? "Fallo de red en el servicio de reconocimiento."
        : err === "bad-grammar" ? "Problema con la gramática proporcionada."
        : err === "language-not-supported" ? "Idioma no soportado por este navegador."
        : typeof evt?.message === "string" ? evt.message
        : "Ocurrió un error en el reconocimiento de voz."

      // Solo loggear “errores reales” en desarrollo
      if (process.env.NODE_ENV === "development" && err !== "aborted") {
        // Evita que Next pinte el digest como ERROR en casos esperables
        // eslint-disable-next-line no-console
        console.warn("Speech warn:", { error: evt?.error, name: evt?.name, message: evt?.message })
      }

      if (err === "network") {
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          setErrorMsg("Estás sin conexión. Reconéctate y vuelve a iniciar.")
          startingRef.current = false
          try { recog.stop() } catch {}
          return
        }
        const attempt = retryRef.current.count
        if (attempt < 4) {
          const delay = Math.pow(2, attempt) * 1000
          retryRef.current.count++
          retryRef.current.timer = window.setTimeout(() => {
            if (!recogRef.current) return
            try {
              recogRef.current.lang = lang
              startingRef.current = true
              recogRef.current.start()
            } catch {}
          }, delay)
          setErrorMsg(`Fallo de red. Reintentando (${attempt + 1}/4)…`)
          return
        } else {
          setErrorMsg("Fallo de red persistente. Verifica VPN/proxy/firewall o usa otra red.")
        }
      } else {
        // mostrar mensaje solo si hay algo relevante
        if (msg) setErrorMsg(msg)
      }

      try { recog.stop() } catch {}
      startingRef.current = false
      if (keepAliveTimer.current) window.clearTimeout(keepAliveTimer.current)
    }

    recog.onend = () => {
      setIsListening(false)
      startingRef.current = false
      if (keepAliveTimer.current) window.clearTimeout(keepAliveTimer.current)

      if (userStoppedRef.current) {
        userStoppedRef.current = false
        return
      }

      // Reintento automático tras onend si no venimos de error visible ni de stop del usuario
      if (autoRestart && retryRef.current.count === 0 && errorMsg === null) {
        try {
          if (recogRef.current) {
            recogRef.current.lang = lang
            startingRef.current = true
            recogRef.current.start()
          }
        } catch {}
      }
    }

    recog.onresult = (evt: any) => {
      lastActivityRef.current = Date.now() // ⬅️ hubo actividad
      let interimText = ""
      let finalParts: string[] = []
      let lastConfidence: number | null = null

      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const res = evt.results[i]
        const transcript = res[0].transcript
        if (res.isFinal) {
          finalParts.push(transcript)
          lastConfidence = res[0].confidence
        } else {
          interimText += transcript
        }
      }

      if (finalParts.length) {
        setFinalText(prev => {
          const next = prev ? prev + " " + finalParts.join(" ") : finalParts.join(" ")
          onFinalText?.(next)
          return next
        })
        if (lastConfidence !== null) setConfidence(lastConfidence)
      }

      setInterim(interimText)
      onInterimText?.(interimText)

      scheduleKeepAlive()
      clearRetry()
    }

    const handleVisibility = () => {
      if (document.hidden) {
        try { recog.stop() } catch {}
      }
    }
    const goOnline = () => setErrorMsg(null)

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("online", goOnline)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("online", goOnline)
      if (keepAliveTimer.current) window.clearTimeout(keepAliveTimer.current)
      clearRetry()
      try { recog.stop() } catch {}
      recogRef.current = null
      startingRef.current = false
      userStoppedRef.current = false
    }
  }, [Recognition, lang, onFinalText, onInterimText, errorMsg, autoRestart, clearRetry, scheduleKeepAlive, softRestart])

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
  }
}