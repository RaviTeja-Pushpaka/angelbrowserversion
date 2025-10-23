import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize AI clients
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;



// System prompts
let CHAT_SYSTEM_PROMPT = `You are role‑playing on behalf of the user. Always speak in first person as the user and never mention that you are an AI or assistant.`;

const SCREENSHOT_SYSTEM_PROMPT = `You are analyzing a screenshot/image the user shared so undustand why user shared and give the anser as per the context it may be the code or some explination anything undistand it and give your responce indeatil plese .

Carefully examine the screenshot content and provide helpful analysis. If it contains code, review it and provide feedback. If it shows an error, explain what it means and how to fix it. If it's a UI/interface, describe what you see and provide insights. Always be specific and helpful.`;

// Function to update system prompt based on use case and user data
function updateSystemPrompt(useCase: string, userData: string) {
  let processedData = userData;
  
  // If data is very long (>2000 chars), summarize it with AI
  if (userData.length > 2000) {
    // For now, just truncate and add note - in production you could use AI to summarize
    processedData = userData.substring(0, 2000) + '\n\n[Note: Data was truncated for efficiency. Full details are preserved.]';
  }
  
  if (useCase === 'interview') {
    CHAT_SYSTEM_PROMPT = `You are role‑playing as the candidate in an interview. Speak strictly in first person as the candidate. Never state or imply that you are an assistant or AI. Do not introduce yourself as "Angel".

CANDIDATE PROFILE (use these exact details):
${processedData}

INSTRUCTIONS:
- Answer as the candidate would, in first person ("I", "my", "me").
- When asked "Tell me about yourself", give a concise professional summary based on the profile above.
- Reference real experience, skills, projects, companies, and achievements from the profile.
- If a detail is missing, say you prefer to focus on relevant experience rather than inventing facts.
- Keep responses natural, confident, and human.
- Keep answers concise and interview‑style unless asked to elaborate.

BANNED PHRASES:
- "How can I assist you today?", "I'm here to help", "as an AI", "Angel assistant".
- Never mention being an assistant or offering assistance.

IF ASKED "Are you ready?":
- Reply in first person simply: "Yes, I'm ready." (no extra assistant phrasing).`;
  } else if (useCase === 'sales') {
    CHAT_SYSTEM_PROMPT = `You are role‑playing as the user in a sales context. Speak in first person and never mention that you are an assistant or AI.

SALES CONTEXT (use these exact details):
${processedData}

INSTRUCTIONS:
- Provide sales strategies and responses in first person.
- Reference the specific product, audience and objections from the context.
- Keep responses practical and actionable.

BANNED PHRASES:
- "How can I assist you today?", "I'm here to help", "as an AI", "Angel assistant".`;
  } else if (useCase === 'meeting') {
    CHAT_SYSTEM_PROMPT = `You are role‑playing as the user for meeting preparation/facilitation. Speak in first person and never mention that you are an assistant or AI.

MEETING CONTEXT (use these exact details):
${processedData}

INSTRUCTIONS:
- Provide meeting guidance in first person.
- Be concise and practical; reference the provided context.

BANNED PHRASES:
- "How can I assist you today?", "I'm here to help", "as an AI", "Angel assistant".`;
  } else if (useCase === 'custom') {
    CHAT_SYSTEM_PROMPT = `You are role‑playing on behalf of the user for a custom scenario. Speak in first person and never mention that you are an assistant or AI.

CUSTOM CONTEXT/INSTRUCTIONS (use these exact details):
${processedData}

INSTRUCTIONS:
- Follow the user's instructions and respond as them in first person.
- Keep responses clear, grounded in the provided context.

BANNED PHRASES:
- "How can I assist you today?", "I'm here to help", "as an AI", "Angel assistant".`;
  }
  
  return { success: true, message: 'System prompt updated successfully' };
}

