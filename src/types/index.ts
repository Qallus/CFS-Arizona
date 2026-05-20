// Shared types for the dashboard

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  budget: number | null;
  progress: number;
  leadIds: string[];
  contactIds: string[];
  team: any[];
  tasks: Task[];
  activityLog: ActivityLog[];
  notifications: Notification[];
  tags: string[];
  color: string;
  createdAt: string;
  updatedAt: string;
  // Client portal
  clientAccessToken?: string;
  clientAccessEnabled?: boolean;
  // Extended fields
  sitePhotos?: SitePhoto[];
  subTasks?: SubTask[];
  location?: ProjectLocation;
  estimatedHours?: number;
  actualHours?: number;
  hourlyRate?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  projectType?: string;
  milestones?: Milestone[];
  notes?: string;
}

export interface SitePhoto {
  id: string;
  url: string;
  caption?: string;
  takenAt?: string;
  uploadedAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
  createdAt: string;
}

export interface ProjectLocation {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string[];
  dueDate: string | null;
  completedAt: string | null;
  order: number;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  message: string;
  userName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'sms' | 'email' | 'call';
  recipient: string;
  recipientName: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  location: string;
  email: string | null;
  phone: string | null;
  companyPhone: string | null;
  companyEmail: string | null;
  linkedIn: string | null;
  website: string | null;
  netWorthIndicator: string;
  lifeEvent: string;
  lifeEventType: string;
  notes: string;
  source: string;
  tags: string[];
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  priority: 'high' | 'medium' | 'low';
  fluentCrmId?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  createdAt: string;
}

// Pipeline/Deals
export interface Deal {
  id: string;
  name: string;
  description: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  currency: string;
  probability: number; // 0-100
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  leadId: string | null;
  contactId: string | null;
  projectId: string | null;
  products: DealProduct[];
  notes: string;
  tags: string[];
  assignedTo: string | null;
  source: string;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

// Invoicing
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  contactId: string | null;
  dealId: string | null;
  projectId: string | null;
  
  // Billing details
  billTo: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  
  // Line items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Dates
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  
  // Payment
  stripeInvoiceId: string | null;
  stripePaymentIntentId: string | null;
  paymentMethod: string | null;
  paymentUrl: string | null;
  
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// Analytics
export interface AnalyticsData {
  leadConversion: {
    total: number;
    converted: number;
    conversionRate: number;
    byStage: { stage: string; count: number }[];
    trend: { date: string; converted: number; total: number }[];
  };
  communicationVolume: {
    calls: number;
    sms: number;
    emails: number;
    byDay: { date: string; calls: number; sms: number; emails: number }[];
  };
  projectVelocity: {
    active: number;
    completed: number;
    avgDaysToComplete: number;
    byStatus: { status: string; count: number }[];
    completedByMonth: { month: string; count: number }[];
  };
  revenue: {
    totalPipeline: number;
    weightedPipeline: number;
    closedWon: number;
    closedLost: number;
    byMonth: { month: string; won: number; lost: number }[];
    byStage: { stage: string; value: number; count: number }[];
  };
}

// Checks
export interface Check {
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
  amountText: string; // Written amount (e.g., "One Thousand and 00/100")
  memo: string;
  date: string;
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

export interface BankAccount {
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
  createdAt: string;
}
