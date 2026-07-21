/**
 * POST /api/eve/chat — Eve, the CFS assistant.
 *
 * Answers questions about the dashboard. Provider is pluggable (OpenAI today;
 * Claude, xAI, Gemini and Hermes are planned) — only the model call below is
 * provider-specific, so adding one means adding a branch here, not reworking
 * the route or the UI.
 *
 * Auth-gated on purpose: an unauthenticated route that forwards to a paid API
 * is an open bill. Middleware already blocks anonymous traffic; this is the
 * second lock.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getSessionIdentity } from '@/lib/rbac/current-user';
import { pageDirectory, findPage } from '@/lib/eve/pages';

export const dynamic = 'force-dynamic';

/** Override with EVE_MODEL to move Eve to a different OpenAI model. */
const MODEL = process.env.EVE_MODEL || 'gpt-5.1';
const MAX_TURNS = 20;
const MAX_REPLY_TOKENS = 800;

/**
 * gpt-5.x and the o-series reject `max_tokens` outright ("Unsupported
 * parameter ... use max_completion_tokens instead"), while older models such as
 * gpt-4o only accept `max_tokens`. Verified against the live API — picking the
 * wrong one is a hard 400, so EVE_MODEL must not silently break Eve.
 */
function tokenLimitParam(model: string): Record<string, number> {
  const modern = /^(gpt-5|o[1-9])/.test(model);
  return modern
    ? { max_completion_tokens: MAX_REPLY_TOKENS }
    : { max_tokens: MAX_REPLY_TOKENS };
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

function systemPrompt(pathname: string | null, userName: string | null): string {
  const current = pathname ? findPage(pathname) : null;
  return [
    'You are Eve, the assistant inside the Certified Fiduciary Services (CFS Arizona) practice dashboard.',
    'CFS is a licensed Arizona fiduciary practice: they act as trustee, conservator, guardian, personal representative and agent under power of attorney.',
    userName ? `You are speaking with ${userName}.` : '',
    '',
    'These are the pages of the dashboard:',
    pageDirectory(),
    '',
    current
      ? `The user is currently on the ${current.name} page (${current.href}), which is ${current.status === 'live' ? 'backed by live data' : 'still a static mockup'}.`
      : '',
    '',
    'How to answer:',
    '- Be concise and concrete. These are busy practitioners, not readers of documentation.',
    '- A page marked [mockup] shows placeholder sample data, not real records. If asked about numbers or records on such a page, say plainly that the page is a design mockup and its figures are not real. Never present placeholder data as though it were the practice\'s actual caseload.',
    '- You cannot yet read records from the database, create anything, or perform actions. If asked to do so, say so directly and explain where in the app they can do it themselves. Do not invent client names, balances, case numbers, or deadlines under any circumstances.',
    '- You are not a lawyer. For legal or fiduciary-duty questions, give general context and recommend they confirm with counsel.',
    '- Client information is confidential and often concerns vulnerable adults. Handle it with care.',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(req: NextRequest) {
  const identity = await getSessionIdentity();
  if (!identity) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Eve is not configured yet — OPENAI_API_KEY is not set on the server.' },
      { status: 503 },
    );
  }

  let body: { messages?: ChatTurn[]; pathname?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const turns = Array.isArray(body.messages) ? body.messages.slice(-MAX_TURNS) : [];
  if (turns.length === 0) {
    return NextResponse.json({ error: 'No message to answer.' }, { status: 400 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt(body.pathname ?? null, identity.name ?? null) },
        ...turns.map((t) => ({
          role: t.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: String(t.content ?? ''),
        })),
      ],
      ...tokenLimitParam(MODEL),
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: 'Eve had nothing to say. Try rephrasing.' }, { status: 502 });
    }
    return NextResponse.json({ reply, model: MODEL });
  } catch (err) {
    const message = (err as Error).message || 'Eve could not be reached.';
    console.error('[eve] chat failed:', message);
    // Surface the cause: a bad key and a bad model name are both common here
    // and look identical from the UI otherwise.
    return NextResponse.json({ error: `Eve could not answer: ${message}` }, { status: 502 });
  }
}
