import { useState } from 'react';
import type { SavedPost } from '../types';
import { deletePost, updatePostSchedule } from '../store';

interface Props {
  posts: SavedPost[];
  onChange: () => void;
}

const CHANNEL_COLORS: Record<string, string> = {
  tiktok: '#ff2d55',
  instagram: '#e1306c',
  linkedin: '#0a66c2',
};

const CHANNEL_EMOJI: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  linkedin: '💼',
};

const TONE_LABELS: Record<string, string> = {
  emotional: 'Emotional',
  professional: 'Professionell',
  casual: 'Locker',
  controversial: 'Kontrovers',
};

export default function SavedPosts({ posts, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [copied, setCopied] = useState('');

  function handleDelete(id: string) {
    if (confirm('Post wirklich löschen?')) {
      deletePost(id);
      onChange();
    }
  }

  function handleSchedule(id: string) {
    if (!dateInput) return;
    updatePostSchedule(id, dateInput);
    setScheduling(null);
    setDateInput('');
    onChange();
  }

  function copyPost(post: SavedPost) {
    const text = [
      post.content.hook,
      '',
      post.content.main,
      '',
      post.content.cta,
      '',
      post.content.hashtags.map(h => `#${h}`).join(' '),
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(post.id);
    setTimeout(() => setCopied(''), 2000);
  }

  if (posts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3a3a55' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Noch keine gespeicherten Posts</div>
        <div style={{ fontSize: 13 }}>Generiere Content und klick auf „Speichern"</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, color: '#5a5a7a', marginBottom: 4 }}>
        {posts.length} gespeicherte{posts.length === 1 ? 'r Post' : ' Posts'}
      </div>

      {posts.map(post => {
        const isOpen = expanded === post.id;
        const color = CHANNEL_COLORS[post.input.channel] ?? '#7c3aed';
        const isScheduling = scheduling === post.id;

        return (
          <div
            key={post.id}
            style={{
              borderRadius: 12,
              border: `1px solid ${isOpen ? '#2a2a38' : '#1e1e28'}`,
              background: '#0f0f18',
              overflow: 'hidden',
              transition: 'all 0.15s',
            }}
          >
            {/* Header */}
            <div
              onClick={() => setExpanded(isOpen ? null : post.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {CHANNEL_EMOJI[post.input.channel]}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.input.topic}
                </div>
                <div style={{ fontSize: 12, color: '#5a5a7a', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color }}>{post.input.channel.charAt(0).toUpperCase() + post.input.channel.slice(1)}</span>
                  <span>•</span>
                  <span>{TONE_LABELS[post.input.tone]}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</span>
                  {post.scheduledFor && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#f59e0b' }}>📅 {new Date(post.scheduledFor).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}</span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <SmallBtn onClick={e => { e.stopPropagation(); copyPost(post); }} active={copied === post.id}>
                  {copied === post.id ? '✓' : '📋'}
                </SmallBtn>
                <SmallBtn onClick={e => { e.stopPropagation(); setScheduling(isScheduling ? null : post.id); }}>
                  📅
                </SmallBtn>
                <SmallBtn onClick={e => { e.stopPropagation(); handleDelete(post.id); }} danger>
                  🗑
                </SmallBtn>
              </div>

              <div style={{ color: '#3a3a55', fontSize: 12 }}>{isOpen ? '▲' : '▼'}</div>
            </div>

            {/* Schedule picker */}
            {isScheduling && (
              <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #252535', background: '#16161f',
                    color: '#e8e8f0', fontSize: 13,
                  }}
                />
                <button
                  onClick={() => handleSchedule(post.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: 'none',
                    background: 'rgba(124,58,237,0.2)', color: '#a855f7',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Planen
                </button>
              </div>
            )}

            {/* Expanded content */}
            {isOpen && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #16161f' }}>
                <Block label="🎣 Hook" text={post.content.hook} borderColor={color} />
                <Block label="📝 Hauptteil" text={post.content.main} borderColor="#7c3aed" />
                <Block label="📣 CTA" text={post.content.cta} borderColor="#10b981" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                  {post.content.hashtags.map(h => (
                    <span key={h} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(124,58,237,0.1)', color: '#a855f7', fontSize: 12 }}>
                      #{h}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#f59e0b' }}>⏰ {post.content.bestTime}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Block({ label, text, borderColor }: { label: string; text: string; borderColor: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: '#16161f', borderLeft: `3px solid ${borderColor}` }}>
      <div style={{ fontSize: 11, color: '#5a5a7a', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <p style={{ fontSize: 13, color: '#c0c0d8', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{text}</p>
    </div>
  );
}

function SmallBtn({ children, onClick, active, danger }: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 6,
        border: '1px solid #252535',
        background: active ? 'rgba(16,185,129,0.1)' : danger ? 'transparent' : 'transparent',
        color: active ? '#10b981' : danger ? '#ef4444' : '#5a5a7a',
        fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
