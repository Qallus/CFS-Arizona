import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHECKS_FILE = path.join(DATA_DIR, 'checks.json');
const BANK_ACCOUNTS_FILE = path.join(DATA_DIR, 'bank-accounts.json');

interface Check {
  id: string;
  checkNumber: number;
  payee: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  amount: number;
  amountText: string;
  memo: string;
  date: string;
  signature?: string;
  status: 'draft' | 'printed' | 'sent' | 'cashed' | 'voided';
  deliveryMethod?: 'download' | 'email' | 'sms';
  deliveredTo?: string;
  deliveredAt?: string;
  cashedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  projectId?: string;
  invoiceId?: string;
  contactId?: string;
  createdAt: string;
  updatedAt: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  nextCheckNumber: number;
  isDefault: boolean;
  logo?: string;
  createdAt: string;
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readChecks(): Promise<Check[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(CHECKS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeChecks(checks: Check[]) {
  await ensureDataDir();
  await fs.writeFile(CHECKS_FILE, JSON.stringify(checks, null, 2));
}

async function readBankAccounts(): Promise<BankAccount[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(BANK_ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeBankAccounts(accounts: BankAccount[]) {
  await ensureDataDir();
  await fs.writeFile(BANK_ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

// Convert number to words for check amount
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);
  
  function convertHundreds(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
    }
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
  }
  
  function convert(n: number): string {
    if (n === 0) return 'Zero';
    if (n < 1000) return convertHundreds(n);
    if (n < 1000000) {
      return convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '');
    }
    if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
    }
    return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convert(n % 1000000000) : '');
  }
  
  const dollarsText = convert(dollars);
  const centsText = cents.toString().padStart(2, '0');
  
  return `${dollarsText} and ${centsText}/100`;
}

// GET - List checks or bank accounts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'checks';
  
  if (type === 'bank-accounts') {
    const accounts = await readBankAccounts();
    return NextResponse.json({ accounts });
  }
  
  const checks = await readChecks();
  const status = searchParams.get('status');
  
  let filtered = checks;
  if (status) {
    filtered = checks.filter(c => c.status === status);
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Calculate stats
  const stats = {
    total: checks.length,
    totalAmount: checks.filter(c => c.status !== 'voided').reduce((sum, c) => sum + c.amount, 0),
    drafted: checks.filter(c => c.status === 'draft').length,
    sent: checks.filter(c => c.status === 'sent').length,
    cashed: checks.filter(c => c.status === 'cashed').length,
    voided: checks.filter(c => c.status === 'voided').length,
  };
  
  return NextResponse.json({ checks: filtered, stats });
}

// POST - Create check or bank account
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type } = body;
  
  if (type === 'bank-account') {
    const accounts = await readBankAccounts();
    
    // If this is the first account or marked as default, update others
    if (body.isDefault || accounts.length === 0) {
      accounts.forEach(a => a.isDefault = false);
    }
    
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      bankName: body.bankName,
      accountName: body.accountName,
      routingNumber: body.routingNumber,
      accountNumber: body.accountNumber,
      accountType: body.accountType || 'checking',
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      nextCheckNumber: body.nextCheckNumber || 1001,
      isDefault: body.isDefault || accounts.length === 0,
      logo: body.logo,
      createdAt: new Date().toISOString(),
    };
    
    accounts.push(newAccount);
    await writeBankAccounts(accounts);
    
    return NextResponse.json({ account: newAccount });
  }
  
  // Create check
  const checks = await readChecks();
  const accounts = await readBankAccounts();
  
  // Get default bank account
  const defaultAccount = accounts.find(a => a.isDefault);
  if (!defaultAccount) {
    return NextResponse.json({ error: 'No bank account configured. Please add a bank account first.' }, { status: 400 });
  }
  
  const checkNumber = defaultAccount.nextCheckNumber;
  
  const newCheck: Check = {
    id: crypto.randomUUID(),
    checkNumber,
    payee: {
      name: body.payeeName,
      address: body.payeeAddress,
      city: body.payeeCity,
      state: body.payeeState,
      zip: body.payeeZip,
    },
    amount: body.amount,
    amountText: numberToWords(body.amount),
    memo: body.memo || '',
    date: body.date || new Date().toISOString().split('T')[0],
    signature: body.signature || '',
    status: 'draft',
    projectId: body.projectId,
    invoiceId: body.invoiceId,
    contactId: body.contactId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  checks.push(newCheck);
  await writeChecks(checks);
  
  // Increment check number
  defaultAccount.nextCheckNumber = checkNumber + 1;
  await writeBankAccounts(accounts);
  
  return NextResponse.json({ check: newCheck });
}

// PUT - Update check or bank account
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, type } = body;
  
  if (type === 'bank-account') {
    const accounts = await readBankAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 });
    }
    
    // Handle default toggle
    if (body.isDefault) {
      accounts.forEach(a => a.isDefault = false);
    }
    
    accounts[index] = { ...accounts[index], ...body };
    await writeBankAccounts(accounts);
    
    return NextResponse.json({ account: accounts[index] });
  }
  
  // Update check
  const checks = await readChecks();
  const index = checks.findIndex(c => c.id === id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Check not found' }, { status: 404 });
  }
  
  const check = checks[index];
  
  // Handle status changes
  if (body.status === 'sent' && check.status !== 'sent') {
    body.deliveredAt = new Date().toISOString();
  }
  if (body.status === 'cashed' && check.status !== 'cashed') {
    body.cashedAt = new Date().toISOString();
  }
  if (body.status === 'voided' && check.status !== 'voided') {
    body.voidedAt = new Date().toISOString();
  }
  
  // Update amount text if amount changed
  if (body.amount && body.amount !== check.amount) {
    body.amountText = numberToWords(body.amount);
  }
  
  checks[index] = {
    ...check,
    ...body,
    payee: body.payeeName ? {
      name: body.payeeName,
      address: body.payeeAddress,
      city: body.payeeCity,
      state: body.payeeState,
      zip: body.payeeZip,
    } : check.payee,
    updatedAt: new Date().toISOString(),
  };
  
  await writeChecks(checks);
  
  return NextResponse.json({ check: checks[index] });
}

// DELETE - Delete check or bank account
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  if (type === 'bank-account') {
    const accounts = await readBankAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    await writeBankAccounts(filtered);
    return NextResponse.json({ success: true });
  }
  
  const checks = await readChecks();
  const filtered = checks.filter(c => c.id !== id);
  await writeChecks(filtered);
  
  return NextResponse.json({ success: true });
}
