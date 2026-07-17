import { MileageClient } from '@/components/hr/MileageClient';

export const metadata = { title: 'Mileage Log' };
export const dynamic = 'force-dynamic';

export default function MileagePage() {
  return <MileageClient />;
}
