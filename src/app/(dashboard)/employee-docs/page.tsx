import { EmployeeDocsClient } from '@/components/hr/EmployeeDocsClient';

export const metadata = { title: 'Employee Documents' };
export const dynamic = 'force-dynamic';

export default function EmployeeDocsPage() {
  return <EmployeeDocsClient />;
}
