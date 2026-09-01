import {
  Coffee,
  CreditCard,
  ReceiptText,
  Send,
  ShoppingBag,
  Smartphone,
  Wallet,
} from "lucide-react";

export type TransactionKind = "Income" | "Spending";

export type Transaction = {
  id: string;
  name: string;
  detail: string;
  amount: string;
  type: TransactionKind;
  icon: typeof Wallet;
  category: string;
  account: string;
  date: string;
  reference: string;
  counterparty: string;
  note: string;
};

export const TRANSACTIONS: Transaction[] = [
  { id: "paypal-aug-08", name: "PayPal", detail: "Today · 11:55 AM", amount: "−$12.89", type: "Spending", icon: Wallet, category: "Subscriptions", account: "FinFlex Visa •••• 8967", date: "August 8, 2026 · 11:55 AM", reference: "PP-8CJ6A5Q3", counterparty: "PayPal, Inc.", note: "Monthly workspace subscription" },
  { id: "apple-aug-08", name: "Apple", detail: "Today · 10:03 AM", amount: "−$13.90", type: "Spending", icon: Smartphone, category: "Digital services", account: "FinFlex Visa •••• 8967", date: "August 8, 2026 · 10:03 AM", reference: "APL-K5D7F2A1", counterparty: "Apple Services", note: "iCloud+ and app services" },
  { id: "adobe-aug-07", name: "Adobe Creative Cloud", detail: "Yesterday · 5:21 PM", amount: "−$22.99", type: "Spending", icon: ReceiptText, category: "Software", account: "FinFlex Visa •••• 8967", date: "August 7, 2026 · 5:21 PM", reference: "ADB-P4C9M8R2", counterparty: "Adobe Systems", note: "Creative Cloud individual plan" },
  { id: "freelance-aug-06", name: "Freelance deposit", detail: "Aug 6 · 9:00 AM", amount: "+$1,240.00", type: "Income", icon: Send, category: "Freelance work", account: "FinFlex Checking •••• 2048", date: "August 6, 2026 · 9:00 AM", reference: "DEP-W2X9K6L4", counterparty: "Northline Studio", note: "Project deposit received" },
  { id: "morrow-aug-05", name: "Morrow Market", detail: "Aug 5 · 6:18 PM", amount: "−$46.27", type: "Spending", icon: ShoppingBag, category: "Groceries", account: "FinFlex Visa •••• 8967", date: "August 5, 2026 · 6:18 PM", reference: "MKT-H8Q3N7D9", counterparty: "Morrow Market", note: "Weekly groceries" },
  { id: "cafe-aug-04", name: "Café Alto", detail: "Aug 4 · 8:32 AM", amount: "−$6.40", type: "Spending", icon: Coffee, category: "Dining", account: "FinFlex Visa •••• 8967", date: "August 4, 2026 · 8:32 AM", reference: "CAF-V6L2Y5B8", counterparty: "Café Alto", note: "Morning coffee" },
];
