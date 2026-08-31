export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Наличные', hint: 'Оплата купюрами и монетой', deliveryHint: 'Курьеру при получении' },
  { value: 'terminal', label: 'Терминал', hint: 'Карта на кассе', deliveryHint: 'Картой курьеру' },
  { value: 'qr', label: 'QR-код', hint: 'СБП или перевод по QR', deliveryHint: 'СБП или перевод по QR' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.some((item) => item.value === value)
}

export function paymentLabel(value: string | null | undefined) {
  return PAYMENT_METHODS.find((item) => item.value === value)?.label ?? '—'
}
