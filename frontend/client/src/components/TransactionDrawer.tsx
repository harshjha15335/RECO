import { useEffect, useState } from "react";
import { CalendarDays, Check, Copy, CreditCard, ReceiptText, X } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { Transaction } from "@/lib/finance-data";

/**
 * Precision Ledger design system: the drawer surfaces one clear record at a
 * time, using quiet panel depth and chartreuse only for confirmed signals.
 */

export function TransactionDrawer({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const [markedForReview, setMarkedForReview] = useState(false);
  const isIncome = transaction?.amount.startsWith("+");

  useEffect(() => setMarkedForReview(false), [transaction?.id]);
  if (!transaction) return null;
  const Icon = transaction.icon;

  const copyReference = () => {
    void navigator.clipboard?.writeText(transaction.reference);
    toast("Reference copied", { description: transaction.reference });
  };

  return <Drawer open onOpenChange={(open) => { if (!open) onClose(); }} direction="right">
    <DrawerContent className="transaction-drawer">
      <DrawerHeader className="transaction-drawer-header"><div><p className="drawer-eyebrow">Transaction detail</p><DrawerTitle className="drawer-title">Receipt and activity</DrawerTitle><DrawerDescription className="drawer-description">A complete record of this FinFlex ledger entry.</DrawerDescription></div><DrawerClose asChild><button className="drawer-close" type="button" aria-label="Close transaction details"><X size={17} /></button></DrawerClose></DrawerHeader>
      <div className="transaction-drawer-body">
        <div className="drawer-transaction-hero"><span className="drawer-merchant-icon"><Icon size={22} /></span><p className="drawer-merchant-name">{transaction.name}</p><p className={`drawer-amount mono ${isIncome ? "credit" : ""}`}>{transaction.amount}</p><span className={`drawer-status ${isIncome ? "is-income" : ""}`}><Check size={12} /> Completed</span></div>
        <dl className="detail-list"><div className="detail-row"><dt><CalendarDays size={14} /> Date</dt><dd>{transaction.date}</dd></div><div className="detail-row"><dt><CreditCard size={14} /> Paid with</dt><dd>{transaction.account}</dd></div><div className="detail-row"><dt><ReceiptText size={14} /> Category</dt><dd>{transaction.category}</dd></div><div className="detail-row detail-row-reference"><dt><Copy size={14} /> Reference</dt><dd><span className="mono">{transaction.reference}</span><button type="button" aria-label="Copy transaction reference" onClick={copyReference}><Copy size={13} /></button></dd></div></dl>
        <section className="drawer-note"><p>Note</p><span>{transaction.note}</span></section><section className="drawer-counterparty"><p>Merchant / counterparty</p><span>{transaction.counterparty}</span></section>
      </div>
      <div className="transaction-drawer-footer"><button className="drawer-secondary-action" type="button" onClick={() => toast("Support request", { description: "A FinFlex support specialist will review this with you." })}>Need help?</button><button className={`drawer-primary-action ${markedForReview ? "is-complete" : ""}`} type="button" onClick={() => { setMarkedForReview(true); toast(markedForReview ? "Already marked" : "Marked for review", { description: "This local ledger record is now flagged." }); }}>{markedForReview ? "Marked for review" : "Mark for review"}</button></div>
    </DrawerContent>
  </Drawer>;
}
