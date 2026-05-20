'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  FileText,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Download,
  Eye,
  DollarSign,
  CreditCard,
  Receipt,
  FileCheck,
  Banknote,
  Settings,
  Mail,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SignaturePad from '@/components/SignaturePad';
import type { Invoice } from '@/types';

type TabType = 'invoices' | 'quotes' | 'payments' | 'checks';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-500', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-500/20 text-blue-500', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-purple-500/20 text-purple-500', icon: Eye },
  paid: { label: 'Paid', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'bg-red-500/20 text-red-500', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500/20 text-gray-500', icon: FileText },
  // Quote statuses
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-500', icon: AlertCircle },
  expired: { label: 'Expired', color: 'bg-gray-500/20 text-gray-500', icon: Clock },
  // Payment statuses
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  pending_payment: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  failed: { label: 'Failed', color: 'bg-red-500/20 text-red-500', icon: AlertCircle },
  refunded: { label: 'Refunded', color: 'bg-purple-500/20 text-purple-500', icon: CreditCard },
  // Check statuses
  printed: { label: 'Printed', color: 'bg-blue-500/20 text-blue-500', icon: Download },
  cashed: { label: 'Cashed', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  voided: { label: 'Voided', color: 'bg-red-500/20 text-red-500', icon: XCircle },
};

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [checks, setChecks] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [checkStats, setCheckStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [previewCheck, setPreviewCheck] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        
        const res = await fetch(`/api/invoices?${params}`);
        const data = await res.json();
        setInvoices(data.invoices || []);
        setStats(data.stats || {});
      } else if (activeTab === 'quotes') {
        const res = await fetch('/api/quotes');
        const data = await res.json();
        setQuotes(data.quotes || []);
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/payments');
        const data = await res.json();
        setPayments(data.payments || []);
      } else if (activeTab === 'checks') {
        const params = new URLSearchParams();
        if (statusFilter) params.append('status', statusFilter);
        
        const [checksRes, accountsRes] = await Promise.all([
          fetch(`/api/checks?${params}`),
          fetch('/api/checks?type=bank-accounts'),
        ]);
        const checksData = await checksRes.json();
        const accountsData = await accountsRes.json();
        setChecks(checksData.checks || []);
        setCheckStats(checksData.stats || {});
        setBankAccounts(accountsData.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleSaveInvoice = async (invoiceData: any) => {
    try {
      if (editingItem) {
        await fetch('/api/invoices', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...invoiceData }),
        });
      } else {
        await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceData),
        });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving invoice:', error);
    }
  };

  const handleSaveQuote = async (quoteData: any) => {
    try {
      if (editingItem) {
        await fetch('/api/quotes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...quoteData }),
        });
      } else {
        await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteData),
        });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving quote:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
    try {
      const endpoint = activeTab === 'invoices' ? '/api/invoices' : '/api/quotes';
      await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
    setActiveMenu(null);
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, status: 'paid' }),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
    setActiveMenu(null);
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoice.id, status: 'sent' }),
      });
      fetchData();
      alert('Invoice marked as sent');
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
    setActiveMenu(null);
  };

  const handleConvertToInvoice = async (quote: any) => {
    try {
      // Create invoice from quote
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billTo: quote.billTo,
          items: quote.items,
          notes: quote.notes,
          status: 'draft',
        }),
      });
      // Update quote status
      await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quote.id, status: 'accepted' }),
      });
      setActiveTab('invoices');
      fetchData();
      alert('Quote converted to invoice');
    } catch (error) {
      console.error('Error converting quote:', error);
    }
    setActiveMenu(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusFilters = () => {
    switch (activeTab) {
      case 'invoices':
        return ['draft', 'sent', 'paid', 'overdue'];
      case 'quotes':
        return ['pending', 'accepted', 'declined', 'expired'];
      case 'payments':
        return ['completed', 'pending_payment', 'failed', 'refunded'];
      case 'checks':
        return ['draft', 'printed', 'sent', 'cashed', 'voided'];
      default:
        return [];
    }
  };

  // Check handlers
  const handleSaveCheck = async (checkData: any) => {
    try {
      if (editingItem) {
        await fetch('/api/checks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...checkData }),
        });
      } else {
        await fetch('/api/checks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(checkData),
        });
      }
      setShowModal(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving check:', error);
    }
  };

  const handleSaveBankAccount = async (accountData: any) => {
    try {
      await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'bank-account', ...accountData }),
      });
      setShowBankModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving bank account:', error);
    }
  };

  const handleVoidCheck = async (check: any) => {
    const reason = prompt('Enter void reason:');
    if (!reason) return;
    
    try {
      await fetch('/api/checks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: check.id, status: 'voided', voidReason: reason }),
      });
      fetchData();
    } catch (error) {
      console.error('Error voiding check:', error);
    }
    setActiveMenu(null);
  };

  const handleMarkCashed = async (check: any) => {
    try {
      await fetch('/api/checks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: check.id, status: 'cashed' }),
      });
      fetchData();
    } catch (error) {
      console.error('Error marking check as cashed:', error);
    }
    setActiveMenu(null);
  };

  const handleDownloadCheck = (check: any) => {
    window.open(`/api/checks/pdf?id=${check.id}`, '_blank');
    setActiveMenu(null);
  };

  const handleSendCheck = async (check: any, method: 'email' | 'sms') => {
    const recipient = prompt(`Enter ${method === 'email' ? 'email address' : 'phone number'}:`);
    if (!recipient) return;
    
    try {
      await fetch('/api/checks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: check.id, 
          status: 'sent',
          deliveryMethod: method,
          deliveredTo: recipient,
        }),
      });
      alert(`Check ${method === 'email' ? 'emailed' : 'sent via SMS'} successfully!`);
      fetchData();
    } catch (error) {
      console.error('Error sending check:', error);
    }
    setActiveMenu(null);
  };

  const handleDeleteCheck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this check?')) return;
    
    try {
      await fetch(`/api/checks?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting check:', error);
    }
    setActiveMenu(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
            <p className="text-sm text-muted-foreground">Manage invoices, quotes, and payments</p>
          </div>
          {activeTab !== 'payments' && (
            <div className="flex items-center gap-2">
              {activeTab === 'checks' && (
                <button
                  onClick={() => setShowBankModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Check Settings
                </button>
              )}
              <button
                onClick={() => { setEditingItem(null); setShowModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New {activeTab === 'invoices' ? 'Invoice' : activeTab === 'quotes' ? 'Quote' : 'Check'}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('invoices'); setStatusFilter(''); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'invoices'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <FileText className="w-4 h-4" />
            Invoices
          </button>
          <button
            onClick={() => { setActiveTab('quotes'); setStatusFilter(''); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'quotes'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <FileCheck className="w-4 h-4" />
            Quotes
          </button>
          <button
            onClick={() => { setActiveTab('payments'); setStatusFilter(''); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'payments'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </button>
          <button
            onClick={() => { setActiveTab('checks'); setStatusFilter(''); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'checks'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Banknote className="w-4 h-4" />
            Checks
          </button>
        </div>

        {/* Stats (for invoices) */}
        {activeTab === 'invoices' && stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalRevenue || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Outstanding</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.totalOutstanding || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.overdue || 0}</p>
            </div>
          </div>
        )}

        {/* Stats (for checks) */}
        {activeTab === 'checks' && checkStats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Banknote className="w-4 h-4" />
                <span className="text-sm">Total Checks</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{checkStats.total || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Total Amount</span>
              </div>
              <p className="text-2xl font-bold text-brand">{formatCurrency(checkStats.totalAmount || 0)}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Send className="w-4 h-4" />
                <span className="text-sm">Sent</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">{checkStats.sent || 0}</p>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Cashed</span>
              </div>
              <p className="text-2xl font-bold text-green-500">{checkStats.cashed || 0}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </form>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">All Status</option>
            {getStatusFilters().map((status) => (
              <option key={status} value={status}>
                {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
          </div>
        ) : (
          <>
            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              invoices.length === 0 ? (
                <EmptyState 
                  icon={FileText}
                  title="No invoices found"
                  action={() => { setEditingItem(null); setShowModal(true); }}
                  actionLabel="Create Invoice"
                />
              ) : (
                <DataTable
                  data={invoices}
                  type="invoice"
                  onEdit={(item) => { setEditingItem(item); setShowModal(true); }}
                  onDelete={handleDeleteItem}
                  onAction={(item, action) => {
                    if (action === 'send') handleSendInvoice(item);
                    if (action === 'markPaid') handleMarkPaid(item);
                  }}
                  formatCurrency={formatCurrency}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              )
            )}

            {/* Quotes Tab */}
            {activeTab === 'quotes' && (
              quotes.length === 0 ? (
                <EmptyState 
                  icon={FileCheck}
                  title="No quotes found"
                  action={() => { setEditingItem(null); setShowModal(true); }}
                  actionLabel="Create Quote"
                />
              ) : (
                <DataTable
                  data={quotes}
                  type="quote"
                  onEdit={(item) => { setEditingItem(item); setShowModal(true); }}
                  onDelete={handleDeleteItem}
                  onAction={(item, action) => {
                    if (action === 'convert') handleConvertToInvoice(item);
                  }}
                  formatCurrency={formatCurrency}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              )
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              payments.length === 0 ? (
                <EmptyState 
                  icon={CreditCard}
                  title="No payments recorded"
                  subtitle="Payments will appear here when invoices are paid"
                />
              ) : (
                <DataTable
                  data={payments}
                  type="payment"
                  formatCurrency={formatCurrency}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              )
            )}

            {/* Checks Tab */}
            {activeTab === 'checks' && (
              bankAccounts.length === 0 ? (
                <EmptyState 
                  icon={Banknote}
                  title="No bank account configured"
                  subtitle="Set up your bank account to start creating checks"
                  action={() => setShowBankModal(true)}
                  actionLabel="Add Bank Account"
                />
              ) : checks.length === 0 ? (
                <EmptyState 
                  icon={Banknote}
                  title="No checks created"
                  action={() => { setEditingItem(null); setShowModal(true); }}
                  actionLabel="Create Check"
                />
              ) : (
                <ChecksTable
                  checks={checks}
                  onEdit={(check) => { setEditingItem(check); setShowModal(true); }}
                  onDelete={handleDeleteCheck}
                  onVoid={handleVoidCheck}
                  onMarkCashed={handleMarkCashed}
                  onDownload={handleDownloadCheck}
                  onPreview={(check) => setPreviewCheck(check)}
                  onSend={handleSendCheck}
                  formatCurrency={formatCurrency}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                />
              )
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        activeTab === 'invoices' ? (
          <InvoiceModal
            invoice={editingItem}
            onSave={handleSaveInvoice}
            onClose={() => { setShowModal(false); setEditingItem(null); }}
          />
        ) : activeTab === 'quotes' ? (
          <QuoteModal
            quote={editingItem}
            onSave={handleSaveQuote}
            onClose={() => { setShowModal(false); setEditingItem(null); }}
          />
        ) : activeTab === 'checks' ? (
          <CheckModal
            check={editingItem}
            onSave={handleSaveCheck}
            onClose={() => { setShowModal(false); setEditingItem(null); }}
          />
        ) : null
      )}

      {/* Bank Account Modal */}
      {showBankModal && (
        <BankAccountModal
          accounts={bankAccounts}
          onSave={handleSaveBankAccount}
          onClose={() => setShowBankModal(false)}
        />
      )}

      {/* Check Preview Modal */}
      {previewCheck && (
        <CheckPreviewModal
          check={previewCheck}
          bankAccount={bankAccounts.find((a: any) => a.isDefault)}
          onClose={() => setPreviewCheck(null)}
          onDownload={() => handleDownloadCheck(previewCheck)}
        />
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ 
  icon: Icon, 
  title, 
  subtitle,
  action, 
  actionLabel 
}: { 
  icon: any; 
  title: string; 
  subtitle?: string;
  action?: () => void; 
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Icon className="w-12 h-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-2">{title}</p>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      {action && actionLabel && (
        <button
          onClick={action}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Data Table Component
function DataTable({
  data,
  type,
  onEdit,
  onDelete,
  onAction,
  formatCurrency,
  activeMenu,
  setActiveMenu,
}: {
  data: any[];
  type: 'invoice' | 'quote' | 'payment';
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  onAction?: (item: any, action: string) => void;
  formatCurrency: (value: number) => string;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">
              {type === 'invoice' ? 'Invoice' : type === 'quote' ? 'Quote' : 'Payment'} #
            </th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
            {(onEdit || onDelete || onAction) && (
              <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = config?.icon || FileText;
            
            return (
              <tr key={item.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4">
                  <span className="font-medium text-foreground">
                    {item.invoiceNumber || item.quoteNumber || item.paymentId || item.id}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">{item.billTo?.name || item.clientName || '-'}</p>
                    <p className="text-sm text-muted-foreground">{item.billTo?.email || item.clientEmail || ''}</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', config?.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {config?.label || item.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(item.issueDate || item.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <p className="font-bold text-foreground">{formatCurrency(item.total || item.amount || 0)}</p>
                </td>
                {(onEdit || onDelete || onAction) && (
                  <td className="p-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {activeMenu === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-10">
                          {onEdit && (
                            <button
                              onClick={() => { onEdit(item); setActiveMenu(null); }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary"
                            >
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                          )}
                          {type === 'invoice' && item.status === 'draft' && onAction && (
                            <button
                              onClick={() => onAction(item, 'send')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary text-blue-500"
                            >
                              <Send className="w-4 h-4" /> Send Invoice
                            </button>
                          )}
                          {type === 'invoice' && ['sent', 'overdue'].includes(item.status) && onAction && (
                            <button
                              onClick={() => onAction(item, 'markPaid')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary text-green-500"
                            >
                              <CheckCircle className="w-4 h-4" /> Mark Paid
                            </button>
                          )}
                          {type === 'quote' && item.status === 'pending' && onAction && (
                            <button
                              onClick={() => onAction(item, 'convert')}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary text-green-500"
                            >
                              <FileText className="w-4 h-4" /> Convert to Invoice
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary text-red-500"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Invoice Modal Component
function InvoiceModal({ 
  invoice, 
  onSave, 
  onClose 
}: { 
  invoice: Invoice | null; 
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    billTo: invoice?.billTo || {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    },
    items: invoice?.items || [{ id: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: invoice?.notes || '',
    status: invoice?.status || 'draft',
  });

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Bill To</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name *"
                  value={formData.billTo.name}
                  onChange={(e) => setFormData({ ...formData, billTo: { ...formData.billTo, name: e.target.value } })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.billTo.email}
                  onChange={(e) => setFormData({ ...formData, billTo: { ...formData.billTo, email: e.target.value } })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Items</h3>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="w-24 py-2 text-right font-medium">
                      ${item.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-secondary rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-sm text-brand hover:text-brand/90"
              >
                + Add Item
              </button>
            </div>

            {/* Total */}
            <div className="flex justify-end border-t border-border pt-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold text-foreground">${subtotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {invoice ? 'Save' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Quote Modal Component (similar to Invoice)
function QuoteModal({ 
  quote, 
  onSave, 
  onClose 
}: { 
  quote: any; 
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    billTo: quote?.billTo || {
      name: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
    },
    items: quote?.items || [{ id: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    issueDate: quote?.issueDate || new Date().toISOString().split('T')[0],
    validUntil: quote?.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: quote?.notes || '',
    status: quote?.status || 'pending',
  });

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: '', description: '', quantity: 1, unitPrice: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_: any, i: number) => i !== index),
    });
  };

  const subtotal = formData.items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{quote ? 'Edit Quote' : 'New Quote'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {/* Bill To */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Client</h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Name *"
                  value={formData.billTo.name}
                  onChange={(e) => setFormData({ ...formData, billTo: { ...formData.billTo, name: e.target.value } })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={formData.billTo.email}
                  onChange={(e) => setFormData({ ...formData, billTo: { ...formData.billTo, email: e.target.value } })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Items</h3>
              <div className="space-y-2">
                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="w-24 py-2 text-right font-medium">
                      ${item.amount.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-500 hover:bg-secondary rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-sm text-brand hover:text-brand/90"
              >
                + Add Item
              </button>
            </div>

            {/* Total */}
            <div className="flex justify-end border-t border-border pt-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">${subtotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {quote ? 'Save' : 'Create Quote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Checks Table Component
// Check Row Actions Dropdown (uses fixed positioning to escape overflow)
function CheckActionsDropdown({
  check,
  isOpen,
  onToggle,
  onPreview,
  onDownload,
  onEdit,
  onSend,
  onMarkCashed,
  onVoid,
  onDelete,
}: {
  check: any;
  isOpen: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onSend: (method: 'email' | 'sms') => void;
  onMarkCashed: () => void;
  onVoid: () => void;
  onDelete: () => void;
}) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0, openUp: false });

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 350; // Approximate menu height
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
      
      setMenuPos({
        top: openUp ? rect.top : rect.bottom + 4,
        left: rect.right - 208, // 208px = w-52
        openUp,
      });
    }
  }, [isOpen]);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen, onToggle]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="p-2 hover:bg-secondary rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>
      {isOpen && (
        <div
          className="fixed w-52 bg-card border border-border rounded-lg shadow-xl z-[100]"
          style={{
            top: menuPos.openUp ? 'auto' : menuPos.top,
            bottom: menuPos.openUp ? window.innerHeight - menuPos.top + 4 : 'auto',
            left: menuPos.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onPreview}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary rounded-t-lg"
          >
            <Eye className="w-4 h-4" /> Preview Check
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
          {check.status === 'draft' && (
            <>
              <div className="border-t border-border my-1" />
              <button
                onClick={onEdit}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary"
              >
                <Edit className="w-4 h-4" /> Edit Check
              </button>
              <button
                onClick={() => onSend('email')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary text-blue-500"
              >
                <Mail className="w-4 h-4" /> Send via Email
              </button>
              <button
                onClick={() => onSend('sms')}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary text-blue-500"
              >
                <MessageSquare className="w-4 h-4" /> Send via SMS
              </button>
            </>
          )}
          <div className="border-t border-border my-1" />
          {['draft', 'sent', 'printed'].includes(check.status) && (
            <button
              onClick={onMarkCashed}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary text-green-500"
            >
              <CheckCircle className="w-4 h-4" /> Mark as Cashed
            </button>
          )}
          {check.status !== 'voided' && check.status !== 'cashed' && (
            <button
              onClick={onVoid}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary text-brand"
            >
              <XCircle className="w-4 h-4" /> Void Check
            </button>
          )}
          {check.status === 'draft' && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-secondary text-red-500 rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      )}
    </>
  );
}

function ChecksTable({
  checks,
  onEdit,
  onDelete,
  onVoid,
  onMarkCashed,
  onDownload,
  onPreview,
  onSend,
  formatCurrency,
  activeMenu,
  setActiveMenu,
}: {
  checks: any[];
  onEdit: (check: any) => void;
  onDelete: (id: string) => void;
  onVoid: (check: any) => void;
  onMarkCashed: (check: any) => void;
  onDownload: (check: any) => void;
  onPreview: (check: any) => void;
  onSend: (check: any, method: 'email' | 'sms') => void;
  formatCurrency: (value: number) => string;
  activeMenu: string | null;
  setActiveMenu: (id: string | null) => void;
}) {
  return (
    <div className="bg-card rounded-xl border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Check #</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Payee</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => {
            const config = STATUS_CONFIG[check.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = config?.icon || FileText;
            
            return (
              <tr key={check.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                <td className="p-4">
                  <span className="font-medium text-foreground font-mono">
                    #{check.checkNumber}
                  </span>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">{check.payee?.name || '-'}</p>
                    {check.memo && (
                      <p className="text-sm text-muted-foreground">{check.memo}</p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', config?.color)}>
                    <StatusIcon className="w-3 h-3" />
                    {config?.label || check.status}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(check.date).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <p className="font-bold text-foreground">{formatCurrency(check.amount)}</p>
                </td>
                <td className="p-4 text-right">
                  <CheckActionsDropdown
                    check={check}
                    isOpen={activeMenu === check.id}
                    onToggle={() => setActiveMenu(activeMenu === check.id ? null : check.id)}
                    onPreview={() => { onPreview(check); setActiveMenu(null); }}
                    onDownload={() => { onDownload(check); setActiveMenu(null); }}
                    onEdit={() => { onEdit(check); setActiveMenu(null); }}
                    onSend={(method) => { onSend(check, method); setActiveMenu(null); }}
                    onMarkCashed={() => { onMarkCashed(check); setActiveMenu(null); }}
                    onVoid={() => { onVoid(check); setActiveMenu(null); }}
                    onDelete={() => { onDelete(check.id); setActiveMenu(null); }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Check Modal Component
function CheckModal({ 
  check, 
  onSave, 
  onClose 
}: { 
  check: any; 
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    payeeName: check?.payee?.name || '',
    payeeAddress: check?.payee?.address || '',
    payeeCity: check?.payee?.city || '',
    payeeState: check?.payee?.state || '',
    payeeZip: check?.payee?.zip || '',
    amount: check?.amount || '',
    memo: check?.memo || '',
    date: check?.date || new Date().toISOString().split('T')[0],
    signature: check?.signature || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount as string) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">{check ? 'Edit Check' : 'New Check'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {/* Payee */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Pay to the Order of *</label>
              <input
                type="text"
                value={formData.payeeName}
                onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Payee name"
                required
              />
            </div>

            {/* Payee Address (optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payee Address (optional)</label>
              <input
                type="text"
                value={formData.payeeAddress}
                onChange={(e) => setFormData({ ...formData, payeeAddress: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Street address"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                <input
                  type="text"
                  value={formData.payeeCity}
                  onChange={(e) => setFormData({ ...formData, payeeCity: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={formData.payeeState}
                  onChange={(e) => setFormData({ ...formData, payeeState: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="State"
                />
                <input
                  type="text"
                  value={formData.payeeZip}
                  onChange={(e) => setFormData({ ...formData, payeeZip: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="ZIP"
                />
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Memo</label>
              <input
                type="text"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="What is this payment for?"
              />
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Signature</label>
              <SignaturePad
                value={formData.signature}
                onChange={(sig) => setFormData({ ...formData, signature: sig })}
                width={380}
                height={120}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {check ? 'Save Check' : 'Create Check'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Bank Account Modal Component
function BankAccountModal({ 
  accounts,
  onSave, 
  onClose 
}: { 
  accounts: any[];
  onSave: (data: any) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    address: '',
    city: '',
    state: '',
    zip: '',
    nextCheckNumber: '1001',
    isDefault: true,
    logo: '',
    // Business info (prints on checks)
    businessName: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessZip: '',
  });

  // Load existing settings on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          setFormData(prev => ({
            ...prev,
            businessName: settings.businessName || '',
            businessAddress: settings.businessAddress || '',
            businessCity: settings.businessCity || '',
            businessState: settings.businessState || '',
            businessZip: settings.businessZip || '',
          }));
        }
      } catch (e) {
        console.error('Failed to load settings');
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save business info to settings
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          businessCity: formData.businessCity,
          businessState: formData.businessState,
          businessZip: formData.businessZip,
        }),
      });
    } catch (e) {
      console.error('Failed to save business settings');
    }
    
    onSave({
      ...formData,
      nextCheckNumber: parseInt(formData.nextCheckNumber) || 1001,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Check Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your business info and bank account for check printing</p>
        </div>
        
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-4 space-y-4">
            {accounts.length > 0 && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-500">
                  ✓ Bank account configured: {accounts[0].bankName} - {accounts[0].accountName}
                </p>
              </div>
            )}

            {/* Business Info Section */}
            <div className="border-b border-border pb-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                🏢 Business Info <span className="text-xs font-normal text-muted-foreground">(prints on checks)</span>
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Your Company Name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Business Address</label>
                  <input
                    type="text"
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="123 Main Street"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.businessCity}
                    onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.businessState}
                    onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="State"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={formData.businessZip}
                    onChange={(e) => setFormData({ ...formData, businessZip: e.target.value })}
                    className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Section */}
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              🏦 Bank Account Info
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bank Name *</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g., Chase Bank"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Account Name *</label>
              <input
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g., Business Checking"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Routing Number *</label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  placeholder="9 digits"
                  maxLength={9}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  placeholder="Account number"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Starting Check #</label>
                <input
                  type="number"
                  value={formData.nextCheckNumber}
                  onChange={(e) => setFormData({ ...formData, nextCheckNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand font-mono"
                  placeholder="1001"
                />
              </div>
            </div>

            {/* Business Logo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Business Logo (for checks)</label>
              {formData.logo ? (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white border border-border rounded-lg">
                    <img src={formData.logo} alt="Logo" className="h-10 max-w-[150px] object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logo: '' })}
                    className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg hover:border-brand cursor-pointer transition-colors">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Click to upload logo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const formDataUpload = new FormData();
                        formDataUpload.append('file', file);
                        formDataUpload.append('folder', 'logos');
                        const res = await fetch('/api/uploads', { method: 'POST', body: formDataUpload });
                        const data = await res.json();
                        if (data.url) setFormData({ ...formData, logo: data.url });
                      }
                    }}
                  />
                </label>
              )}
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                ⚠️ Bank information is stored locally and used only for check generation.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              {accounts.length > 0 ? 'Close' : 'Cancel'}
            </button>
            <button type="submit" className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90">
              {accounts.length > 0 ? 'Add Another Account' : 'Save Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Check Preview Modal
function CheckPreviewModal({
  check,
  bankAccount,
  onClose,
  onDownload,
}: {
  check: any;
  bankAccount: any;
  onClose: () => void;
  onDownload: () => void;
}) {
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Check Preview</h2>
            <p className="text-sm text-muted-foreground">Check #{check.checkNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Close
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Check Preview */}
          <div 
            className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-6 shadow-lg"
            style={{ aspectRatio: '8.5/3.67', maxWidth: '100%' }}
          >
            {/* Header Row */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-start gap-3">
                {bankAccount?.logo && (
                  <img src={bankAccount.logo} alt="Logo" className="h-12 max-w-[100px] object-contain" />
                )}
                <div>
                  <p className="font-bold text-blue-900">{bankAccount?.accountName || 'Your Business Name'}</p>
                  <p className="text-sm text-gray-600">{bankAccount?.address || '123 Business St'}</p>
                  <p className="text-sm text-gray-600">
                    {bankAccount?.city || 'City'}, {bankAccount?.state || 'ST'} {bankAccount?.zip || '00000'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-900 text-lg">{check.checkNumber}</p>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">DATE: </span>
                  <span className="font-semibold border-b border-gray-400 pb-0.5">{formatDate(check.date)}</span>
                </div>
              </div>
            </div>

            {/* Pay To Line */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-xs text-gray-600 leading-tight">
                <div>PAY TO THE</div>
                <div>ORDER OF</div>
              </div>
              <div className="flex-1 border-b border-gray-400 pb-1">
                <span className="font-bold text-lg">{check.payee?.name}</span>
              </div>
              <div className="border-2 border-blue-900 px-4 py-2 min-w-[120px] text-right">
                <span className="text-sm">$</span>
                <span className="font-bold text-xl ml-1">{formatAmount(check.amount)}</span>
              </div>
            </div>

            {/* Written Amount */}
            <div className="border-b border-gray-400 pb-1 mb-4">
              <span className="text-sm">{check.amountText || 'Amount'} DOLLARS</span>
            </div>

            {/* Bank Name */}
            <div className="mb-4">
              <p className="text-sm text-gray-600">{bankAccount?.bankName || 'Bank Name'}</p>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs text-gray-500">MEMO </span>
                <span className="text-sm border-b border-gray-400 pb-0.5 inline-block min-w-[150px]">
                  {check.memo || ''}
                </span>
              </div>
              <div className="text-right">
                <div className="border-b border-gray-400 min-w-[200px] h-8 flex items-end justify-center">
                  {check.signature ? (
                    <img src={check.signature} alt="Signature" className="max-h-7 max-w-[180px]" />
                  ) : (
                    <span className="text-xs text-gray-400 pb-1">SIGNATURE</span>
                  )}
                </div>
              </div>
            </div>

            {/* MICR Line */}
            <div className="mt-4 pt-2 border-t border-gray-300">
              <p className="font-mono text-sm text-gray-600 tracking-wider">
                ⑆{bankAccount?.routingNumber?.padStart(9, '0') || '000000000'}⑆ {bankAccount?.accountNumber || '0000000000'}⑈ {check.checkNumber.toString().padStart(4, '0')}
              </p>
            </div>

            {/* Void Watermark */}
            {check.status === 'voided' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-red-500 text-7xl font-bold opacity-30 rotate-[-20deg]">VOID</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
