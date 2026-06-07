import { useState } from 'react';
import type { Channel, GenerateInput, GeneratedPost, Niche, Tone } from '../types';
import { generateContent } from '../api';
import { createId, savePost } from '../store';
import type { SavedPost } from '../types';
import VoicePlayer from './VoicePlayer';

interface Props {
  apiKey: string;
  elApiKey: string;
  onPostSaved: () => void;
}

const CHANNELS: { id: Channel; label: string; emoji: string; color: string }[] = [
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#ff2d55' },
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: '#e1306c' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼', color: '#0a66c2' },
];

const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: 'emotional', label: 'Emotional', desc: 'Bewegend & persönlich' },
  { id: 'professional', label: 'Professionell', desc: 'Seriös & kompetent' },
  { id: 'casual', label: 'Locker', desc: 'Authentisch & nahbar' },
  { id: 'controversial', label: 'Kontrovers', desc: 'Provokativ & mutig' },
];

const NICHES: { id: Niche; label: string; emoji: string; examples: string[] }[] = [
  { id: 'football', label: 'Fußball', emoji: '⚽', examples: ['Ronaldo vs. Messi', 'WM 2002', 'Wembley-Tor'] },
  { id: 'fitness', label: 'Fitness & Ernährung', emoji: '💪', examples: ['Kalorien tracken', 'Muskelaufbau', 'Meal Prep'] },
  { id: 'business', label: 'Business & Apps', emoji: '🚀', examples: ['Side Hustle', 'App bauen', 'Produktivität'] },
];

const AUDIENCE_PRESETS = ['18–25 Jährige', 'Fußballfans', 'Fitness Anfänger', 'Unternehmer', 'Studenten', 'Eltern'];