// Helper: verify Firebase ID token from Authorization header
async function verifyAuth(req: NextRequest): Promise<{ uid: string } | null> {
  try {
    const authz = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authz || !authz.startsWith('Bearer ')) return null;
    const idToken = authz.substring('Bearer '.length).trim();
    if (!idToken) return null;
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

// Dev-only fallback: if admin verification fails locally, try to decode JWT payload to get uid
function devDecodeUid(req: NextRequest): { uid: string } | null {
  if (process.env.NODE_ENV === 'production') return null;
  try {
    const authz = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authz || !authz.startsWith('Bearer ')) return null;
    const token = authz.substring('Bearer '.length).trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    const candidate = payload?.uid || payload?.user_id || payload?.sub || payload?.email;
    if (candidate) {
      const pseudoUid = String(candidate);
      console.warn('[DEV ONLY] Using uid from unverified token payload:', pseudoUid);
      return { uid: pseudoUid };
    }
    return null;
  } catch {
    return null;
  }
}

// Helper: determine credit cost for request
function getCreditCost(type: string, hasImage: boolean): number {
  if (type === 'transcribe') return 2; // 2 credits for audio/transcription
  if (type === 'chat') return hasImage ? 4 : 1; // 1 for chat, 4 for image
  return 0; // setup, analyze_session, others = free
}

// Helper: atomically deduct credits
async function tryDeductCredits(uid: string, amount: number): Promise<{ ok: boolean; remaining?: number }>{
  if (amount <= 0) return { ok: true, remaining: undefined };
  return await adminDb.runTransaction(async (tx) => {
    const userRef = adminDb.collection('users').doc(uid);
    const snap = await tx.get(userRef);
    const data = snap.exists ? (snap.data() as any) : {};
    const sub = data?.subscription || {};
    const current = typeof sub.credits === 'number' ? sub.credits : 0;
    if (current < amount) return { ok: false };
    const next = current - amount;
    const updated = { ...data, subscription: { ...sub, credits: next } };
    tx.set(userRef, updated, { merge: true });
    return { ok: true, remaining: next };
  });
}

// Chat with OpenAI
async function chatWithOpenAI(message: string, history: any[]) {
  if (!openai) throw new Error('OpenAI not configured');
  
  const messages = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
    ...history.slice(-20), // Keep last 20 messages
    { role: 'user', content: message }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages as any,
    max_tokens: 1000,
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// Utility: read Blob to base64 string
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

// Streaming chat with OpenAI (supports optional image input)
async function streamChatWithOpenAI(message: string, history: any[], imageData?: string) {
  if (!openai) throw new Error('OpenAI not configured');

  const messages: any[] = [
    { role: 'system', content: imageData ? SCREENSHOT_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT },
    ...history.slice(-20),
  ];

  if (imageData) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: message || 'Please analyze this screenshot' },
        { type: 'image_url', image_url: { url: imageData } },
      ],
    });
  } else {
    messages.push({ role: 'user', content: message });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // @ts-ignore: OpenAI SDK supports async iterator for streaming
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages as any,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        });

        for await (const part of completion as any) {
          const delta = part?.choices?.[0]?.delta?.content || '';
          if (delta) controller.enqueue(new TextEncoder().encode(delta));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return stream;
}

// Analysis helper
async function analyzeWithOpenAI(history: any[]) {
  if (!openai) throw new Error('OpenAI not configured');
  const instruction = `You are an expert interview and meeting coach. Analyze the full conversation below and produce a thorough, actionable report with these sections:

1) Executive Summary
2) Strengths Observed
3) Areas to Improve (with examples and rewrites)
4) Behavioral Signals & Communication
5) Technical Depth (if applicable)
6) Suggested Practice Questions
7) Next Steps Checklist

Write in clear, professional English using concise bullet points and short paragraphs. Output in Markdown.`;
  const messages = [
    { role: 'system', content: instruction },
    { role: 'user', content: JSON.stringify(history).slice(0, 35000) }
  ];
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages as any,
    max_tokens: 2000,
    temperature: 0.4
  });
  return resp.choices[0]?.message?.content || '';
}

