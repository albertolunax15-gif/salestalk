import { Badge } from "@/components/ui/badge";

interface StatusPillProps {
  status: string;
}

export const StatusPill = ({ status }: StatusPillProps) => {
  const s = (status ?? "").toLowerCase();

  if (s === "active") return <Badge variant="success" dot>Activo</Badge>;
  if (s === "inactive") return <Badge variant="secondary" dot>Inactivo</Badge>;

  const label = s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) || "—";
  return <Badge variant="outline">{label}</Badge>;
};
