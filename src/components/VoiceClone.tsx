import { useEffect, useRef, useState } from 'react';
import { cloneVoice, deleteELVoice } from '../elevenlabs';
import { deleteClonedVoice, getClonedVoices, saveClonedVoice } from '../store';
import type { ELVoice } from '../types';

interface Props {
  elApiKey: string;
  onVoiceAdded: () => void;
}

type InputMode = 'upload' | 'record';
type RecordState = 'idle' | 'recording' | 'recorded';

const BAR_COUNT = 32;

export default function VoiceClone({ elApiKey, onVoiceAdded }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [voices, setVoices] = useState<ELVoice[]>(getClonedVoices);
  const [deletingId, setDeletingId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Recording state
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function startRecording() {
    setError('');
    setRecordedBlob(null);
    setRecordedUrl('');
    setRecordSeconds(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Web Audio analyser for waveform
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = BAR_COUNT * 2;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      // Start waveform animation
      const dataArr = new Uint8Array(analyser.frequencyBinCount);
      function drawBars() {
        analyser.getByteFrequencyData(dataArr);
        const newBars = Array.from({ length: BAR_COUNT }, (_, i) => {
          const val = dataArr[i] ?? 0;
          return Math.max(4, Math.round((val / 255) * 48));
        });
        setBars(newBars);
        rafRef.current = requestAnimationFrame(drawBars);
      }
      drawBars();

      // MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecordState('recorded');
        stopStream();
        setBars(Array(BAR_COUNT).fill(4));
      };

      mr.start(100);
      setRecordState('recording');

      // Timer
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);

    } catch (e) {
      setError('Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  }

  function resetRecording() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl('');
    setRecordSeconds(0);
    setRecordState('idle');
    setBars(Array(BAR_COUNT).fill(4));
  }

  async function handleClone() {
    const audioFile = inputMode === 'record'
      ? recordedBlob ? new File([recordedBlob], 'aufnahme.webm', { type: recordedBlob.type }) : null
      : file;

    if (!elApiKey) { setError('Kein ElevenLabs API Key – bitte in Einstellungen eintragen'); return; }
    if (!audioFile) { setError('Kein Audio vorhanden'); return; }
    if (!name.trim()) { setError('Bitte einen Namen für die Stimme eingeben'); return; }

    if (inputMode === 'upload') {
      const durationOk = await checkAudioDuration(audioFile);
      if (!durationOk) { setError('Die Audio-Datei muss mindestens 1 Minute lang sein'); return; }
    }

    if (inputMode === 'record' && recordSeconds < 60) {
      setError(`Aufnahme ist erst ${fmt(recordSeconds)} lang – mindestens 1 Minute nötig`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await cloneVoice(name.trim(), audioFile, elApiKey);
      const newVoice: ELVoice = { voice_id: result.voice_id, name: result.name, category: 'cloned', isCloned: true };
      saveClonedVoice(newVoice);
      setVoices(getClonedVoices());
      setSuccess(`✓ Stimme „${result.name}" erfolgreich geklont!`);
      setFile(null);
      setName('');
      resetRecording();
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
    try { if (elApiKey) await deleteELVoice(voice.voice_id, elApiKey); } catch { /* ignore */ }
    deleteClonedVoice(voice.voice_id);
    setVoices(getClonedVoices());
    setDeletingId('');
    onVoiceAdded();
  }

  const hasAudio = inputMode === 'record' ? !!recordedBlob : !!file;
  const canClone = hasAudio && name.trim().length > 0 && !loading;
  const minReached = inputMode === 'record' ? recordSeconds >= 60 : true;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={sectionHead}>🎤 Neue Stimme klonen</div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {(['record', 'upload'] as InputMode[]).map(m => (
            <button
              key={m}
              onClick={() => { setInputMode(m); setError(''); }}
              style={{
                flex: 1, padding: '9px', borderRadius: 8,
                border: `1px solid ${inputMode === m ? '#7c3aed' : '#252535'}`,
                background: inputMode === m ? 'rgba(124,58,237,0.12)' : '#0f0f18',
                color: inputMode === m ? '#a855f7' : '#5a5a7a',
                fontSize: 13, fontWeight: inputMode === m ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {m === 'record' ? '🎙️ Direkt aufnehmen' : '📁 Datei hochladen'}
            </button>
          ))}
        </div>

        {/* ── RECORD MODE ── */}
        {inputMode === 'record' && (
          <div style={{ marginTop: 14 }}>
            {recordState === 'idle' && (
              <div style={{ textAlign: 'center', padding: '28px 20px', borderRadius: 12, border: '2px dashed #252535', background: '#0a0a14' }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🎙️</div>
                <div style={{ fontSize: 14, color: '#9090b0', marginBottom: 6 }}>
                  Mindestens <strong style={{ color: '#e8e8f0' }}>1 Minute</strong> sprechen
                </div>
                <div style={{ fontSize: 12, color: '#3a3a55', marginBottom: 20 }}>
                  Ruhige Umgebung · Klares Sprechen · Kein Hintergrundlärm
                </div>
                <button
                  onClick={startRecording}
                  style={{
                    padding: '14px 36px', borderRadius: 40,
                    border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 0 24px rgba(239,68,68,0.5)',
                  }}
                >
                  ⏺ Aufnahme starten
                </button>
              </div>
            )}

            {recordState === 'recording' && (
              <div style={{
                borderRadius: 12,
                border: '2px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.04)',
                padding: '24px 20px',
                textAlign: 'center',
              }}>
                {/* Timer */}
                <div style={{ fontSize: 44, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: recordSeconds >= 60 ? '#10b981' : '#ef4444', marginBottom: 12, letterSpacing: 2 }}>
                  {fmt(recordSeconds)}
                </div>

                {/* Min-reached badge */}
                {recordSeconds >= 60 && (
                  <div style={{ fontSize: 12, color: '#10b981', marginBottom: 10, fontWeight: 600 }}>
                    ✓ Genug aufgenommen – du kannst stoppen
                  </div>
                )}
                {recordSeconds < 60 && (
                  <div style={{ fontSize: 12, color: '#5a5a7a', marginBottom: 10 }}>
                    Noch {fmt(60 - recordSeconds)} bis zur Mindestlänge
                  </div>
                )}

                {/* Live waveform */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 56, marginBottom: 20 }}>
                  {bars.map((h, i) => (
                    <div key={i} style={{
                      width: 4, height: h,
                      borderRadius: 2,
                      background: recordSeconds >= 60
                        ? `hsl(${142 - (h / 48) * 20}, 70%, 50%)`
                        : `hsl(${0 + (h / 48) * 15}, 80%, ${45 + (h / 48) * 20}%)`,
                      transition: 'height 0.05s ease',
                    }} />
                  ))}
                </div>

                {/* Pulsing indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse-rec 1s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 12, color: '#9090b0' }}>Aufnahme läuft...</span>
                </div>

                <button
                  onClick={stopRecording}
                  style={{
                    padding: '12px 32px', borderRadius: 40,
                    border: 'none',
                    background: recordSeconds >= 60
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : '#1e1e2a',
                    color: recordSeconds >= 60 ? '#fff' : '#9090b0',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: recordSeconds >= 60 ? '0 0 16px rgba(16,185,129,0.4)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  ⏹ Stopp{recordSeconds >= 60 ? ' & Fertig' : ''}
                </button>
              </div>
            )}

            {recordState === 'recorded' && (
              <div style={{ borderRadius: 12, border: '1px solid #252535', background: '#0f0f18', padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>Aufnahme abgeschlossen</div>
                    <div style={{ fontSize: 12, color: '#5a5a7a' }}>Länge: {fmt(recordSeconds)}</div>
                  </div>
                  <button
                    onClick={resetRecording}
                    style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 6, border: '1px solid #252535', background: 'transparent', color: '#5a5a7a', fontSize: 11, cursor: 'pointer' }}
                  >
                    🔄 Neu aufnehmen
                  </button>
                </div>

                {/* Preview player */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: '#5a5a7a', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>Vorschau</div>
                  <audio
                    src={recordedUrl}
                    controls
                    style={{ width: '100%', height: 36, borderRadius: 8, accentColor: '#7c3aed' }}
                  />
                </div>

                {!minReached && (
                  <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 7, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontSize: 12 }}>
                    ⚠️ Aufnahme ist nur {fmt(recordSeconds)} lang – ElevenLabs empfiehlt min. 1 Minute
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── UPLOAD MODE ── */}
        {inputMode === 'upload' && (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && setFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: 14,
              border: `2px dashed ${file ? '#7c3aed' : '#252535'}`,
              borderRadius: 12, padding: '28px 20px',
              textAlign: 'center', cursor: 'pointer',
              background: file ? 'rgba(124,58,237,0.05)' : '#0a0a14',
              transition: 'all 0.15s',
            }}
          >
            {file ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🎵</div>
                <div style={{ fontSize: 14, color: '#a855f7', fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#5a5a7a', marginTop: 4 }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Klick zum Ändern
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                <div style={{ fontSize: 14, color: '#9090b0', fontWeight: 600 }}>Audio-Datei hochladen</div>
                <div style={{ fontSize: 12, color: '#3a3a55', marginTop: 4 }}>MP3, WAV, M4A · Min. 1 Minute · Drag & Drop</div>
              </>
            )}
            <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
          </div>
        )}

        {/* Name input – shown when audio is ready */}
        {(hasAudio || recordState === 'recorded') && (
          <div style={{ marginTop: 12 }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name der Stimme (z.B. Ilyas)"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #252535', background: '#0f0f18', color: '#e8e8f0', fontSize: 14 }}
            />
          </div>
        )}

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

        {(hasAudio || recordState === 'recorded') && (
          <button
            onClick={handleClone}
            disabled={!canClone}
            style={{
              marginTop: 12, width: '100%', padding: '13px',
              borderRadius: 10, border: 'none',
              background: !canClone ? '#252535' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: !canClone ? '#5a5a7a' : '#fff',
              fontSize: 14, fontWeight: 700,
              cursor: !canClone ? 'default' : 'pointer',
              boxShadow: !canClone ? 'none' : '0 0 16px rgba(124,58,237,0.35)',
            }}
          >
            {loading ? '⏳ Klonen läuft...' : '🎤 Jetzt klonen'}
          </button>
        )}
      </div>

      {/* Cloned voices list */}
      {voices.length > 0 && (
        <div>
          <div style={sectionHead}>✦ Meine geklonten Stimmen ({voices.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {voices.map(v => (
              <div key={v.voice_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid #252535', background: '#0f0f18' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🎤</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f0' }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: '#5a5a7a' }}>ID: {v.voice_id.slice(0, 12)}...</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600 }}>KLON</span>
                <button
                  onClick={() => handleDelete(v)}
                  disabled={deletingId === v.voice_id}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #252535', background: 'transparent', color: deletingId === v.voice_id ? '#5a5a7a' : '#ef4444', fontSize: 13, cursor: 'pointer' }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-rec {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#9090b0',
  textTransform: 'uppercase', letterSpacing: 0.8,
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

async function checkAudioDuration(file: File): Promise<boolean> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => { URL.revokeObjectURL(url); resolve(audio.duration >= 60); });
    audio.addEventListener('error', () => { URL.revokeObjectURL(url); resolve(true); });
  });
}
