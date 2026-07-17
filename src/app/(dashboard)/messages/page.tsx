import { MessagesClient } from '@/components/crm/MessagesClient';

export const metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  return <MessagesClient />;
}
