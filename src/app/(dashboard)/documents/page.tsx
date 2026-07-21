import { DocumentsClient } from '@/components/documents/DocumentsClient';

export const metadata = { title: 'Documents' };
export const dynamic = 'force-dynamic';

export default function DocumentsPage() {
  return <DocumentsClient />;
}
