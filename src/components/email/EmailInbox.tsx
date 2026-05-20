'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mail,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Star,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Paperclip,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Email {
  id: string;
  uid: number;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  date: string;
  snippet?: string;
  body?: string;
  html?: string;
  read: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

interface EmailInboxProps {
  onCompose: () => void;
  onReply: (email: Email) => void;
}

export function EmailInbox({ onCompose, onReply }: EmailInboxProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmails();
  }, [page]);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/email?page=${page}&limit=25`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setEmails([]);
      } else {
        setEmails(data.emails || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      }
    } catch (err) {
      setError('Failed to fetch emails');
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFullEmail = async (id: string) => {
    setLoadingEmail(true);
    try {
      const response = await fetch(`/api/email?id=${id}`);
      const data = await response.json();
      
      if (data.email) {
        setSelectedEmail(data.email);
        // Mark as read
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', uid: data.email.uid }),
        });
        // Update local state
        setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
      }
    } catch (err) {
      console.error('Error fetching email:', err);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleDelete = async (uid: number) => {
    try {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', uid }),
      });
      setSelectedEmail(null);
      fetchEmails();
    } catch (err) {
      console.error('Error deleting email:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return dateStr;
    }
  };

  const filteredEmails = emails.filter(email => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(searchLower) ||
      email.from?.toLowerCase().includes(searchLower) ||
      email.fromName?.toLowerCase().includes(searchLower)
    );
  });

  // Email Detail View
  if (selectedEmail) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" onClick={() => onReply(selectedEmail)}>
            <Reply className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Forward className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(selectedEmail.uid)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Email Content */}
        {loadingEmail ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {selectedEmail.subject}
              </h2>
              
              <div className="flex items-start gap-4 mb-6 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-medium shrink-0">
                  {selectedEmail.fromName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{selectedEmail.fromName || selectedEmail.from}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmail.from}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedEmail.date).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    {selectedEmail.attachments.length} Attachment(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, i) => (
                      <span key={i} className="px-3 py-1 bg-secondary rounded text-sm text-muted-foreground">
                        {att.filename}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEmail.html ? (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-foreground">
                  {selectedEmail.body}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  // Email List View
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-border shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={fetchEmails}>
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
        <span className="text-sm text-muted-foreground">{total} emails</span>
      </div>

      {/* Email List */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">
            {error.includes('password') 
              ? 'Please configure the email password in settings.' 
              : 'Check your email configuration.'}
          </p>
        </div>
      ) : filteredEmails.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">
            {search ? 'No emails match your search' : 'No emails yet'}
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {filteredEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => fetchFullEmail(email.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/50 transition-colors',
                    !email.read && 'bg-brand/5'
                  )}
                >
                  {!email.read && (
                    <Circle className="w-2 h-2 mt-2 fill-brand text-brand shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", email.read && "ml-5")}>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "truncate",
                        !email.read ? "font-semibold text-foreground" : "text-foreground"
                      )}>
                        {email.fromName || email.from?.split('<')[0]?.trim() || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    <p className={cn(
                      "truncate text-sm",
                      !email.read ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {email.subject || '(no subject)'}
                    </p>
                    {email.snippet && (
                      <p className="truncate text-xs text-muted-foreground mt-1">
                        {email.snippet}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
