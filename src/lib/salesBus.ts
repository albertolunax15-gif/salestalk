export const salesBus = new EventTarget();

export function emitSaleCreated(detail?: any) {
  salesBus.dispatchEvent(new CustomEvent("sale:created", { detail }));
}