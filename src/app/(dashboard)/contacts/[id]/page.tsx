import { ContactDetailClient } from '@/components/crm/ContactDetailClient';

export const metadata = { title: 'Contact' };
export const dynamic = 'force-dynamic';

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContactDetailClient contactId={id} />;
}
