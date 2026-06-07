export type Channel = 'tiktok' | 'instagram' | 'linkedin';
export type Tone = 'emotional' | 'professional' | 'casual' | 'controversial';
export type Niche = 'football' | 'fitness' | 'business';

export interface GenerateInput {
  topic: string;
  channel: Channel;
  tone: Tone;
  audience: string;
  niche?: Niche;
}

export interface GeneratedPost {
  hook: string;
  main: string;
  cta: string;
  hashtags: string[];
  bestTime: string;
  explanation?: string;
}

export interface SavedPost {
  id: string;
  createdAt: string;
  scheduledFor?: string;
  input: GenerateInput;
  content: GeneratedPost;
}
