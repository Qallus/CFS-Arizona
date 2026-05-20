import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';

const DATA_DIR = path.join(process.cwd(), 'data');
const CHECKS_FILE = path.join(DATA_DIR, 'checks.json');
const BANK_ACCOUNTS_FILE = path.join(DATA_DIR, 'bank-accounts.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

async function readFile(filePath: string) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get('id');
  
  if (!checkId) {
    return NextResponse.json({ error: 'Check ID required' }, { status: 400 });
  }
  
  const checks = await readFile(CHECKS_FILE) || [];
  const check = checks.find((c: any) => c.id === checkId);
  
  if (!check) {
    return NextResponse.json({ error: 'Check not found' }, { status: 404 });
  }
  
  const accounts = await readFile(BANK_ACCOUNTS_FILE) || [];
  const bankAccount = accounts.find((a: any) => a.isDefault);
  
  if (!bankAccount) {
    return NextResponse.json({ error: 'No bank account configured' }, { status: 400 });
  }
  
  const settings = await readFile(SETTINGS_FILE) || {};
  const businessName = settings.businessName || 'Your Business Name';
  const businessAddress = settings.businessAddress || '123 Business St';
  const businessCity = settings.businessCity || 'City';
  const businessState = settings.businessState || 'ST';
  const businessZip = settings.businessZip || '00000';
  
  // Create PDF - Standard check size is 8.5" x 3.5" but we'll do letter size with check at top
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [8.5, 3.67], // Standard personal check size
  });
  
  const width = 8.5;
  const height = 3.67;
  
  // Colors
  const darkBlue = [0, 51, 102];
  const lightGray = [200, 200, 200];
  
  // Background styling - light security pattern
  doc.setFillColor(252, 252, 252);
  doc.rect(0, 0, width, height, 'F');
  
  // Top left - Logo and Business info
  let textStartX = 0.3;
  
  // Add logo if available
  if (bankAccount.logo) {
    try {
      // For logo, we'd need to fetch and embed - simplified for now
      // Logo would be added at 0.3, 0.2 with appropriate size
      textStartX = 0.3; // Adjust if logo is wide
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }
  
  doc.setFontSize(10);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, textStartX, 0.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(businessAddress, textStartX, 0.55);
  doc.text(`${businessCity}, ${businessState} ${businessZip}`, textStartX, 0.7);
  
  // Top right - Check number and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${check.checkNumber}`, width - 0.3, 0.4, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE:', width - 1.8, 0.7);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(check.date), width - 0.3, 0.7, { align: 'right' });
  
  // Draw date line
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.01);
  doc.line(width - 1.5, 0.75, width - 0.3, 0.75);
  
  // PAY TO THE ORDER OF
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.text('PAY TO THE', 0.3, 1.1);
  doc.text('ORDER OF', 0.3, 1.25);
  
  // Payee name
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(check.payee.name, 0.9, 1.2);
  
  // Payee line
  doc.line(0.9, 1.25, width - 1.8, 1.25);
  
  // Amount box
  doc.setDrawColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.setLineWidth(0.02);
  doc.rect(width - 1.6, 0.95, 1.3, 0.4);
  
  // Dollar sign and amount
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('$', width - 1.55, 1.2);
  doc.setFontSize(14);
  doc.text(formatAmount(check.amount), width - 0.35, 1.22, { align: 'right' });
  
  // Written amount
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const amountLine = check.amountText + ' DOLLARS';
  doc.text(amountLine, 0.3, 1.6);
  
  // Amount line with "DOLLARS" at end
  doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.setLineWidth(0.01);
  doc.line(0.3, 1.65, width - 0.3, 1.65);
  
  // Bank info
  doc.setFontSize(8);
  doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
  doc.text(bankAccount.bankName, 0.3, 2.0);
  if (bankAccount.address) {
    doc.text(`${bankAccount.address}`, 0.3, 2.15);
  }
  
  // Memo line
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('MEMO', 0.3, 2.55);
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(check.memo || '', 0.7, 2.55);
  doc.line(0.6, 2.6, 3.5, 2.6);
  
  // Signature line
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('SIGNATURE', width - 2.3, 2.55);
  doc.line(width - 3.2, 2.6, width - 0.3, 2.6);
  
  // Add signature image if available
  if (check.signature) {
    try {
      // Signature would be added here - requires image processing
      // For now, the line remains for manual signature
    } catch (e) {
      console.error('Error adding signature:', e);
    }
  }
  
  // MICR line (bottom of check) - simulated
  // Real MICR would use special E-13B font, but we'll simulate for visual
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const routingNum = bankAccount.routingNumber.padStart(9, '0');
  const accountNum = bankAccount.accountNumber;
  const checkNum = check.checkNumber.toString().padStart(4, '0');
  
  // MICR format: ⑆ROUTING⑆ ACCOUNT⑈ CHECK⑆
  // Using symbols that look similar
  const micrLine = `⑆${routingNum}⑆ ${accountNum}⑈ ${checkNum}`;
  doc.text(micrLine, 0.8, 3.35);
  
  // Add a light "VOID" watermark if check is voided
  if (check.status === 'voided') {
    doc.setFontSize(72);
    doc.setTextColor(255, 0, 0);
    doc.setFont('helvetica', 'bold');
    // Rotate text
    doc.text('VOID', width / 2, height / 2, {
      align: 'center',
      angle: 30,
    });
  }
  
  // Generate PDF buffer
  const pdfBuffer = doc.output('arraybuffer');
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="check-${check.checkNumber}.pdf"`,
    },
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
