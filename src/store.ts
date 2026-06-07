import type { SavedPost } from './types';

const POSTS_KEY = 'sm_saved_posts';
const APIKEY_KEY = 'sm_api_key';

export function getApiKey(): string {
  return localStorage.getItem(APIKEY_KEY) ?? '';
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
