export const paymentMethods = [
  { id: "yape_demo", label: "Yape", kind: "wallet" },
  { id: "plin_demo", label: "Plin", kind: "wallet" },
  { id: "transfer_demo", label: "Transferencia", kind: "bank" },
  { id: "card_demo", label: "Tarjeta", kind: "card" },
] as const;

export const paymentBanks = [
  { id: "bcp_demo", label: "BCP" },
  { id: "interbank_demo", label: "Interbank" },
  { id: "bbva_demo", label: "BBVA" },
  { id: "scotiabank_demo", label: "Scotiabank" },
] as const;

export function paymentMethodLabel(id: string) {
  const bank = paymentBanks.find((item) => item.id === id);
  if (bank) return `Transferencia · ${bank.label}`;
  return paymentMethods.find((item) => item.id === id)?.label ?? "Pago";
}
