import { ClientsClient } from '@/components/clients/ClientsClient';

export const metadata = { title: 'Clients & Wards' };
export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  return <ClientsClient />;
}
