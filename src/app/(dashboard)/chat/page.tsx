'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, User, Loader2, RefreshCw, Wifi } from "lucide-react";
import { Sig360LogoMark } from "@/components/branding/Sig360LogoMark";
import { useAIStatus } from "@/components/providers/AIStatusProvider";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setThinking, setIdle } = useAIStatus();

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/chat');
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        const formattedMessages = data.messages.map((msg: { role: string; content: string }, index: number) => ({
          id: `hist-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(),
          source: 'history'
        }));
        setMessages(formattedMessages);
      } else {
        // Welcome message if no history
        setMessages([{
          id: '1',
          role: 'assistant',
          content: "Hey! You're now connected to the main session — same context as Telegram. What can I help you with? 🔥",
          timestamp: new Date(),
        }]);
      }
      setIsConnected(true);
    } catch (error) {
      console.error('Error loading history:', error);
      setIsConnected(false);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Dashboard loaded, but I couldn't connect to the main session. Check gateway connection.",
        timestamp: new Date(),
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      source: 'dashboard'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setThinking(); // Update sidebar status

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsConnected(true);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Connection error: ${error}. Check gateway status.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      setIdle(); // Back to idle
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat with SIG360</h1>
          <p className="text-muted-foreground">Connected to main session (shared with Telegram)</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={isConnected ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}
          >
            <Wifi className="w-3 h-3 mr-1" />
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            className="border-border text-muted-foreground hover:bg-secondary"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col bg-card/50 border-border overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground flex items-center gap-2">
            <Sig360LogoMark boxClassName="h-9 w-9 rounded-md" letterClassName="text-lg font-bold leading-none text-brand" />
            Main Session
            <span className="text-sm font-normal text-muted-foreground ml-2">
              Messages sync across all channels
            </span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className={`w-8 h-8 flex items-center justify-center ${message.role === 'assistant' ? 'bg-brand/20' : 'bg-secondary'}`}>
                    {message.role === 'assistant' ? (
                      <span className="text-sm font-bold leading-none text-brand">S</span>
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Avatar>
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      message.role === 'assistant'
                        ? 'bg-secondary text-foreground'
                        : 'bg-brand/20 text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.source && (
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground py-0">
                          {message.source}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 bg-brand/20 flex items-center justify-center">
                    <span className="text-sm font-bold leading-none text-brand">S</span>
                  </Avatar>
                  <div className="bg-secondary rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
                rows={2}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-brand hover:bg-brand/90 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
