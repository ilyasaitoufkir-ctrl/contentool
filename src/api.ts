import type { GenerateInput, GeneratedPost } from './types';

const CHANNEL_LABELS: Record<string, string> = {
  tiktok: 'TikTok (kurze Videos, 15–60 Sek.)',
  instagram: 'Instagram (Reels & Captions)',
  linkedin: 'LinkedIn (professionelles Netzwerk)',
};

const TONE_LABELS: Record<string, string> = {
  emotional: 'emotional & bewegend',
  professional: 'professionell & seriös',
  casual: 'locker & authentisch',
  controversial: 'kontrovers & provokativ',
};

const NICHE_CONTEXT: Record<string, string> = {
  football: 'Fußball-Nostalgie & Legenden (90er/2000er)',
  fitness: 'Fitness, Ernährung & Gesundheit',
  business: 'Business, Apps & Entrepreneurship',
};

export async function generateContent(input: GenerateInput, apiKey: string): Promise<GeneratedPost> {
  const nicheInfo = input.niche ? `\nNische: ${NICHE_CONTEXT[input.niche]}` : '';

  const prompt = `Du bist ein viraler Social Media Content Creator. Erstelle einen ${CHANNEL_LABELS[input.channel]} Post.

Thema: ${input.topic}
Tonalität: ${TONE_LABELS[input.tone]}
Zielgruppe: ${input.audience}${nicheInfo}

Antworte NUR mit einem validen JSON-Objekt in diesem Format (kein Markdown, keine Erklärung außerhalb):
{
  "hook": "Die ersten 1-3 Sätze / ersten 3 Sekunden – muss sofort fesseln",
  "main": "Hauptteil des Posts (passend zur Plattform, max. 300 Wörter)",
  "cta": "Call-to-Action am Ende",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "bestTime": "z.B. Dienstag–Donnerstag, 18–20 Uhr",
  "explanation": "1 Satz warum dieser Hook funktioniert"
}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API Fehler ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content[0]?.text ?? '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Ungültige Antwort von der KI');

  return JSON.parse(jsonMatch[0]) as GeneratedPost;
}
