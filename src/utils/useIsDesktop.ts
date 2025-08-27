// utils/useIsDesktop.ts
"use client"
import { useEffect, useState } from "react"

export function useIsDesktop(minWidth = 768) {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`)
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [minWidth])
  return isDesktop
}