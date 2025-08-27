"use client"

type Props = {
  onCreateClick: () => void
  onRefreshClick: () => void
  searching?: boolean
}

export function ProductsActionsBar({ onCreateClick, onRefreshClick, searching }: Props) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
      <div className="flex gap-2">
        <button
          onClick={onRefreshClick}
          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Refrescar
        </button>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo producto
        </button>
      </div>
    </div>
  )
}