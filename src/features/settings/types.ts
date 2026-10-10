export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD"] as const;
export type ProfileState = { error?: string; saved?: boolean; theme?: string };