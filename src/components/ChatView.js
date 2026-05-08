import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { formatDate, getChatStats, isImageFile, isVideoFile, isAudioFile, isMediaOmitted } from '../utils/parser';

function getInitials(name) {
  return (name || '').replace(/[^\w\s]/g, '').trim()
    .split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??';
}

function getMediaUrl(text, mediaMap) {
  if (!mediaMap || !text) return null;
  const t = text.trim();
  for (const key of Object.keys(mediaMap)) {
    if (t === key || t.includes(key) || key.includes(t.replace(/[<>]/g, ''))) {
      return mediaMap[key];
    }
  }
  return null;
}

// ── Theme definitions ────────────────────────────────────────────────────────
const DARK = {
  bg: '#111b21', chatBg: '#0b141a',
  header: '#202c33', headerBorder: '#2a3942',
  bar: '#182229', barBorder: '#2a3942',
  bubbleMine: '#005c4b', bubbleOther: '#202c33',
  inputBg: '#2a3942', pillBg: '#202c33',
  text: '#e9edef', subtext: '#8696a0',
  sysMsg: '#182229', dateLabelBg: '#182229',
  scrollBtnBg: '#202c33', scrollBtnBorder: '#2a3942',
};
const LIGHT = {
  bg: '#f0f2f5', chatBg: '#efeae2',
  header: '#ffffff', headerBorder: '#e9edef',
  bar: '#f7f8fa', barBorder: '#e9edef',
  bubbleMine: '#d9fdd3', bubbleOther: '#ffffff',
  inputBg: '#f0f2f5', pillBg: '#f0f2f5',
  text: '#111b21', subtext: '#54656f',
  sysMsg: '#ffffff', dateLabelBg: '#ffffff',
  scrollBtnBg: '#ffffff', scrollBtnBorder: '#e9edef',
};