export default function Generator({ apiKey, elApiKey, onPostSaved }: Props) {
  const [topic, setTopic] = useState('');
  const [channel, setChannel] = useState<Channel>('tiktok');
  const [tone, setTone] = useState<Tone>('casual');
  const [audience, setAudience] = useState('');
  const [niche, setNiche] = useState<Niche | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GeneratedPost | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState('');

  async function handleGenerate() {
    if (!topic.trim()) { setError('Bitte ein Thema eingeben'); return; }
    if (!audience.trim()) { setError('Bitte eine Zielgruppe eingeben'); return; }
    if (!apiKey) { setError('API Key fehlt – bitte oben eintragen'); return; }

    setLoading(true);
    setError('');
    setResult(null);
    setSaved(false);

    try {
      const input: GenerateInput = { topic, channel, tone, audience, niche };
      const generated = await generateContent(input, apiKey);
      setResult(generated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!result) return;
    const post: SavedPost = {
      id: createId(),
      createdAt: new Date().toISOString(),
      input: { topic, channel, tone, audience, niche },
      content: result,
    };
    savePost(post);
    setSaved(true);
    onPostSaved();
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  function handleCopyAll() {
    if (!result) return;
    const full = [
      result.hook,
      '',
      result.main,
      '',
      result.cta,
      '',
      result.hashtags.map(h => `#${h}`).join(' '),
    ].join('\n');
    handleCopy(full, 'all');
  }

  const channelColor = CHANNELS.find(c => c.id === channel)?.color ?? '#7c3aed';

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* LEFT: Form */}
      <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Niche quick-pick */}
        <div>
          <Label>Deine Nische</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {NICHES.map(n => (
              <button
                key={n.id}
                onClick={() => {
                  setNiche(niche === n.id ? undefined : n.id);
                  if (niche !== n.id && !topic) setTopic(n.examples[0]);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${niche === n.id ? '#7c3aed' : '#252535'}`,
                  background: niche === n.id ? 'rgba(124,58,237,0.15)' : '#0f0f18',
                  color: niche === n.id ? '#a855f7' : '#9090b0',
                  fontSize: 13,
                  fontWeight: niche === n.id ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {n.emoji} {n.label}
              </button>
            ))}
          </div>
          {niche && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NICHES.find(n => n.id === niche)?.examples.map(ex => (
                <button
                  key={ex}
                  onClick={() => setTopic(ex)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid #252535',
                    background: topic === ex ? 'rgba(124,58,237,0.1)' : 'transparent',
                    color: topic === ex ? '#a855f7' : '#5a5a7a',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Topic */}
        <div>
          <Label>Thema *</Label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="z.B. Ronaldo kehrt zu Manchester United zurück"
            rows={2}
            style={textareaStyle}
          />
        </div>

        {/* Channel */}
        <div>
          <Label>Kanal</Label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {CHANNELS.map(c => (
              <button
                key={c.id}
                onClick={() => setChannel(c.id)}
                style={{
                  flex: 1,
                  padding: '10px 8px',
                  borderRadius: 8,
                  border: `1px solid ${channel === c.id ? c.color : '#252535'}`,
                  background: channel === c.id ? `${c.color}22` : '#0f0f18',
                  color: channel === c.id ? c.color : '#9090b0',
                  fontSize: 13,
                  fontWeight: channel === c.id ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div>
          <Label>Tonalität</Label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {TONES.map(t => (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${tone === t.id ? '#7c3aed' : '#252535'}`,
                  background: tone === t.id ? 'rgba(124,58,237,0.12)' : '#0f0f18',
                  color: tone === t.id ? '#a855f7' : '#9090b0',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Audience */}
        <div>
          <Label>Zielgruppe *</Label>
          <input
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="z.B. Fußballfans zwischen 20–35"
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {AUDIENCE_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setAudience(p)}
                style={{
                  padding: '3px 9px',
                  borderRadius: 6,
                  border: '1px solid #252535',
                  background: audience === p ? 'rgba(124,58,237,0.1)' : 'transparent',
                  color: audience === p ? '#a855f7' : '#5a5a7a',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            padding: '14px',
            borderRadius: 10,
            border: 'none',
            background: loading ? '#252535' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.3,
            boxShadow: loading ? 'none' : '0 0 24px rgba(124,58,237,0.4)',
            transition: 'all 0.2s',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '✨ KI generiert...' : '⚡ Content generieren'}
        </button>
      </div>

      {/* RIGHT: Result */}
      <div style={{ flex: '1 1 340px' }}>
        {loading && <LoadingSkeleton />}

        {!loading && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#9090b0' }}>
                {CHANNELS.find(c => c.id === channel)?.emoji} {CHANNELS.find(c => c.id === channel)?.label} • {TONES.find(t => t.id === tone)?.label}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <CopyButton onClick={handleCopyAll} copied={copied === 'all'} label="Alles kopieren" />
                <button
                  onClick={handleSave}
                  disabled={saved}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 7,
                    border: 'none',
                    background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.2)',
                    color: saved ? '#10b981' : '#a855f7',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: saved ? 'default' : 'pointer',
                  }}
                >
                  {saved ? '✓ Gespeichert' : '💾 Speichern'}
                </button>
              </div>
            </div>

            <ResultBlock
              label="🎣 Hook (erste 3 Sek.)"
              color={channelColor}
              text={result.hook}
              onCopy={() => handleCopy(result.hook, 'hook')}
              copied={copied === 'hook'}
            />
            <ResultBlock
              label="📝 Hauptteil"
              color="#7c3aed"
              text={result.main}
              onCopy={() => handleCopy(result.main, 'main')}
              copied={copied === 'main'}
            />
            <ResultBlock
              label="📣 Call-to-Action"
              color="#10b981"
              text={result.cta}
              onCopy={() => handleCopy(result.cta, 'cta')}
              copied={copied === 'cta'}
            />

            <div style={blockStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#9090b0', fontWeight: 600 }}>#️⃣ Hashtags</span>
                <CopyButton
                  onClick={() => handleCopy(result.hashtags.map(h => `#${h}`).join(' '), 'tags')}
                  copied={copied === 'tags'}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.hashtags.map(h => (
                  <span
                    key={h}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: 'rgba(124,58,237,0.12)',
                      color: '#a855f7',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    #{h}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ ...blockStyle, flex: 1 }}>
                <div style={{ fontSize: 12, color: '#9090b0', fontWeight: 600, marginBottom: 4 }}>⏰ Beste Postingzeit</div>
                <div style={{ fontSize: 13, color: '#f59e0b' }}>{result.bestTime}</div>
              </div>
              {result.explanation && (
                <div style={{ ...blockStyle, flex: 2 }}>
                  <div style={{ fontSize: 12, color: '#9090b0', fontWeight: 600, marginBottom: 4 }}>💡 Warum dieser Hook?</div>
                  <div style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.5 }}>{result.explanation}</div>
                </div>
              )}
            </div>

            <VoicePlayer
              text={[result.hook, result.main, result.cta].join('\n\n')}
              elApiKey={elApiKey}
            />
          </div>
        )}

        {!loading && !result && (
          <div style={{
            border: '2px dashed #252535',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            color: '#3a3a55',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Bereit zum Generieren</div>
            <div style={{ fontSize: 13 }}>Füll das Formular aus und klick auf<br />„Content generieren"</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 600, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #252535',
  background: '#0f0f18',
  color: '#e8e8f0',
  fontSize: 14,
  marginTop: 6,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
  marginTop: 6,
};

const blockStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid #252535',
  background: '#0f0f18',
};

function ResultBlock({ label, color, text, onCopy, copied }: {
  label: string; color: string; text: string;
  onCopy: () => void; copied: boolean;
}) {
  return (
    <div style={{ ...blockStyle, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: '#9090b0', fontWeight: 600 }}>{label}</span>
        <CopyButton onClick={onCopy} copied={copied} />
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: '#e8e8f0', whiteSpace: 'pre-wrap' }}>{text}</p>
    </div>
  );
}

function CopyButton({ onClick, copied, label }: { onClick: () => void; copied: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid #252535',
        background: copied ? 'rgba(16,185,129,0.1)' : 'transparent',
        color: copied ? '#10b981' : '#5a5a7a',
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {copied ? '✓ Kopiert' : (label ?? '📋 Kopieren')}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[80, 160, 60, 50].map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: 10,
            background: 'linear-gradient(90deg, #16161f 25%, #1e1e2a 50%, #16161f 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}
