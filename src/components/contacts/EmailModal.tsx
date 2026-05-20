'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Send, 
  Loader2,
  User,
  CheckCircle,
  Paperclip,
  X,
} from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  contactName?: string;
}

export function EmailModal({ isOpen, onClose, initialEmail, contactName }: EmailModalProps) {
  const [toEmail, setToEmail] = useState(initialEmail || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setToEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSend = async () => {
    if (!toEmail.trim() || !subject.trim()) return;
    
    setError(null);
    setSending(true);

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          text: body,
          cc: cc || undefined,
          bcc: bcc || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setSent(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setToEmail(initialEmail || '');
    setSubject('');
    setBody('');
    setCc('');
    setBcc('');
    setShowCcBcc(false);
    setError(null);
    setSent(false);
    onClose();
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-500" />
            Compose Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          {contactName && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
                <User className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="font-medium text-foreground">{contactName}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {toEmail}
                </p>
              </div>
            </div>
          )}

          {/* To */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-muted-foreground">To</label>
              {!showCcBcc && (
                <button
                  type="button"
                  className="text-xs text-blue-500 hover:underline"
                  onClick={() => setShowCcBcc(true)}
                >
                  Add CC/BCC
                </button>
              )}
            </div>
            <Input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="bg-secondary border-border"
              type="email"
            />
          </div>

          {/* CC/BCC */}
          {showCcBcc && (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">CC</label>
                <Input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="bg-secondary border-border"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">BCC</label>
                <Input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="bg-secondary border-border"
                  type="email"
                />
              </div>
            </>
          )}

          {/* Subject */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="bg-secondary border-border"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              className="bg-secondary border-border resize-none min-h-[160px]"
              rows={8}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">{error}</p>
          )}

          {sent && (
            <div className="flex items-center justify-center gap-2 text-green-500 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>Email sent successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !toEmail.trim() || !subject.trim() || !isValidEmail(toEmail) || sent}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
