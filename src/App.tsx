import { useState, useCallback } from 'react';
import Generator from './components/Generator';
import SavedPosts from './components/SavedPosts';
import Calendar from './components/Calendar';
import { getApiKey, saveApiKey, getPosts } from './store';
import type { SavedPost } from './types';

type Tab = 'generate' | 'saved' | 'calendar';

export default function App() {
  const [tab, setTab] = useState<Tab>('generate');
  const [apiKey, setApiKey] = useState(getApiKey);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiSetup, setShowApiSetup] = useState(!getApiKey());
  const [posts, setPosts] = useState<SavedPost[]>(getPosts);

  const refreshPosts = useCallback(() => {
    setPosts(getPosts());
  }, []);

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
          maxWidth: 420,
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
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#08080e' }}>
      {/* Header */}
      <header style={{
        padding: '0 24px',
        borderBottom: '1px solid #16161f',
        background: 'rgba(8,8,14,0.9)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 60,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#e8e8f0' }}>AI Content</span>
        </div>

        {/* Tabs */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {([
            { id: 'generate', label: '✨ Generieren' },
            { id: 'saved', label: `📂 Gespeichert${savedCount > 0 ? ` (${savedCount})` : ''}` },
            { id: 'calendar', label: `📅 Kalender${scheduledCount > 0 ? ` (${scheduledCount})` : ''}` },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: tab === t.id ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: tab === t.id ? '#a855f7' : '#5a5a7a',
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* API key button */}
        <button
          onClick={() => setShowApiSetup(true)}
          title="API Key ändern"
          style={{
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid #252535',
            background: 'transparent',
            color: '#3a3a55',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          🔑 API Key
        </button>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1100, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {tab === 'generate' && (
          <Generator apiKey={apiKey} onPostSaved={refreshPosts} />
        )}
        {tab === 'saved' && (
          <SavedPosts posts={posts} onChange={refreshPosts} />
        )}
        {tab === 'calendar' && (
          <Calendar posts={posts} onChange={refreshPosts} />
        )}
      </main>
    </div>
  );
}
