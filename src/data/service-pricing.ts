export const servicePricing = {
  specialistConsultation: 700000,
  psychologyConsultation: 500000,
} as const;

export function formatServicePrice(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
