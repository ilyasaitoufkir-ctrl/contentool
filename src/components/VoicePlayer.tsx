import { useEffect, useRef, useState } from 'react';
import type { ELVoice } from '../types';
import { textToSpeech, DEFAULT_VOICES } from '../elevenlabs';
import { getClonedVoices } from '../store';

interface Props {
  text: string;
  elApiKey: string;
}

const BAR_COUNT = 28;

export default function VoicePlayer({ text, elApiKey }: Props) {
  const [voices, setVoices] = useState<ELVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevUrlRef = useRef('');

  useEffect(() => {
    const cloned = getClonedVoices();
    const all = [...cloned, ...DEFAULT_VOICES];
    setVoices(all);
    setSelectedVoiceId(all[0]?.voice_id ?? '');
  }, []);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onDur = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioUrl]);

  async function handleGenerate() {
    if (!elApiKey) { setError('Kein ElevenLabs API Key – bitte in Einstellungen eintragen'); return; }
    if (!selectedVoiceId) { setError('Bitte eine Stimme auswählen'); return; }

    setLoading(true);
    setError('');
    setAudioUrl('');
    setPlaying(false);
    setProgress(0);

    try {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
      const url = await textToSpeech(text, selectedVoiceId, elApiKey);
      prevUrlRef.current = url;
      setAudioUrl(url);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  }

  function handleDownload() {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'audio-content.mp3';
    a.click();
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const selectedVoice = voices.find(v => v.voice_id === selectedVoiceId);

  return (
    <div style={{
      borderRadius: 12,
      border: '1px solid #252535',
      background: 'linear-gradient(135deg, #0f0f18 0%, #16101f 100%)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🎙️</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f0' }}>Als Audio generieren</span>
        {!elApiKey && (
          <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 'auto' }}>⚠️ EL Key fehlt</span>
        )}
      </div>

      {/* Voice selector + generate */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <select
            value={selectedVoiceId}
            onChange={e => setSelectedVoiceId(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 10px',
              borderRadius: 8,
              border: '1px solid #252535',
              background: '#16161f',
              color: '#e8e8f0',
              fontSize: 13,
              appearance: 'none',
              cursor: 'pointer',
            }}
          >
            {voices.filter(v => v.isCloned).length > 0 && (
              <optgroup label="🎤 Meine Stimmen">
                {voices.filter(v => v.isCloned).map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
                ))}
              </optgroup>
            )}
            <optgroup label="🎵 Standard Stimmen">
              {voices.filter(v => !v.isCloned).map(v => (
                <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
              ))}
            </optgroup>
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5a5a7a', fontSize: 10 }}>▼</span>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !elApiKey}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#252535' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading || !elApiKey ? 'default' : 'pointer',
            opacity: !elApiKey ? 0.4 : 1,
            whiteSpace: 'nowrap',
            boxShadow: loading || !elApiKey ? 'none' : '0 0 12px rgba(124,58,237,0.3)',
          }}
        >
          {loading ? '⏳ Lädt...' : '▶ Generieren'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div style={{
          borderRadius: 10,
          border: '1px solid #2a1a3e',
          background: 'rgba(124,58,237,0.06)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {/* Waveform */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 40 }}>
            {Array.from({ length: BAR_COUNT }, (_, i) => {
              const seed = ((i * 7 + 3) % 17) / 17;
              const baseH = 8 + seed * 24;
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: playing ? undefined : baseH,
                    borderRadius: 2,
                    background: playing ? '#a855f7' : '#3a1a5e',
                    animation: playing ? `wave-${i % 5} 0.${6 + (i % 4)}s ease-in-out infinite alternate` : 'none',
                    minHeight: playing ? 4 : undefined,
                    transition: 'background 0.3s',
                  }}
                />
              );
            })}
          </div>

          {/* Seek bar */}
          <div
            onClick={handleSeek}
            style={{ height: 4, borderRadius: 2, background: '#252535', cursor: 'pointer', position: 'relative' }}
          >
            <div style={{
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              width: duration > 0 ? `${(progress / duration) * 100}%` : '0%',
              transition: 'width 0.1s linear',
            }} />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={togglePlay}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(124,58,237,0.4)',
                flexShrink: 0,
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>

            <span style={{ fontSize: 11, color: '#5a5a7a', flexShrink: 0 }}>
              {fmt(progress)} / {fmt(duration)}
            </span>

            <span style={{ fontSize: 12, color: '#7c3aed', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedVoice?.name ?? ''}
              {selectedVoice?.isCloned && <span style={{ marginLeft: 6, fontSize: 10, color: '#f59e0b' }}>✦ KLON</span>}
            </span>

            <button
              onClick={handleDownload}
              title="MP3 herunterladen"
              style={{
                padding: '6px 12px', borderRadius: 7,
                border: '1px solid #252535',
                background: 'transparent',
                color: '#9090b0',
                fontSize: 12,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ↓ MP3
            </button>
          </div>
        </div>
      )}

      {/* hidden audio */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      <style>{`
        @keyframes wave-0 { from { height: 6px } to { height: 32px } }
        @keyframes wave-1 { from { height: 10px } to { height: 26px } }
        @keyframes wave-2 { from { height: 4px } to { height: 36px } }
        @keyframes wave-3 { from { height: 8px } to { height: 28px } }
        @keyframes wave-4 { from { height: 12px } to { height: 22px } }
      `}</style>
    </div>
  );
}
