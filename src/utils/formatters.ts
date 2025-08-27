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

export const formatPrice = (price: number | null | undefined) => {
  if (typeof price !== "number") return "—";
  return `S/. ${price.toFixed(2)}`;
};