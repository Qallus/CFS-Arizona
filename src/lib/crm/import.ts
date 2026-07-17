/**
 * Bulk contact import. Each imported row becomes a Contact + an Awareness
 * Opportunity, so imported people enter the funnel like any other contact.
 *
 * server-only.
 */
import type { RbacUser } from '@/lib/rbac';
import { createContact, type ContactInput } from './contacts';
import { createOpportunity } from './opportunities';
import { assertContactCreate } from './access';

export interface ImportResult {
  created: number;
  failed: number;
  errors: { index: number; message: string }[];
}

export async function bulkCreateContacts(user: RbacUser, rows: ContactInput[]): Promise<ImportResult> {
  assertContactCreate(user); // fail fast before touching the DB
  let created = 0;
  let failed = 0;
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Skip fully-empty rows silently.
    if (!row.firstName?.trim() && !row.lastName?.trim() && !row.companyName?.trim() && !row.email?.trim()) {
      continue;
    }
    try {
      const contact = await createContact(user, row);
      await createOpportunity(user, { contactId: contact.id });
      created++;
    } catch (e) {
      failed++;
      errors.push({ index: i, message: (e as Error).message });
    }
  }
  return { created, failed, errors };
}
