import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.HERMES_GATEWAY_URL || 'http://localhost:18789';
const GATEWAY_TOKEN = process.env.HERMES_GATEWAY_TOKEN || '';

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((c: { type: string }) => c.type === 'text')
      .map((c: { text: string }) => c.text)
      .join('\n');
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
    }

    const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'sessions_send',
        args: {
          sessionKey: 'main',
          message: message,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gateway error:', response.status, errorText);
      
      const fallbackResponse = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          stream: false,
          session: 'main',
        }),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`Gateway error: ${response.status}`);
      }

      const fallbackData = await fallbackResponse.json();
      const assistantMessage = fallbackData.choices?.[0]?.message?.content || 'No response';
      return NextResponse.json({ response: assistantMessage });
    }

    const data = await response.json();
    const rawResponse = data.result?.details?.reply || data.result?.details?.response || data.result?.reply || '';
    const assistantMessage = extractText(rawResponse) || 'No response';

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (GATEWAY_TOKEN) {
      headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
    }

    const response = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'sessions_history',
        args: {
          sessionKey: 'main',
          limit: 50,
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ messages: [] });
    }

    const data = await response.json();
    const rawMessages = data.result?.details?.messages || data.result?.messages || [];
    
    const messages = Array.isArray(rawMessages)
      ? rawMessages
          .filter((msg: { role: string }) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg: { role: string; content: unknown }) => ({
            role: msg.role,
            content: extractText(msg.content),
          }))
          .filter((msg: { content: string }) => msg.content && !msg.content.includes('REPLY_SKIP') && !msg.content.includes('ANNOUNCE_SKIP'))
      : [];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json({ messages: [] });
  }
}
