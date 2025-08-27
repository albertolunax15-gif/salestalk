"use client"

import { ReactNode, useEffect } from "react"

type BaseModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BaseModal({ open, title, onClose, children }: BaseModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}