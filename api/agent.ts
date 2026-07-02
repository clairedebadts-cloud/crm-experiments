import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert email/push/SMS campaign analyst. Given campaign metrics and a detected issue, generate a specific, actionable recommendation.

You MUST respond with valid JSON (no markdown fences) matching this schema:
{
  "recommendationTitle": "string — concise title (under 80 chars)",
  "recommendationText": "string — 2-4 sentence actionable recommendation referencing specific metrics",
  "citedMetrics": ["array of metric keys you referenced, from: openRate, ctr, bounceRate, deliveryRate, unsubscribeRate"],
  "toolCallRequested": false
}

Rules:
- Only cite metrics that were provided in the input context
- Never include PII (emails, phone numbers, names) in your response
- Be specific: reference actual metric values when making recommendations
- Keep recommendationText under 1500 characters
- toolCallRequested must always be false`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { context, model } = req.body;
  if (!context || !model) {
    return res.status(400).json({ error: 'Missing context or model in request body' });
  }

  const modelId = model === 'haiku' ? 'claude-haiku-4-5-20250901' : 'claude-sonnet-4-20250514';

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: modelId,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Campaign context:\n${JSON.stringify(context, null, 2)}\n\nGenerate a recommendation for the issue: "${context.issueTitle}" (severity: ${context.severity})`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return res.status(500).json({ error: 'No text response from model' });
    }

    let raw = textBlock.text.trim();

    // Strip markdown code fences if present
    if (raw.startsWith('```')) {
      raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(raw);

    // Validate required fields
    if (
      !parsed.recommendationTitle ||
      !parsed.recommendationText ||
      !Array.isArray(parsed.citedMetrics)
    ) {
      return res.status(500).json({ error: 'Invalid response structure from model' });
    }

    return res.status(200).json({
      recommendationTitle: parsed.recommendationTitle,
      recommendationText: parsed.recommendationText,
      citedMetrics: parsed.citedMetrics,
      toolCallRequested: parsed.toolCallRequested ?? false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Agent API error:', message);
    return res.status(500).json({ error: message });
  }
}