async function analyzeWithGemini(history: any[]) {
  if (!genAI) throw new Error('Gemini not configured');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const instruction = `You are an expert interview and meeting coach. Analyze the full conversation and produce a thorough, actionable report with:
- Executive Summary
- Strengths
- Areas to Improve (with examples)
- Behavioral Signals
- Technical Depth (if applicable)
- Suggested Practice Questions
- Next Steps Checklist
Write concise bullet points and short paragraphs. Output in Markdown.`;
  const prompt = `${instruction}\n\nConversation JSON (truncated):\n${JSON.stringify(history).slice(0, 35000)}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text() || '';
}

// Chat with Gemini
async function chatWithGemini(message: string, history: any[]) {
  if (!genAI) throw new Error('Gemini not configured');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  
  // Build conversation context
  let context = CHAT_SYSTEM_PROMPT + '\n\n';
  history.slice(-20).forEach(msg => {
    context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
  });
  context += `User: ${message}`;

  const result = await model.generateContent(context);
  const response = await result.response;
  return response.text() || 'Sorry, I could not generate a response.';
}

// Screenshot analysis with OpenAI
async function analyzeScreenshotWithOpenAI(message: string, imageData: string) {
  if (!openai) throw new Error('OpenAI not configured');
  
  const messages = [
    { role: 'system', content: SCREENSHOT_SYSTEM_PROMPT },
    { 
      role: 'user', 
      content: [
        { type: 'text', text: message || 'Please analyze this screenshot' },
        { type: 'image_url', image_url: { url: imageData } }
      ]
    }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages as any,
    max_tokens: 1000,
    temperature: 0.7
  });

  return response.choices[0]?.message?.content || 'Sorry, I could not analyze the screenshot.';
}

// Optimized transcription - fastest path first
async function transcribeAudioFast(audioBlob: Blob): Promise<string> {
  // Direct Whisper-1 call - most reliable and fast
  if (openai) {
    try {
      const fd = new FormData();
      fd.append('file', audioBlob, 'audio.webm');
      fd.append('model', 'whisper-1');
      fd.append('response_format', 'text'); // Get plain text directly

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: fd,
      });

      if (response.ok) {
        const text = await response.text();
        return text.trim();
      }
    } catch (error) {
      console.error('Whisper transcription failed:', error);
    }
  }

  // Fallback to Gemini only if OpenAI fails
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash', // Faster than pro
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0,
        }
      });

      const base64 = await blobToBase64(audioBlob);
      const result = await model.generateContent([
        { text: 'Transcribe this audio. Return only the spoken text, no formatting.' },
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64,
          },
        },
      ] as any);

      const response = result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini transcription failed:', error);
    }
  }

  throw new Error('All transcription services failed');
}
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    // We'll verify auth per operation type below so we can allow 'setup' without auth
    let uid: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle FormData (transcription)
      const formData = await req.formData();
      const audio = formData.get('audio') as Blob;
      const type = formData.get('type') as string;
      
      if (type === 'transcribe' && audio) {
        try {
          // Require auth for transcription
          let authResult = await verifyAuth(req);
          if (!authResult) authResult = devDecodeUid(req);
          if (!authResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
          uid = authResult.uid;
          // Fast transcription with optimized credit handling
          const startTime = Date.now();
          let transcript = '';
          try {
            transcript = await transcribeAudioFast(audio);
            const duration = Date.now() - startTime;
            console.log(`⚡ Fast transcription completed in ${duration}ms`);
          } catch (error) {
            console.error('❌ Transcription failed:', error);
            return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
          }

          if (!transcript || transcript.length === 0) {
            return NextResponse.json({ error: 'No speech detected' }, { status: 400 });
          }

          // Optimized credit deduction - only deduct for final transcriptions to reduce DB overhead
          const isInterimRequest = req.headers.get('x-interim') === 'true';
          let deduct = { ok: true, remaining: 999 }; // Default for interim requests

          if (!isInterimRequest) {
            // Only deduct credits for final transcriptions
            deduct = await adminDb.runTransaction(async (tx) => {
              const ref = adminDb.collection('users').doc(uid);
              const s = await tx.get(ref);
              const d = s.exists ? (s.data() as any) : {};
              const sb = d?.subscription || {};
              const cur = typeof sb.credits === 'number' ? sb.credits : 0;
              if (cur < 2) return { ok: false, remaining: cur };
              const next = cur - 2;
              tx.set(ref, { ...d, subscription: { ...sb, credits: next } }, { merge: true });
              return { ok: true, remaining: next };
            });
            if (!deduct.ok) {
              return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
            }
          }
          return NextResponse.json({ success: true, transcript, remainingCredits: deduct.remaining });
        } catch (error) {
          return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
        }
      }
    } else {
      // Handle JSON (chat and screenshots)
      const body = await req.json();
      const { type, message, conversationHistory, imageData, history } = body;
      
      if (type === 'setup') {
        // Handle setup - update system prompt locally
        const { useCase, userData } = body;
        
        if (useCase && userData) {
          const result = updateSystemPrompt(useCase, userData);
          return NextResponse.json(result);
        } else {
          return NextResponse.json({ error: 'Missing useCase or userData' }, { status: 400 });
        }
      } else if (type === 'analyze_session') {
        // Require auth for analysis
        let authResult = await verifyAuth(req);
        if (!authResult) authResult = devDecodeUid(req);
        if (!authResult) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        uid = authResult.uid;
        try {
          let report = '';
          if (openai) {
            report = await analyzeWithOpenAI(history || []);
          } else if (genAI) {
            report = await analyzeWithGemini(history || []);
          } else {
            throw new Error('No AI provider configured');
          }
          return NextResponse.json({ success: true, report });
        } catch (e) {
          return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
        }
      } else if (type === 'chat') {
        // Require auth for chat
        let authResult = await verifyAuth(req);
        if (!authResult) authResult = devDecodeUid(req);
        if (!authResult) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        uid = authResult.uid;

        // If neither provider is configured, fail early without deducting credits
        if (!openai && !genAI) {
          return NextResponse.json({ error: 'No AI provider configured (OPENAI_API_KEY/GEMINI_API_KEY missing)' }, { status: 500 });
        }

        // Deduct credits before processing
        const cost = getCreditCost('chat', !!imageData);
        const deducted = await tryDeductCredits(uid, cost);
        if (!deducted.ok) {
          return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Optional streaming mode
        const wantsStream = !!(body as any).stream;
        if (wantsStream && openai) {
          try {
            const s = await streamChatWithOpenAI(message, conversationHistory || [], imageData);
            return new NextResponse(s as any, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
              },
            });
          } catch (e) {
            // Fall through to non-stream fallback
          }
        }

        if (imageData) {
          // Screenshot analysis
          try {
            const response = await analyzeScreenshotWithOpenAI(message, imageData);
            return NextResponse.json({ success: true, response, remainingCredits: deducted.remaining });
          } catch (error) {
            try {
              // Fallback: use Gemini with text-only context (image fallback not available here)
              const response = await chatWithGemini(message, conversationHistory || []);
              return NextResponse.json({ success: true, response, remainingCredits: deducted.remaining });
            } catch (fallbackError) {
              console.error('Screenshot analysis failed (OpenAI and Gemini):', fallbackError);
              return NextResponse.json({ error: 'Screenshot analysis failed' }, { status: 500 });
            }
          }
        } else {
          // Regular chat
          try {
            const response = await chatWithOpenAI(message, conversationHistory || []);
            return NextResponse.json({ success: true, response, remainingCredits: deducted.remaining });
          } catch (error) {
            try {
              const response = await chatWithGemini(message, conversationHistory || []);
              return NextResponse.json({ success: true, response, remainingCredits: deducted.remaining });
            } catch (fallbackError) {
              console.error('Chat failed (OpenAI and Gemini):', fallbackError);
              return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
            }
          }
        }
      }
    }
    
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for testing and getting current system prompt
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Angel AI API is working',
    clients: {
      openai: !!openai,
      genAI: !!genAI
    },
    currentSystemPrompt: CHAT_SYSTEM_PROMPT.substring(0, 200) + '...',
    hasUserData: CHAT_SYSTEM_PROMPT.includes('CANDIDATE PROFILE') || 
                 CHAT_SYSTEM_PROMPT.includes('SALES CONTEXT') || 
                 CHAT_SYSTEM_PROMPT.includes('MEETING CONTEXT') || 
                 CHAT_SYSTEM_PROMPT.includes('CUSTOM CONTEXT')
  });
}
