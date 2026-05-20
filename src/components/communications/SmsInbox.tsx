'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Loader2,
  User,
  Check,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';

interface Message {
  id: string;
  message_sid: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  body: string;
  status: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  contact_number: string;
  last_message: string;
  last_message_at: string;
  direction: string;
  is_read: boolean;
}

interface SmsInboxProps {
  initialContact?: string | null;
  contactName?: string | null;
  onClearContact?: () => void;
}

export function SmsInbox({ initialContact, contactName, onClearContact }: SmsInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle initial contact from props
  useEffect(() => {
    if (initialContact) {
      setSelectedContact(formatPhoneForApi(initialContact));
      setSelectedContactName(contactName || null);
    }
  }, [initialContact, contactName]);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatPhoneForApi = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    if (!phone.startsWith('+')) {
      return `+${cleaned}`;
    }
    return phone;
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/sms');
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (contact: string) => {
    try {
      const response = await fetch(`/api/sms?with=${encodeURIComponent(contact)}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    const to = selectedContact || newContactNumber;
    if (!to || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to,
          body: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        if (selectedContact) {
          fetchMessages(selectedContact);
        } else {
          setSelectedContact(formatPhoneForApi(newContactNumber));
          setShowNewConversation(false);
          setNewContactNumber('');
        }
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case 'failed':
      case 'undelivered':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Check className="w-3 h-3 text-muted-foreground/50" />;
    }
  };

  const handleBackToList = () => {
    setSelectedContact(null);
    setSelectedContactName(null);
    setMessages([]);
    if (onClearContact) {
      onClearContact();
    }
  };

  // Conversation List View
  if (!selectedContact && !showNewConversation) {
    return (
      <div className="h-[500px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Messages</h3>
          <Button
            onClick={() => setShowNewConversation(true)}
            size="sm"
            className="bg-brand hover:bg-brand/90"
          >
            New Message
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-muted-foreground/70 text-sm">Start a conversation</p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.contact_number}
                  onClick={() => {
                    setSelectedContact(conv.contact_number);
                    setSelectedContactName(null);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left ${
                    !conv.is_read && conv.direction === 'inbound' ? 'bg-secondary/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${!conv.is_read && conv.direction === 'inbound' ? 'text-foreground' : 'text-foreground/80'}`}>
                        {formatPhoneDisplay(conv.contact_number)}
                      </p>
                      <span className="text-muted-foreground text-xs">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate">
                      {conv.direction === 'outbound' && 'You: '}
                      {conv.last_message}
                    </p>
                  </div>
                  {!conv.is_read && conv.direction === 'inbound' && (
                    <div className="w-2 h-2 rounded-full bg-brand" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    );
  }

  // New Conversation View
  if (showNewConversation) {
    return (
      <div className="h-[500px] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewConversation(false)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground">New Message</h3>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Enter phone number"
            value={newContactNumber}
            onChange={(e) => setNewContactNumber(e.target.value)}
            className="bg-secondary border-border text-foreground"
          />
          
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-secondary border-border text-foreground resize-none"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!newContactNumber || !newMessage.trim() || sending}
              className="bg-brand hover:bg-brand/90 px-4 self-end"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation View
  return (
    <div className="h-[500px] flex flex-col">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToList}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            {selectedContactName && (
              <p className="font-medium text-foreground">{selectedContactName}</p>
            )}
            <p className={selectedContactName ? "text-muted-foreground text-sm" : "font-medium text-foreground"}>
              {formatPhoneDisplay(selectedContact!)}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">No messages yet</p>
              <p className="text-muted-foreground/70 text-xs">Send the first message below</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.direction === 'outbound'
                      ? 'bg-brand text-brand-foreground'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-sm">{msg.body}</p>
                  <div className={`flex items-center gap-1 mt-1 ${
                    msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-xs opacity-70">
                      {formatTime(msg.created_at)}
                    </span>
                    {msg.direction === 'outbound' && getStatusIcon(msg.status)}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
        <Textarea
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="bg-secondary border-border text-foreground resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          className="bg-brand hover:bg-brand/90 px-4"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
}
