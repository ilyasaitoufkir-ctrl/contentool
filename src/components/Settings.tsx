import { useState } from 'react';
import { getElApiKey, saveElApiKey, getApiKey, saveApiKey } from '../store';
import VoiceClone from './VoiceClone';

interface Props {
  onElApiKeyChange: (key: string) => void;
  onAnthropicKeyChange: (key: string) => void;
}

export default function Settings({ onElApiKeyChange, onAnthropicKeyChange }: Props) {
  const [elKey, setElKey] = useState(getElApiKey);
  const [elInput, setElInput] = useState('');
  const [elSaved, setElSaved] = useState(false);
  const [elError, setElError] = useState('');

  const [antKey, setAntKey] = useState(getApiKey);
  const [antInput, setAntInput] = useState('');
  const [antSaved, setAntSaved] = useState(false);
  const [antError, setAntError] = useState('');

  const [voiceRefresh, setVoiceRefresh] = useState(0);

  function handleSaveElKey() {
    const key = elInput.trim();
    if (!key) { setElError('Bitte einen API Key eingeben'); return; }
    saveElApiKey(key);
    setElKey(key);
    setElInput('');
    setElSaved(true);
    setElError('');
    onElApiKeyChange(key);
    setTimeout(() => setElSaved(false), 3000);
  }

  function handleSaveAntKey() {
    const key = antInput.trim();
    if (!key.startsWith('sk-ant-')) { setAntError('Muss mit sk-ant- beginnen'); return; }
    saveApiKey(key);
    setAntKey(key);
    setAntInput('');
    setAntSaved(true);
    setAntError('');
    onAnthropicKeyChange(key);
    setTimeout(() => setAntSaved(false), 3000);
  }

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ElevenLabs Section */}
      <Section
        icon="🎙️"
        title="ElevenLabs"
        subtitle="Text-to-Speech & Stimmen-Klon"
        accentColor="#f59e0b"
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              value={elInput}
              onChange={e => { setElInput(e.target.value); setElError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveElKey()}
              placeholder={elKey ? '••••••••••••••••••••' : 'Deinen ElevenLabs Key eingeben'}
              style={inputStyle}
            />
          </div>
          <button onClick={handleSaveElKey} style={saveBtn(elSaved)}>
            {elSaved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>

        {elError && <ErrorMsg>{elError}</ErrorMsg>}

        {elKey && (
          <StatusBadge color="#10b981">✓ ElevenLabs Key hinterlegt</StatusBadge>
        )}

        <a
          href="https://elevenlabs.io"
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 12, color: '#5a5a7a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          🔗 elevenlabs.io → API Key erstellen
        </a>
      </Section>

      {/* Voice Cloning Section */}
      <Section
        icon="🎤"
        title="Stimme klonen"
        subtitle="Eigene Stimme für alle generierten Scripts"
        accentColor="#a855f7"
      >
        <VoiceClone
          elApiKey={elKey}
          onVoiceAdded={() => setVoiceRefresh(v => v + 1)}
          key={voiceRefresh}
        />
      </Section>

      {/* Anthropic Section */}
      <Section
        icon="⚡"
        title="Anthropic Claude"
        subtitle="Content-Generierung"
        accentColor="#7c3aed"
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>API Key</label>
            <input
              type="password"
              value={antInput}
              onChange={e => { setAntInput(e.target.value); setAntError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSaveAntKey()}
              placeholder={antKey ? '••••••••••••••••••••' : 'sk-ant-api03-...'}
              style={inputStyle}
            />
          </div>
          <button onClick={handleSaveAntKey} style={saveBtn(antSaved)}>
            {antSaved ? '✓ Gespeichert' : 'Speichern'}
          </button>
        </div>
        {antError && <ErrorMsg>{antError}</ErrorMsg>}
        {antKey && <StatusBadge color="#10b981">✓ Anthropic Key hinterlegt</StatusBadge>}
      </Section>

      {/* Info */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: '#0f0f18', border: '1px solid #1e1e2a' }}>
        <div style={{ fontSize: 12, color: '#5a5a7a', lineHeight: 1.7 }}>
          🔒 Alle API Keys werden ausschließlich lokal in deinem Browser gespeichert.<br />
          Sie werden niemals an externe Server übertragen – nur direkt an die jeweiligen APIs.
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, subtitle, accentColor, children }: {
  icon: string; title: string; subtitle: string; accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid #252535',
      background: '#0d0d16',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #16161f',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: `linear-gradient(135deg, ${accentColor}08, transparent)`,
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e8e8f0' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#5a5a7a' }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '7px 11px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12 }}>
      {children}
    </div>
  );
}

function StatusBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{ fontSize: 12, color, display: 'flex', alignItems: 'center', gap: 4 }}>{children}</div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#9090b0',
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  display: 'block',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #252535',
  background: '#16161f',
  color: '#e8e8f0',
  fontSize: 13,
};

const saveBtn = (saved: boolean): React.CSSProperties => ({
  padding: '9px 16px',
  borderRadius: 8,
  border: 'none',
  background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.2)',
  color: saved ? '#10b981' : '#a855f7',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});
