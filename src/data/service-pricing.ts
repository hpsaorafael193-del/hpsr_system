export const servicePricing = {
  specialistConsultation: 2480000,
  psychologyConsultation: 2480000,
} as const;

export function formatServicePrice(valueInCents: number) {
  return (valueInCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}
