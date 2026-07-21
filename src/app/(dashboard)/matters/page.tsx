import { MattersClient } from '@/components/matters/MattersClient';

export const metadata = { title: 'Matters' };
export const dynamic = 'force-dynamic';

export default function MattersPage() {
  return <MattersClient />;
}
