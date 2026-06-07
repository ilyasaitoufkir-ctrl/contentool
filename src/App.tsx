import { useState, useCallback } from 'react';
import Generator from './components/Generator';
import SavedPosts from './components/SavedPosts';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import { getApiKey, saveApiKey, getElApiKey, getPosts } from './store';
import type { SavedPost } from './types';

type Tab = 'generate' | 'saved' | 'calendar' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [apiKey, setApiKey] = useState(getApiKey);
  const [elApiKey, setElApiKey] = useState(getElApiKey);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(!getApiKey());
  const [posts, setPosts] = useState<SavedPost[]>(getPosts);

  const refreshPosts = useCallback(() => setPosts(getPosts()), []);

  function handleSaveApiKey() {
    const key = apiKeyInput.trim();
    if (!key.startsWith('sk-ant-')) {
      alert('Ungültiger API Key – muss mit sk-ant- beginnen');
      return;
    }
    saveApiKey(key);
    setApiKey(key);
    setShowApiSetup(false);
    setApiKeyInput('');
  }

  const savedCount = posts.length;
  const scheduledCount = posts.filter(p => p.scheduledFor).length;

  if (showApiSetup) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'radial-gradient(ellipse at top, #16082e 0%, #08080e 60%)',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          padding: 36,
          borderRadius: 16,
          border: '1px solid #252535',
          background: '#0f0f18',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚡</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginBottom: 8 }}>
              AI Content Tool
            </h1>
            <p style={{ fontSize: 14, color: '#5a5a7a', lineHeight: 1.6 }}>
              Dein persönliches Social Media Tool.<br />
              Trag deinen Anthropic API Key ein um zu starten.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9090b0', textTransform: 'uppercase' as const, letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              Anthropic API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
              placeholder="sk-ant-api03-..."
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #252535',
                background: '#16161f',
                color: '#e8e8f0',
                fontSize: 14,
              }}
            />
          </div>

          <button
            onClick={handleSaveApiKey}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(124,58,237,0.4)',
            }}
          >
            Loslegen →
          </button>

          <p style={{ fontSize: 11, color: '#3a3a55', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            Der Key wird nur lokal in deinem Browser gespeichert.<br />
            Kein Server, keine Weitergabe.
          </p>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'generate', label: '✨ Generieren' },
    { id: 'saved', label: `📂 Gespeichert${savedCount > 0 ? ` (${savedCount})` : ''}` },
    { id: 'calendar', label: `📅 Kalender${scheduledCount > 0 ? ` (${scheduledCount})` : ''}` },
    { id: 'settings', label: `⚙️ Einstellungen${!elApiKey ? ' ●' : ''}` },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#08080e' }}>
      {/* Header */}
      <header style={{
        padding: '0 24px',
        borderBottom: '1px solid #16161f',
        background: 'rgba(8,8,14,0.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#e8e8f0' }}>AI Content</span>
        </div>

        <nav style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: tab === t.id ? '#a855f7' : t.id === 'settings' && !elApiKey ? '#f59e0b' : '#5a5a7a',
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ElevenLabs hint banner */}
      {!elApiKey && tab !== 'settings' && (
        <div
          onClick={() => setTab('settings')}
          style={{
            background: 'rgba(245,158,11,0.08)',
            borderBottom: '1px solid rgba(245,158,11,0.2)',
            padding: '8px 24px',
            fontSize: 12,
            color: '#f59e0b',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          🎙️ ElevenLabs API Key fehlt – klick hier um Text-to-Speech freizuschalten →
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {tab === 'generate' && (
          <Generator apiKey={apiKey} elApiKey={elApiKey} onPostSaved={refreshPosts} />
        )}
        {tab === 'saved' && (
          <SavedPosts posts={posts} onChange={refreshPosts} />
        )}
        {tab === 'calendar' && (
          <Calendar posts={posts} onChange={refreshPosts} />
        )}
        {tab === 'settings' && (
          <Settings
            onElApiKeyChange={setElApiKey}
            onAnthropicKeyChange={setApiKey}
          />
        )}
      </main>
    </div>
  );
}
