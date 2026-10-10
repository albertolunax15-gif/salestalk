const PEN = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const PEN_COMPACT = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  notation: "compact",
  maximumFractionDigits: 1,
})

const INT = new Intl.NumberFormat("es-PE")

export const formatDate = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** "12 oct 2026" */
export const formatShortDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
};

/** "14:05" */
export const formatTime = (value: string | null | undefined) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", hour12: false });
};

export const formatPrice = (price: number | null | undefined) => {
  if (typeof price !== "number" || Number.isNaN(price)) return "—";
  return PEN.format(price);
};

export const formatCurrencyCompact = (value: number) => PEN_COMPACT.format(value);

export const formatNumber = (value: number) => INT.format(value);
