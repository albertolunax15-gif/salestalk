interface StatusPillProps {
  status: string;
}

export const StatusPill = ({ status }: StatusPillProps) => {
  const s = (status ?? "").toLowerCase();
  const isActive = s === "active";

  const label = isActive
    ? "Activo"
    : s === "inactive"
    ? "Inactivo"
    : s
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase()) || "—";

  const base = "inline-flex px-2 py-1 rounded text-xs font-medium";
  return (
    <span className={`${base} ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
      {label}
    </span>
  );
};