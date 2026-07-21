import { LedgerClient } from '@/components/ledger/LedgerClient';

export const metadata = { title: 'Bill Pay & Ledger' };
export const dynamic = 'force-dynamic';

export default function BillPayPage() {
  return <LedgerClient />;
}
