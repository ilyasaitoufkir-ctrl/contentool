import type { ELVoice } from './types';

const BASE = 'https://api.elevenlabs.io/v1';

export const DEFAULT_VOICES: ELVoice[] = [
  { voice_id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', category: 'premade' },
  { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', category: 'premade' },
  { voice_id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', category: 'premade' },
  { voice_id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'premade' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', category: 'premade' },
];

export async function fetchVoices(apiKey: string): Promise<ELVoice[]> {
  const res = await fetch(`${BASE}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs Fehler ${res.status}`);
  const data = await res.json() as { voices: ELVoice[] };
  return data.voices;
}

export async function textToSpeech(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new Error(err.detail?.message ?? `ElevenLabs Fehler ${res.status}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function cloneVoice(
  name: string,
  file: File,
  apiKey: string
): Promise<{ voice_id: string; name: string }> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('files', file);
  formData.append('description', 'Geklonte Stimme via AI Content Tool');

  const res = await fetch(`${BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new Error(err.detail?.message ?? `Klon fehlgeschlagen: ${res.status}`);
  }
  const data = await res.json() as { voice_id: string };
  return { voice_id: data.voice_id, name };
}

export async function deleteELVoice(voiceId: string, apiKey: string): Promise<void> {
  await fetch(`${BASE}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: { 'xi-api-key': apiKey },
  });
}