function makeStyles(t) {
  return {
    wrap: { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: t.bg },
    header: {
      background: t.header, padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0, borderBottom: `1px solid ${t.headerBorder}`,
    },
    avatar: {
      width: 40, height: 40, borderRadius: '50%', background: '#00a884',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0,
    },
    headerName: { color: t.text, fontSize: 16, fontWeight: 700 },
    headerSub: { color: t.subtext, fontSize: 12 },
    headerRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 },
    iconBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: t.subtext, fontSize: 20, padding: 6, borderRadius: 8,
      display: 'flex', alignItems: 'center', transition: 'color 0.15s',
    },
    searchBar: {
      background: t.bar, borderBottom: `1px solid ${t.barBorder}`,
      padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    },
    searchInput: {
      flex: 1, background: t.inputBg, border: 'none', outline: 'none',
      borderRadius: 20, padding: '7px 14px', color: t.text, fontSize: 14,
    },
    statsBar: {
      display: 'flex', gap: 8, padding: '6px 14px',
      background: t.bar, borderBottom: `1px solid ${t.barBorder}`,
      overflowX: 'auto', flexShrink: 0,
    },
    stat: {
      fontSize: 12, color: t.subtext, whiteSpace: 'nowrap',
      background: t.pillBg, padding: '3px 10px', borderRadius: 10,
    },
    statNum: { color: '#00a884', fontWeight: 700 },
    filterBar: {
      display: 'flex', gap: 8, padding: '7px 14px',
      background: t.bar, borderBottom: `1px solid ${t.barBorder}`,
      flexShrink: 0, overflowX: 'auto',
    },
    fbtn: {
      fontSize: 12, padding: '5px 14px', borderRadius: 14,
      border: `1px solid ${t.barBorder}`, background: t.pillBg,
      cursor: 'pointer', whiteSpace: 'nowrap', color: t.subtext,
      fontFamily: 'inherit', transition: 'all 0.15s',
    },
    fbtnActive: { background: '#00a884', color: '#fff', borderColor: '#00a884' },
    messages: {
      flex: 1, overflowY: 'auto', padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 0,
      background: t.chatBg,
    },
    dateDiv: { textAlign: 'center', margin: '8px 0 4px' },
    dateLabel: {
      background: t.dateLabelBg, fontSize: 12, color: t.subtext,
      padding: '4px 12px', borderRadius: 8,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    sysMsg: {
      background: t.sysMsg, color: t.subtext, fontSize: 12,
      textAlign: 'center', borderRadius: 8, padding: '4px 12px',
      alignSelf: 'center', maxWidth: '90%', margin: '4px 0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    noResults: { textAlign: 'center', padding: 48, color: t.subtext, fontSize: 14 },
    lightbox: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
    },
    lbImg: { maxWidth: '92vw', maxHeight: '90vh', borderRadius: 8 },
    myNameBadge: {
      background: 'rgba(0,168,132,0.15)', border: '1px solid #00a884',
      borderRadius: 8, padding: '4px 12px', color: '#00a884',
      fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
    },
    // Date jump panel
    datePanel: {
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
      background: t.header, borderLeft: `1px solid ${t.headerBorder}`,
      zIndex: 500, display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    },
    datePanelHeader: {
      padding: '14px 16px', borderBottom: `1px solid ${t.headerBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    datePanelTitle: { color: t.text, fontWeight: 700, fontSize: 15 },
    datePanelList: { overflowY: 'auto', flex: 1, padding: '8px 0' },
    datePanelItem: {
      padding: '10px 16px', cursor: 'pointer', color: t.text,
      fontSize: 13, borderBottom: `1px solid ${t.barBorder}`,
      transition: 'background 0.1s', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
    },
    datePanelItemCount: { color: t.subtext, fontSize: 11 },
  };
}

export default function ChatView({ msgs, myName, participants, chatName, mediaMap, onReset, onChangeMe }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [scrollPos, setScrollPos] = useState('bottom');
  const [darkMode, setDarkMode] = useState(true);
  const [showDatePanel, setShowDatePanel] = useState(false);
  const messagesRef = useRef();
  const dateRefs = useRef({});

  const theme = darkMode ? DARK : LIGHT;
  const s = useMemo(() => makeStyles(theme), [darkMode]);

  const stats = useMemo(() => getChatStats(msgs, myName), [msgs, myName]);
  const senderIndexMap = useMemo(() => {
    const map = {};
    participants.forEach((p, i) => { map[p] = i; });
    return map;
  }, [participants]);

  const otherName = participants.find(p => p !== myName) || participants[0] || 'Chat';
  const isGroup = participants.length > 2;

  const filtered = useMemo(() => {
    let m = msgs;
    if (filter === 'media') m = m.filter(x => getMediaUrl(x.text, mediaMap) || isMediaOmitted(x.text));
    else if (filter === 'mine') m = m.filter(x => x.sender === myName);
    else if (filter === 'other') m = m.filter(x => x.sender && x.sender !== myName);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      m = m.filter(x => x.text.toLowerCase().includes(q) || x.sender.toLowerCase().includes(q));
    }
    return m;
  }, [msgs, filter, search, myName, mediaMap]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = [];
    let lastDate = '';
    filtered.forEach(msg => {
      if (msg.date !== lastDate) {
        groups.push({ type: 'date', date: msg.date, key: 'date-' + msg.date + groups.length });
        lastDate = msg.date;
      }
      groups.push({ type: 'msg', msg, key: msg.date + msg.time + msg.sender + msg.text.slice(0, 10) });
    });
    return groups;
  }, [filtered]);

  // All unique dates with message count — for the date jump panel
  const allDates = useMemo(() => {
    const map = {};
    filtered.forEach(m => {
      if (!m.isSystem && m.sender) map[m.date] = (map[m.date] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [filtered]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [grouped]);

  const handleScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const fromTop = el.scrollTop;
    if (fromTop < 80) setScrollPos('top');
    else if (fromBottom < 80) setScrollPos('bottom');
    else setScrollPos('middle');
  }, []);

  const scrollToTop = () => {
    if (messagesRef.current) messagesRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const scrollToBottom = () => {
    if (messagesRef.current) messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  };

  const jumpToDate = useCallback((date) => {
    const el = dateRefs.current[date];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowDatePanel(false);
  }, []);

  const FILTERS = [
    { id: 'all', label: 'All messages' },
    { id: 'media', label: '📎 Media' },
    { id: 'mine', label: 'My messages' },
    { id: 'other', label: 'Their messages' },
  ];

  return (
    <div style={s.wrap}>
      {/* HEADER */}
      <div style={s.header}>
        <button style={{ ...s.iconBtn, fontSize: 18 }} onClick={onReset} title="Back">←</button>
        <div style={s.avatar}>{getInitials(isGroup ? chatName : otherName)}</div>
        <div>
          <div style={s.headerName}>{isGroup ? chatName : otherName}</div>
          <div style={s.headerSub}>
            {msgs.length > 0 ? `${msgs[0].date} – ${msgs[msgs.length - 1].date}` : ''}
          </div>
        </div>
        <div style={s.headerRight}>
          <button style={s.myNameBadge} onClick={onChangeMe} title="Change your name">
            You: {myName.split(' ')[0]}
          </button>
          {/* Date jump */}
          <button
            style={{ ...s.iconBtn, color: showDatePanel ? '#00a884' : theme.subtext }}
            onClick={() => setShowDatePanel(v => !v)}
            title="Jump to date"
          >
            📅
          </button>
          {/* Theme toggle */}
          <button
            style={{ ...s.iconBtn, fontSize: 18 }}
            onClick={() => setDarkMode(v => !v)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {/* Search */}
          <button
            style={{ ...s.iconBtn, color: showSearch ? '#00a884' : theme.subtext }}
            onClick={() => setShowSearch(v => !v)}
            title="Search"
          >
            🔍
          </button>
        </div>
      </div>

      {/* SEARCH */}
      {showSearch && (
        <div style={s.searchBar}>
          <input
            style={s.searchInput}
            placeholder="Search messages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          {search && <span style={{ color: theme.subtext, fontSize: 12 }}>{filtered.length} found</span>}
          <button style={s.iconBtn} onClick={() => { setSearch(''); setShowSearch(false); }}>✕</button>
        </div>
      )}

      {/* STATS */}
      <div style={s.statsBar}>
        <span style={s.stat}><span style={s.statNum}>{stats.total}</span> messages</span>
        <span style={s.stat}><span style={s.statNum}>{stats.media}</span> media</span>
        {participants.map(p => (
          <span key={p} style={s.stat}>
            <span style={s.statNum}>{msgs.filter(m => m.sender === p).length}</span> from {p.split(' ')[0]}
          </span>
        ))}
        <span style={s.stat}><span style={s.statNum}>{Object.keys(mediaMap).length}</span> files loaded</span>
      </div>

      {/* FILTERS */}
      <div style={s.filterBar}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            style={{ ...s.fbtn, ...(filter === f.id ? s.fbtnActive : {}) }}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* MESSAGES */}
      <div style={s.messages} ref={messagesRef} onScroll={handleScroll}>
        {grouped.length === 0 ? (
          <div style={s.noResults}>No messages found</div>
        ) : (
          grouped.map(item => {
            if (item.type === 'date') {
              return (
                <div
                  key={item.key}
                  style={s.dateDiv}
                  ref={el => { if (el) dateRefs.current[item.date] = el; }}
                >
                  <span style={s.dateLabel}>{formatDate(item.date)}</span>
                </div>
              );
            }
            const { msg } = item;
            if (msg.isSystem) {
              return <div key={item.key} style={s.sysMsg}>{msg.text}</div>;
            }
            return (
              <MessageBubble
                key={item.key}
                msg={msg}
                isMine={msg.sender === myName}
                showSenderName={isGroup}
                mediaMap={mediaMap}
                searchQuery={search}
                onImageClick={setLightboxUrl}
                senderIndex={senderIndexMap[msg.sender] || 0}
                darkMode={darkMode}
                theme={theme}
              />
            );
          })
        )}
      </div>

      {/* DATE JUMP PANEL */}
      {showDatePanel && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 499 }}
            onClick={() => setShowDatePanel(false)}
          />
          <div style={s.datePanel}>
            <div style={s.datePanelHeader}>
              <span style={s.datePanelTitle}>📅 Jump to Date</span>
              <button style={s.iconBtn} onClick={() => setShowDatePanel(false)}>✕</button>
            </div>
            <div style={s.datePanelList}>
              {allDates.map(({ date, count }) => (
                <div
                  key={date}
                  style={s.datePanelItem}
                  onClick={() => jumpToDate(date)}
                  onMouseEnter={e => e.currentTarget.style.background = darkMode ? '#2a3942' : '#f0f2f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{formatDate(date)}</span>
                  <span style={s.datePanelItemCount}>{count} msgs</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div style={s.lightbox} onClick={() => setLightboxUrl(null)}>
          {/\.(mp4|mov|avi|3gp|mkv)/i.test(lightboxUrl) ? (
            <video controls style={s.lbImg} onClick={e => e.stopPropagation()}>
              <source src={lightboxUrl} />
            </video>
          ) : (
            <img src={lightboxUrl} alt="full" style={s.lbImg} />
          )}
          <button
            onClick={() => setLightboxUrl(null)}
            style={{
              position: 'fixed', top: 18, right: 22,
              background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff',
              borderRadius: '50%', width: 38, height: 38, fontSize: 20,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}

      {/* SCROLL BUTTONS */}
      <div style={{
        position: 'fixed', right: showDatePanel ? 276 : 16, bottom: 24,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
        transition: 'right 0.2s',
      }}>
        {scrollPos !== 'top' && (
          <button
            onClick={scrollToTop}
            title="Scroll to top"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: s.scrollBtnBg || theme.scrollBtnBg,
              border: `1px solid ${theme.scrollBtnBorder}`,
              color: theme.subtext, fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >↑</button>
        )}
        {scrollPos !== 'bottom' && (
          <button
            onClick={scrollToBottom}
            title="Scroll to bottom"
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#00a884', border: 'none',
              color: '#fff', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,168,132,0.4)',
            }}
          >↓</button>
        )}
      </div>
    </div>
  );
}
