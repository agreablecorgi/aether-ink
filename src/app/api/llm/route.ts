import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, task, content, apiKey } = body;

        if (!apiKey) {
            return NextResponse.json({ error: 'OpenRouter API key required. Set it in Settings.' }, { status: 400 });
        }

        let systemPrompt = '';
        let userPrompt = '';

        switch (task) {
            case 'sentiment':
                systemPrompt = `You are a literary mood analyst. Analyze the emotional tone and atmosphere of the given text. Respond with ONLY a single JSON object with these fields:
          - "mood": one of "neutral", "adventure", "mystery", "romance", "horror", "comedy", "melancholy", "tension", "wonder", "fury"
          - "warmth": a number from 0 to 100 (0=coldest, 100=warmest)
          - "intensity": a number from 0 to 100
          Do not include any explanation, only the JSON.`;
                userPrompt = content;
                break;

            case 'review':
                systemPrompt = `You are a world-class literary editor and narrative architect. Your goal is to identify plot holes, suggest atmospheric sensory details, and maintain character consistency. Do not write for the user unless explicitly asked; instead, provide 'Margin Notes' and provocative questions. Be concise but insightful. Format your response in markdown.`;
                userPrompt = `Review this passage and provide editorial notes:\n\n${content}`;
                break;

            case 'grammar':
                systemPrompt = `You are a precise grammar and style editor. Analyze the text for grammatical errors, awkward phrasing, and style issues. Return a JSON array of objects, each with:
          - "text": the problematic text
          - "suggestion": the corrected version
          - "explanation": brief reason for the change
          Only return the JSON array, no other text.`;
                userPrompt = content;
                break;

            case 'chat':
                systemPrompt = `You are a world-class literary editor and narrative architect called "The Architect." Your goal is to identify plot holes, suggest atmospheric sensory details, and maintain character consistency. Do not write for the user unless explicitly asked; instead, provide insightful analysis, 'Margin Notes,' and provocative questions. Be conversational but brilliant.`;
                // messages array is used directly for chat
                break;

            default:
                systemPrompt = `You are a helpful creative writing assistant.`;
                userPrompt = content || '';
        }

        const chatMessages = task === 'chat'
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ];

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'Aether Ink',
            },
            body: JSON.stringify({
                model: body.model || 'google/gemini-2.0-flash-001',
                messages: chatMessages,
                temperature: task === 'grammar' || task === 'sentiment' ? 0.1 : 0.7,
                max_tokens: task === 'sentiment' ? 200 : 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: response.status });
        }

        const data = await response.json();
        const result = data.choices?.[0]?.message?.content || '';

        return NextResponse.json({ result });
    } catch (error) {
        console.error('LLM API error:', error);
        return NextResponse.json({ error: 'Failed to process LLM request' }, { status: 500 });
    }
}
