import { useState } from 'react';
import type { SavedPost } from '../types';
import { updatePostSchedule } from '../store';

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

export default function Calendar({ posts, onChange }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragging, setDragging] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // weekday offset (Monday start)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const scheduledPosts = posts.filter(p => p.scheduledFor);
  const unscheduledPosts = posts.filter(p => !p.scheduledFor);

  function getPostsForDate(d: Date): SavedPost[] {
    const key = d.toISOString().split('T')[0];
    return scheduledPosts.filter(p => p.scheduledFor?.split('T')[0] === key);
  }

  function handleDrop(dateStr: string) {
    if (!dragging) return;
    updatePostSchedule(dragging, dateStr);
    setDragging(null);
    onChange();
  }

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Calendar */}
      <div style={{ flex: '1 1 420px' }}>
        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth} style={navBtn}>◀</button>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e8e8f0' }}>{monthName}</span>
          <button onClick={nextMonth} style={navBtn}>▶</button>
        </div>

        {/* Weekday headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {weekdays.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: '#5a5a7a', fontWeight: 600, padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: totalCells }, (_, i) => {
            const dayNum = i - startOffset + 1;
            const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
            const cellDate = isValid ? new Date(year, month, dayNum) : null;
            const isToday = cellDate && cellDate.toDateString() === today.toDateString();
            const isPast = cellDate && cellDate < today;
            const dayPosts = cellDate ? getPostsForDate(cellDate) : [];
            const dateStr = cellDate ? cellDate.toISOString().split('T')[0] : '';

            return (
              <div
                key={i}
                onDragOver={e => { if (isValid && !isPast) e.preventDefault(); }}
                onDrop={() => isValid && !isPast && handleDrop(dateStr)}
                style={{
                  minHeight: 72,
                  borderRadius: 8,
                  border: isToday ? '1px solid #7c3aed' : '1px solid #1a1a26',
                  background: isToday ? 'rgba(124,58,237,0.08)' : isPast ? '#0a0a12' : '#0f0f18',
                  padding: 4,
                  opacity: !isValid ? 0 : 1,
                  transition: 'background 0.1s',
                }}
              >
                {isValid && (
                  <>
                    <div style={{
                      fontSize: 11,
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? '#a855f7' : isPast ? '#3a3a55' : '#9090b0',
                      marginBottom: 3,
                      textAlign: 'right',
                      paddingRight: 2,
                    }}>
                      {dayNum}
                    </div>
                    {dayPosts.slice(0, 2).map(p => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => setDragging(p.id)}
                        title={p.input.topic}
                        style={{
                          fontSize: 9,
                          padding: '2px 4px',
                          borderRadius: 4,
                          background: `${CHANNEL_COLORS[p.input.channel]}33`,
                          color: CHANNEL_COLORS[p.input.channel],
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'grab',
                        }}
                      >
                        {CHANNEL_EMOJI[p.input.channel]} {p.input.topic}
                      </div>
                    ))}
                    {dayPosts.length > 2 && (
                      <div style={{ fontSize: 9, color: '#5a5a7a' }}>+{dayPosts.length - 2}</div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: '#3a3a55', textAlign: 'center' }}>
          Posts auf Tage ziehen (Drag & Drop)
        </div>
      </div>

      {/* Unscheduled posts sidebar */}
      <div style={{ flex: '0 0 220px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
          Nicht geplant ({unscheduledPosts.length})
        </div>

        {unscheduledPosts.length === 0 ? (
          <div style={{ fontSize: 13, color: '#3a3a55', textAlign: 'center', padding: '24px 0' }}>
            Alle Posts geplant! 🎉
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unscheduledPosts.map(p => (
              <div
                key={p.id}
                draggable
                onDragStart={() => setDragging(p.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #252535',
                  background: '#0f0f18',
                  cursor: 'grab',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{CHANNEL_EMOJI[p.input.channel]}</span>
                  <span style={{ fontSize: 11, color: CHANNEL_COLORS[p.input.channel], fontWeight: 600 }}>
                    {p.input.channel.charAt(0).toUpperCase() + p.input.channel.slice(1)}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#c0c0d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.input.topic}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9090b0', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            Statistiken
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['tiktok', 'instagram', 'linkedin'] as const).map(ch => {
              const count = scheduledPosts.filter(p => p.input.channel === ch).length;
              return (
                <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13 }}>{CHANNEL_EMOJI[ch]}</span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#16161f', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${scheduledPosts.length > 0 ? (count / scheduledPosts.length) * 100 : 0}%`,
                      background: CHANNEL_COLORS[ch],
                      borderRadius: 2,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#5a5a7a', width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32,
  borderRadius: 8,
  border: '1px solid #252535',
  background: '#0f0f18',
  color: '#9090b0',
  cursor: 'pointer',
  fontSize: 12,
};
