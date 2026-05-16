import React, { useMemo, useState } from 'react';
import {
  buildHeatmap, buildHourlyActivity, buildWordFreq,
  buildReplyGaps, buildEmojiStats, getOnThisDay,
  buildVolumeOverTime,
} from '../utils/analytics';
import { formatDate } from '../utils/parser';

// â”€â”€ Small reusable bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Bar({ value, max, color = '#00a884', height = 6 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height, borderRadius: 4,
        width: `${max ? Math.round((value / max) * 100) : 0}%`,
        background: color, transition: 'width 0.4s',
      }} />
    </div>
  );
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// â”€â”€ Heatmap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HeatmapSection({ msgs, theme }) {
  const heatmap = useMemo(() => buildHeatmap(msgs), [msgs]);
  const entries = Object.entries(heatmap);
  if (!entries.length) return null;
  const max = Math.max(...Object.values(heatmap), 1);

  // Group by month-year
  const byMonth = {};
  entries.forEach(([date, count]) => {
    const p = date.split(/[\/\.\-]/);
    const mon = parseInt(p[1]), yr = p[2] ? (p[2].length===2?2000+parseInt(p[2]):parseInt(p[2])) : 2000;
    const key = `${yr}-${String(mon).padStart(2,'0')}`;
    if (!byMonth[key]) byMonth[key] = { label: `${MONTHS[mon-1]} ${yr}`, days: {} };
    byMonth[key].days[parseInt(p[0])] = count;
  });

  const months = Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).slice(-6);
  const levels = (c) => {
    if (!c) return 'rgba(255,255,255,0.04)';
    const pct = c / max;
    if (pct < 0.25) return 'rgba(0,168,132,0.25)';
    if (pct < 0.5)  return 'rgba(0,168,132,0.45)';
    if (pct < 0.75) return 'rgba(0,168,132,0.7)';
    return '#00a884';
  };

  return (
    <div>
      {months.map(([key, { label, days }]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div style={{ color: theme.subtext, fontSize: 11, marginBottom: 5 }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <div
                key={day}
                title={days[day] ? `${day}: ${days[day]} msgs` : undefined}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: levels(days[day] || 0),
                  cursor: days[day] ? 'default' : 'default',
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span style={{ color: theme.subtext, fontSize: 10 }}>Less</span>
        {['rgba(255,255,255,0.04)','rgba(0,168,132,0.25)','rgba(0,168,132,0.45)','rgba(0,168,132,0.7)','#00a884'].map((c,i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
        ))}
        <span style={{ color: theme.subtext, fontSize: 10 }}>More</span>
      </div>
    </div>
  );
}

// â”€â”€ Hourly activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HourlySection({ msgs, myName, participants, theme }) {
  const { mine, theirs } = useMemo(() => buildHourlyActivity(msgs, myName), [msgs, myName]);
  const maxVal = Math.max(...mine, ...theirs, 1);
  const otherName = participants.find(p => p !== myName) || 'Other';

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#00a884' }} />
          <span style={{ color: theme.subtext, fontSize: 11 }}>{myName.split(' ')[0]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: '#9c6b9e' }} />
          <span style={{ color: theme.subtext, fontSize: 11 }}>{otherName.split(' ')[0]}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80 }}>
        {mine.map((val, h) => (
          <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end', height: '100%' }}>
              <div title={`${h}:00 - ${myName.split(' ')[0]}: ${val}`} style={{ background: '#00a884', borderRadius: '2px 2px 0 0', height: `${Math.round((val/maxVal)*100)}%`, minHeight: val?2:0 }} />
              <div title={`${h}:00 - ${otherName.split(' ')[0]}: ${theirs[h]}`} style={{ background: '#9c6b9e', borderRadius: '2px 2px 0 0', height: `${Math.round((theirs[h]/maxVal)*100)}%`, minHeight: theirs[h]?2:0 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[0,6,12,18,23].map(h => (
          <span key={h} style={{ color: theme.subtext, fontSize: 10 }}>{h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h-12}pm`}</span>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Word cloud / freq â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WordSection({ msgs, myName, participants, theme }) {
  const [who, setWho] = useState('all');
  const sender = who === 'all' ? null : who;
  const words = useMemo(() => buildWordFreq(msgs, sender, 30), [msgs, sender]);
  const max = words[0]?.[1] || 1;
  const otherName = participants.find(p => p !== myName) || '';

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[['all','Everyone'], [myName, myName.split(' ')[0]], [otherName, otherName.split(' ')[0]]].filter(([v])=>v).map(([v,label]) => (
          <button key={v} onClick={() => setWho(v)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 10, border: 'none',
            background: who === v ? '#00a884' : 'rgba(255,255,255,0.07)',
            color: who === v ? '#fff' : theme.subtext, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {words.map(([word, count]) => {
          const scale = 0.7 + (count / max) * 0.7;
          return (
            <span key={word} style={{
              fontSize: `${Math.round(10 + scale * 8)}px`,
              color: `rgba(0,168,132,${0.4 + scale * 0.6})`,
              fontWeight: scale > 1.2 ? 700 : 400,
              lineHeight: 1.4,
            }} title={`${count} times`}>{word}</span>
          );
        })}
      </div>
      {words.length === 0 && <div style={{ color: theme.subtext, fontSize: 13 }}>Not enough text messages.</div>}
    </div>
  );
}

// â”€â”€ Reply gap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ReplyGapSection({ msgs, myName, participants, theme }) {
  const gaps = useMemo(() => buildReplyGaps(msgs, myName), [msgs, myName]);
  const otherName = participants.find(p => p !== myName) || 'Other';
  const maxAvg = Math.max(gaps.myAvg, gaps.theirAvg, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { label: myName.split(' ')[0], avg: gaps.myAvg, fmt: gaps.myFmt, color: '#00a884', count: gaps.myCount },
        { label: otherName.split(' ')[0], avg: gaps.theirAvg, fmt: gaps.theirFmt, color: '#9c6b9e', count: gaps.theirCount },
      ].map(({ label, avg, fmt, color, count }) => (
        <div key={label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{label}</span>
            <span style={{ color, fontSize: 13, fontWeight: 700 }}>{fmt} avg</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bar value={avg} max={maxAvg} color={color} height={8} />
          </div>
          <div style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>Based on {count} replies</div>
        </div>
      ))}
      <div style={{
        background: 'rgba(0,168,132,0.08)', borderRadius: 8, padding: '10px 14px',
        color: theme.subtext, fontSize: 12, lineHeight: 1.6,
      }}>
        {gaps.myAvg < gaps.theirAvg
          ? `âš¡ ${myName.split(' ')[0]} replies faster on average.`
          : `âš¡ ${otherName.split(' ')[0]} replies faster on average.`}
      </div>
    </div>
  );
}

// â”€â”€ Emoji stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EmojiSection({ msgs, myName, participants, theme }) {
  const stats = useMemo(() => buildEmojiStats(msgs, participants), [msgs, participants]);
  const [tab, setTab] = useState('overall');
  const otherName = participants.find(p => p !== myName) || '';
  const tabs = [['overall','Overall'], [myName, myName.split(' ')[0]], ...(otherName?[[otherName, otherName.split(' ')[0]]]:[])]

  const entries = tab === 'overall' ? stats.overall : (stats.byPerson[tab] || []);
  const max = entries[0]?.[1] || 1;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {tabs.map(([v,label]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 10, border: 'none',
            background: tab === v ? '#00a884' : 'rgba(255,255,255,0.07)',
            color: tab === v ? '#fff' : theme.subtext, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      {entries.length === 0
        ? <div style={{ color: theme.subtext, fontSize: 13 }}>No emojis found.</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map(([emoji, count]) => (
              <div key={emoji} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{emoji}</span>
                <Bar value={count} max={max} color='#f59e0b' height={7} />
                <span style={{ color: theme.subtext, fontSize: 12, width: 32, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}

// â”€â”€ On This Day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function OnThisDaySection({ msgs, theme }) {
  const results = useMemo(() => getOnThisDay(msgs), [msgs]);
  const today = new Date();

  if (!results.length) {
    return (
      <div style={{ color: theme.subtext, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
        ðŸ“­ No messages found on {today.getDate()} {MONTHS[today.getMonth()]} in any previous year.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ color: theme.subtext, fontSize: 12 }}>
        Messages sent on <strong style={{ color: theme.text }}>{today.getDate()} {MONTHS[today.getMonth()]}</strong> in past years:
      </div>
      {results.map(({ year, msgs: yearMsgs }) => (
        <div key={year} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
          <div style={{ color: '#00a884', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            ðŸ—“ {year} Â· {yearMsgs.length} messages
          </div>
          {yearMsgs.slice(0, 3).map((m, i) => (
            <div key={i} style={{ marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid rgba(0,168,132,0.3)' }}>
              <div style={{ color: theme.subtext, fontSize: 10, marginBottom: 2 }}>{m.sender} Â· {m.time}</div>
              <div style={{ color: theme.text, fontSize: 12, lineHeight: 1.5 }}>
                {m.text.slice(0, 120)}{m.text.length > 120 ? 'â€¦' : ''}
              </div>
            </div>
          ))}
          {yearMsgs.length > 3 && (
            <div style={{ color: theme.subtext, fontSize: 11, marginTop: 4 }}>
              + {yearMsgs.length - 3} more messages that day
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// â”€â”€ Volume over time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function VolumeSection({ msgs, theme }) {
  const [gran, setGran] = useState('month');
  const data = useMemo(() => buildVolumeOverTime(msgs, gran), [msgs, gran]);
  const max = Math.max(...data.map(d => d[1]), 1);
  const show = gran === 'month' ? data : data.slice(-90);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['month','Monthly'],['day','Daily (last 90d)']].map(([v,label]) => (
          <button key={v} onClick={() => setGran(v)} style={{
            fontSize: 11, padding: '4px 10px', borderRadius: 10, border: 'none',
            background: gran === v ? '#00a884' : 'rgba(255,255,255,0.07)',
            color: gran === v ? '#fff' : theme.subtext, cursor: 'pointer',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: gran==='month'?4:2, height: 100, overflowX: 'auto', paddingBottom: 4 }}>
        {show.map(([key, count]) => (
          <div key={key} title={`${key}: ${count} msgs`} style={{
            flex: '0 0 auto',
            width: gran==='month'?20:6,
            height: `${Math.round((count/max)*100)}%`,
            minHeight: 2,
            background: '#3b82f6',
            borderRadius: '2px 2px 0 0',
            cursor: 'default',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ color: theme.subtext, fontSize: 10 }}>{show[0]?.[0]}</span>
        <span style={{ color: theme.subtext, fontSize: 10 }}>{show[show.length-1]?.[0]}</span>
      </div>
    </div>
  );
}

// â”€â”€ Export section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ExportSection({ filteredMsgs, chatName, fromDate, toDate, myName, theme }) {
  const [done, setDone] = useState(false);

  const doExport = () => {
    const lines = filteredMsgs
      .filter(m => !m.isSystem && m.sender)
      .map(m => `[${m.date}, ${m.time}] ${m.sender}: ${m.text}`)
      .join('\n');
    const info = [
      `Memory Chats Export`,
      `Chat: ${chatName}`,
      fromDate || toDate ? `Date range: ${fromDate ? fromDate.toLocaleDateString() : 'start'} â†’ ${toDate ? toDate.toLocaleDateString() : 'end'}` : '',
      `Messages: ${filteredMsgs.filter(m => !m.isSystem && m.sender).length}`,
      `Exported: ${new Date().toLocaleString()}`,
      'â”€'.repeat(50),
      '',
      lines,
    ].filter(Boolean).join('\n');

    const blob = new Blob([info], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${chatName || 'chat'}-export.txt`;
    a.click();
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: theme.subtext, fontSize: 13, lineHeight: 1.6 }}>
        Export the currently filtered messages (applies your date range, search, and sender filters) as a clean <code style={{ background:'rgba(255,255,255,0.08)',padding:'1px 5px',borderRadius:4 }}>.txt</code> file.
      </div>
      <div style={{
        background: 'rgba(0,168,132,0.08)', borderRadius: 8, padding: '10px 14px',
        color: theme.subtext, fontSize: 12,
      }}>
        ðŸ“Š {filteredMsgs.filter(m => !m.isSystem && m.sender).length} messages will be exported
      </div>
      <button
        onClick={doExport}
        style={{
          background: done ? '#017561' : '#00a884', color: '#fff', border: 'none',
          padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
          cursor: 'pointer', transition: 'background 0.2s',
        }}
      >
        {done ? 'âœ“ Downloaded!' : 'â¬‡ Download .txt'}
      </button>
    </div>
  );
}

// â”€â”€ Main Analytics Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SECTIONS = [
  { id: 'heatmap',   icon: 'ðŸŸ©', label: 'Activity Heatmap' },
  { id: 'hourly',    icon: 'ðŸ•', label: 'Hourly Activity' },
  { id: 'words',     icon: 'ðŸ’¬', label: 'Word Cloud' },
  { id: 'reply',     icon: 'â†©ï¸',  label: 'Reply Speed' },
  { id: 'emoji',     icon: 'ðŸ˜‚', label: 'Emoji Stats' },
  { id: 'onthisday', icon: 'ðŸ—“', label: 'On This Day' },
  { id: 'volume',    icon: 'ðŸ“ˆ', label: 'Message Volume' },
  { id: 'export',    icon: 'ðŸ“¤', label: 'Export Chat' },
];

export default function AnalyticsPanel({ msgs, filteredMsgs, myName, participants, chatName, fromDate, toDate, theme, darkMode, onClose }) {
  const [active, setActive] = useState('heatmap');

  const panelBg = darkMode ? '#111b21' : '#f0f2f5';
  const cardBg = darkMode ? '#1f2c33' : '#ffffff';
  const borderColor = darkMode ? '#2a3942' : '#e9edef';

  const renderContent = () => {
    switch (active) {
      case 'heatmap':   return <HeatmapSection msgs={msgs} theme={theme} />;
      case 'hourly':    return <HourlySection msgs={msgs} myName={myName} participants={participants} theme={theme} />;
      case 'words':     return <WordSection msgs={msgs} myName={myName} participants={participants} theme={theme} />;
      case 'reply':     return <ReplyGapSection msgs={msgs} myName={myName} participants={participants} theme={theme} />;
      case 'emoji':     return <EmojiSection msgs={msgs} myName={myName} participants={participants} theme={theme} />;
      case 'onthisday': return <OnThisDaySection msgs={msgs} theme={theme} />;
      case 'volume':    return <VolumeSection msgs={msgs} theme={theme} />;
      case 'export':    return <ExportSection filteredMsgs={filteredMsgs} chatName={chatName} fromDate={fromDate} toDate={toDate} myName={myName} theme={theme} />;
      default: return null;
    }
  };

  const cur = SECTIONS.find(s => s.id === active);

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:599, background:'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 340,
        background: panelBg, borderLeft: `1px solid ${borderColor}`,
        zIndex: 600, display: 'flex', flexDirection: 'column',
        boxShadow: '-6px 0 30px rgba(0,0,0,0.25)',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: cardBg, flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ color: theme.text, fontWeight: 700, fontSize: 15 }}>ðŸ“Š Analytics</div>
            <div style={{ color: theme.subtext, fontSize: 11, marginTop: 2 }}>{msgs.length} total messages</div>
          </div>
          <button onClick={onClose} style={{ background:'none',border:'none',color:theme.subtext,fontSize:20,cursor:'pointer',padding:6 }}>âœ•</button>
        </div>

        {/* Nav tabs */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 14px',
          borderBottom: `1px solid ${borderColor}`, background: cardBg, flexShrink: 0,
          position: 'sticky', top: 52, zIndex: 9,
        }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 10,
                border: `1px solid ${active === s.id ? '#00a884' : borderColor}`,
                background: active === s.id ? 'rgba(0,168,132,0.15)' : 'transparent',
                color: active === s.id ? '#00a884' : theme.subtext,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: 16, flex: 1 }}>
          <div style={{ color: theme.text, fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            {cur?.icon} {cur?.label}
          </div>
          {renderContent()}
        </div>
      </div>
    </>
  );
}
