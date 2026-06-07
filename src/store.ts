import type { ELVoice, SavedPost } from './types';

const POSTS_KEY = 'sm_saved_posts';
const APIKEY_KEY = 'sm_api_key';
const EL_APIKEY_KEY = 'sm_el_api_key';
const CLONED_VOICES_KEY = 'sm_cloned_voices';

export function getApiKey(): string {
  return localStorage.getItem(APIKEY_KEY) || import.meta.env.VITE_ANTHROPIC_KEY || '';
}

export function saveApiKey(key: string): void {
  localStorage.setItem(APIKEY_KEY, key);
}

export function getPosts(): SavedPost[] {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) ?? '[]') as SavedPost[];
  } catch {
    return [];
  }
}

export function savePost(post: SavedPost): void {
  const posts = getPosts();
  posts.unshift(post);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function updatePostSchedule(id: string, scheduledFor: string): void {
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx !== -1) {
    posts[idx].scheduledFor = scheduledFor;
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  }
}

export function deletePost(id: string): void {
  const posts = getPosts().filter(p => p.id !== id);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function getElApiKey(): string {
  return localStorage.getItem(EL_APIKEY_KEY) || import.meta.env.VITE_EL_KEY || '';
}

export function saveElApiKey(key: string): void {
  localStorage.setItem(EL_APIKEY_KEY, key);
}

export function getClonedVoices(): ELVoice[] {
  try {
    return JSON.parse(localStorage.getItem(CLONED_VOICES_KEY) ?? '[]') as ELVoice[];
  } catch {
    return [];
  }
}

export function saveClonedVoice(voice: ELVoice): void {
  const voices = getClonedVoices();
  voices.unshift({ ...voice, isCloned: true });
  localStorage.setItem(CLONED_VOICES_KEY, JSON.stringify(voices));
}

export function deleteClonedVoice(voiceId: string): void {
  const voices = getClonedVoices().filter(v => v.voice_id !== voiceId);
  localStorage.setItem(CLONED_VOICES_KEY, JSON.stringify(voices));
}
