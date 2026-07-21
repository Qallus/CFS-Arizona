import { ReferralsClient } from '@/components/referrals/ReferralsClient';

export const metadata = { title: 'Referrals' };
export const dynamic = 'force-dynamic';

export default function ReferralsPage() {
  return <ReferralsClient />;
}
