'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CreditCard,
  Plus,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Building,
  DollarSign,
  Percent,
  Receipt,
  Settings,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  Shield,
  Wallet,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
  brand?: string;
}

interface PaymentProcessor {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  mode: 'test' | 'live';
  features: string[];
}

export default function PaymentSetupPage() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddCard, setShowAddCard] = useState(false);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      last4: '4242',
      expiry: '12/26',
      isDefault: true,
      brand: 'visa',
    },
    {
      id: '2',
      type: 'bank',
      name: 'Chase Business Checking',
      last4: '6789',
      isDefault: false,
    },
  ]);

  const [processors, setProcessors] = useState<PaymentProcessor[]>([
    {
      id: 'square',
      name: 'Square',
      logo: '⬜',
      connected: true,
      mode: 'live',
      features: ['Card payments', 'ACH transfers', 'Invoicing', 'POS integration'],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      logo: '💳',
      connected: false,
      mode: 'test',
      features: ['Card payments', 'Subscriptions', 'International payments', 'Advanced fraud detection'],
    },
    {
      id: 'paypal',
      name: 'PayPal',
      logo: '🅿️',
      connected: false,
      mode: 'test',
      features: ['PayPal payments', 'Venmo', 'Pay Later options'],
    },
  ]);

  const [invoiceSettings, setInvoiceSettings] = useState({
    companyName: 'ChannelCast',
    companyAddress: '123 Main St, Phoenix, AZ 85001',
    companyEmail: 'billing@channelcast.io',
    companyPhone: '+1 (602) 555-0123',
    taxRate: '0',
    defaultPaymentTerms: '30',
    invoicePrefix: 'INV-',
    invoiceFooter: 'Thank you for your business!',
    autoReminders: true,
    reminderDays: '3,7,14',
  });

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === methodId,
    })));
  };

  const handleDeleteMethod = (methodId: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== methodId));
  };

  const handleConnectProcessor = async (processorId: string) => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessors(prev => prev.map(p => 
        p.id === processorId ? { ...p, connected: true } : p
      ));
      setSaveMessage({ type: 'success', text: `Connected to ${processorId}!` });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to connect' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDisconnectProcessor = async (processorId: string) => {
    setProcessors(prev => prev.map(p => 
      p.id === processorId ? { ...p, connected: false } : p
    ));
  };

  const handleSaveInvoiceSettings = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: 'Invoice settings saved!' });
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand" />
            Payment Setup
          </h1>
          <p className="text-muted-foreground">Configure payment processors and billing settings</p>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveMessage.text}
        </div>
      )}

      <Tabs defaultValue="processors" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="processors" className="data-[state=active]:bg-muted">
            <LinkIcon className="w-4 h-4 mr-2" />
            Payment Processors
          </TabsTrigger>
          <TabsTrigger value="methods" className="data-[state=active]:bg-muted">
            <Wallet className="w-4 h-4 mr-2" />
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-muted">
            <Receipt className="w-4 h-4 mr-2" />
            Invoice Settings
          </TabsTrigger>
        </TabsList>

        {/* Payment Processors Tab */}
        <TabsContent value="processors" className="mt-0">
          <div className="space-y-4">
            {processors.map((processor) => (
              <Card key={processor.id} className="bg-card/50 border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-2xl">
                        {processor.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{processor.name}</h3>
                          {processor.connected && (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          )}
                          {processor.connected && (
                            <Badge variant={processor.mode === 'live' ? 'default' : 'secondary'}>
                              {processor.mode === 'live' ? 'Live' : 'Test Mode'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {processor.features.map((feature, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {processor.connected ? (
                        <>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnectProcessor(processor.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => handleConnectProcessor(processor.id)}
                          disabled={saving}
                          className="bg-brand hover:bg-brand/90"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 mr-2" />
                          )}
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Recommendation Card */}
            <Card className="bg-brand/10 border-brand/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Recommended: Square</p>
                    <p className="text-sm text-muted-foreground">
                      You've been using Square for years. It's already configured and ready for payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Saved Payment Methods</CardTitle>
                    <CardDescription>Methods used for subscription and one-time payments</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddCard(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        {method.type === 'card' ? (
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Building className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{method.name}</p>
                          {method.isDefault && (
                            <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          •••• {method.last4} {method.expiry && `• Exp ${method.expiry}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMethod(method.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Billing Information</CardTitle>
                <CardDescription>Your billing address for invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Billing Name</Label>
                  <Input
                    defaultValue="ChannelCast LLC"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Billing Email</Label>
                  <Input
                    defaultValue="billing@channelcast.io"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <Input
                    defaultValue="123 Main St"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">City</Label>
                    <Input
                      defaultValue="Phoenix"
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <Input
                      defaultValue="AZ"
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">ZIP</Label>
                    <Input
                      defaultValue="85001"
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                </div>
                <Button className="w-full bg-brand hover:bg-brand/90">
                  Update Billing Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoice Settings Tab */}
        <TabsContent value="invoices" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Company Details</CardTitle>
                <CardDescription>Information displayed on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Company Name</Label>
                  <Input
                    value={invoiceSettings.companyName}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <Input
                    value={invoiceSettings.companyAddress}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <Input
                      value={invoiceSettings.companyEmail}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <Input
                      value={invoiceSettings.companyPhone}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Invoice Options</CardTitle>
                <CardDescription>Default settings for new invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Percent className="w-4 h-4" /> Tax Rate (%)
                    </Label>
                    <Input
                      value={invoiceSettings.taxRate}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, taxRate: e.target.value }))}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Payment Terms (days)</Label>
                    <select
                      value={invoiceSettings.defaultPaymentTerms}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, defaultPaymentTerms: e.target.value }))}
                      className="w-full h-10 px-3 mt-1 bg-secondary border border-border rounded-md text-foreground"
                    >
                      <option value="0">Due on receipt</option>
                      <option value="7">Net 7</option>
                      <option value="15">Net 15</option>
                      <option value="30">Net 30</option>
                      <option value="60">Net 60</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Invoice Number Prefix</Label>
                  <Input
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Invoice Footer Note</Label>
                  <textarea
                    value={invoiceSettings.invoiceFooter}
                    onChange={(e) => setInvoiceSettings(prev => ({ ...prev, invoiceFooter: e.target.value }))}
                    className="w-full px-3 py-2 mt-1 bg-secondary border border-border rounded-md text-foreground min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-foreground">Payment Reminders</CardTitle>
                <CardDescription>Automatic reminders for unpaid invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-foreground">Enable Automatic Reminders</p>
                    <p className="text-sm text-muted-foreground">Send email reminders for overdue invoices</p>
                  </div>
                  <Switch
                    checked={invoiceSettings.autoReminders}
                    onChange={(checked) => setInvoiceSettings(prev => ({ ...prev, autoReminders: checked }))}
                  />
                </div>
                {invoiceSettings.autoReminders && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Reminder Schedule (days after due date)</Label>
                    <Input
                      value={invoiceSettings.reminderDays}
                      onChange={(e) => setInvoiceSettings(prev => ({ ...prev, reminderDays: e.target.value }))}
                      placeholder="e.g., 3, 7, 14"
                      className="bg-secondary border-border mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Comma-separated list of days. Example: 3,7,14 sends reminders 3, 7, and 14 days after due date.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2 flex justify-end">
              <Button
                onClick={handleSaveInvoiceSettings}
                disabled={saving}
                className="bg-brand hover:bg-brand/90"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Save Invoice Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Payment Method Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Add Payment Method</CardTitle>
              <CardDescription>Add a credit card or bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Credit Card
                </Button>
                <Button variant="outline" className="flex-1">
                  <Building className="w-4 h-4 mr-2" />
                  Bank Account
                </Button>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Card Number</Label>
                <Input
                  placeholder="4242 4242 4242 4242"
                  className="bg-secondary border-border mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">CVC</Label>
                  <Input
                    placeholder="123"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddCard(false)}>
                  Cancel
                </Button>
                <Button className="bg-brand hover:bg-brand/90">
                  Add Card
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
