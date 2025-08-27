import { API_BASE_URL } from "@/constants/auth";

const API = API_BASE_URL;

export async function nlpInterpret(opts: {
  text: string;
  token: string;
  candidateProducts?: string[];
}) {
  const res = await fetch(`${API}/nlp/interpret`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: opts.text,
      candidate_products: opts.candidateProducts,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    intent: "crear_venta" | "listar_ventas" | "ayuda";
    confidence: number;
    entities: Record<string, any>;
    notes: string[];
    command?: { action: string; data: Record<string, any> };
    needs_confirmation?: boolean;
    candidates?: Array<{ id: string; name: string; score?: number }>;
  }>;
}

export async function nlpConfirmSale(opts: {
  token: string;
  productId: string;
  quantity: number;
  paymentMethod: "Efectivo" | "Tarjeta" | "Yape" | "Plin" | "Transferencia";
  date?: string; // opcional ISO
}) {
  const res = await fetch(`${API}/nlp/confirm_sale`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: opts.productId,
      quantity: opts.quantity,
      payment_method: opts.paymentMethod,
      date: opts.date ?? null,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    id: string;
    product_id: string;
    quantity: number;
    payment_method: string;
    date: string;
    created_at: string;
  }>;
}

export async function nlpTTS(opts: { text: string; token: string }) {
  const res = await fetch(`${API}/nlp/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: opts.text }),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function listProducts(opts: { token: string; limit?: number }) {
  const res = await fetch(`${API}/products?limit=${opts.limit ?? 100}`, {
    headers: { Authorization: `Bearer ${opts.token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  const items = (await res.json()) as Array<{ id: string; name: string }>;
  return items.map((p) => p.name);
}