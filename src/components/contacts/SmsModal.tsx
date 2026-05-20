'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Send, 
  Loader2,
  User,
  Phone,
  CheckCircle,
} from 'lucide-react';

interface SmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  contactName?: string;
}

export function SmsModal({ isOpen, onClose, initialPhone, contactName }: SmsModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
    }
  }, [initialPhone]);

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  const handleSend = async () => {
    if (!phoneNumber.trim() || !message.trim()) return;
    
    setError(null);
    setSending(true);

    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: phoneNumber,
          body: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
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
    setPhoneNumber(initialPhone || '');
    setMessage('');
    setError(null);
    setSent(false);
    onClose();
  };

  const getSmsSegments = () => {
    // Standard SMS is 160 chars, but with Unicode it's 70
    const hasUnicode = /[^\x00-\x7F]/.test(message);
    const segmentSize = hasUnicode ? 70 : 160;
    return Math.ceil(charCount / segmentSize) || 1;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            Send SMS
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
                  <Phone className="w-3 h-3" />
                  {phoneNumber}
                </p>
              </div>
            </div>
          )}

          {/* Phone Number (if no contact) */}
          {!contactName && (
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">To</label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="bg-secondary border-border"
                type="tel"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm text-muted-foreground">Message</label>
              <span className="text-xs text-muted-foreground">
                {charCount} chars • {getSmsSegments()} segment{getSmsSegments() > 1 ? 's' : ''}
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="bg-secondary border-border resize-none min-h-[120px]"
              rows={5}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">{error}</p>
          )}

          {sent && (
            <div className="flex items-center justify-center gap-2 text-green-500 p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <span>Message sent successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !phoneNumber.trim() || !message.trim() || sent}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send SMS
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
