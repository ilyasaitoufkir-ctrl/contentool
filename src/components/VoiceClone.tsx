import { useRef, useState } from 'react';
import { cloneVoice, deleteELVoice } from '../elevenlabs';
import { deleteClonedVoice, getClonedVoices, saveClonedVoice } from '../store';
import type { ELVoice } from '../types';

interface Props {
  elApiKey: string;
  onVoiceAdded: () => void;
}

export default function VoiceClone({ elApiKey, onVoiceAdded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voices, setVoices] = useState<ELVoice[]>(getClonedVoices);
  const [deletingId, setDeletingId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleClone() {
    if (!elApiKey) { setError('Kein ElevenLabs API Key – bitte in Einstellungen eintragen'); return; }
    if (!file) { setError('Bitte eine Audio-Datei hochladen'); return; }
    if (!name.trim()) { setError('Bitte einen Namen für die Stimme eingeben'); return; }

    const durationOk = await checkAudioDuration(file);
    if (!durationOk) {
      setError('Die Audio-Datei muss mindestens 1 Minute lang sein');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await cloneVoice(name.trim(), file, elApiKey);
      const newVoice: ELVoice = { voice_id: result.voice_id, name: result.name, category: 'cloned', isCloned: true };
      saveClonedVoice(newVoice);
      setVoices(getClonedVoices());
      setSuccess(`✓ Stimme „${result.name}" wurde erfolgreich geklont!`);
      setFile(null);
      setName('');
      onVoiceAdded();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(voice: ELVoice) {
    if (!confirm(`Stimme „${voice.name}" wirklich löschen?`)) return;
    setDeletingId(voice.voice_id);
    try {
      if (elApiKey) await deleteELVoice(voice.voice_id, elApiKey);
    } catch { /* ignore API errors on delete */ }
    deleteClonedVoice(voice.voice_id);
    setVoices(getClonedVoices());
    setDeletingId('');
    onVoiceAdded();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionHead}>🎤 Neue Stimme klonen</div>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${file ? '#7c3aed' : '#252535'}`,
            borderRadius: 12,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: file ? 'rgba(124,58,237,0.05)' : '#0f0f18',
            transition: 'all 0.15s',
            marginTop: 12,
          }}
        >
          {file ? (
            <div>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎵</div>
              <div style={{ fontSize: 14, color: '#a855f7', fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: '#5a5a7a', marginTop: 4 }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB • Klick zum Ändern
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 14, color: '#9090b0', fontWeight: 600 }}>Audio-Datei hochladen</div>
              <div style={{ fontSize: 12, color: '#3a3a55', marginTop: 4 }}>
                MP3, WAV, M4A · Min. 1 Minute · Drag & Drop oder klicken
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && setFile(e.target.files[0])}
          />
        </div>

        {/* Name input */}
        <div style={{ marginTop: 12 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name der Stimme (z.B. Ilyas)"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #252535',
              background: '#0f0f18',
              color: '#e8e8f0',
              fontSize: 14,
            }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontSize: 12 }}>
            {success}
          </div>
        )}

        <button
          onClick={handleClone}
          disabled={loading || !file || !name.trim()}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: loading || !file || !name.trim() ? '#252535' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: loading || !file || !name.trim() ? '#5a5a7a' : '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading || !file || !name.trim() ? 'default' : 'pointer',
            boxShadow: loading || !file || !name.trim() ? 'none' : '0 0 16px rgba(124,58,237,0.35)',
          }}
        >
          {loading ? '⏳ Klonen läuft...' : '🎤 Stimme klonen'}
        </button>

        <p style={{ fontSize: 11, color: '#3a3a55', marginTop: 8, lineHeight: 1.5 }}>
          ElevenLabs analysiert deine Stimme und erstellt einen persönlichen Klon.
          Sprich klar und ohne Hintergrundgeräusche für beste Ergebnisse.
        </p>
      </div>

      {/* Cloned voices list */}
      {voices.length > 0 && (
        <div>
          <div style={sectionHead}>✦ Meine geklonten Stimmen ({voices.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {voices.map(v => (
              <div
                key={v.voice_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid #252535',
                  background: '#0f0f18',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>
                  🎤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0' }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: '#5a5a7a' }}>ID: {v.voice_id.slice(0, 12)}...</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600 }}>
                  KLON
                </span>
                <button
                  onClick={() => handleDelete(v)}
                  disabled={deletingId === v.voice_id}
                  style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: '1px solid #252535',
                    background: 'transparent',
                    color: deletingId === v.voice_id ? '#5a5a7a' : '#ef4444',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#9090b0',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

async function checkAudioDuration(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration >= 60);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(true); // allow upload if we can't check
    });
  });
}
