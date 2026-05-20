import React, { useState, useEffect } from 'react';
import { getBookmarks, toggleBookmark } from '../utils/analytics';

export default function BookmarksPanel({ theme: t, onClose, onJumpTo }) {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  const handleRemove = (bm) => {
    toggleBookmark(bm);
    setBookmarks(getBookmarks());
  };

  const s = {
    panel: {
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
      background: t.header, borderLeft: '1px solid ' + t.headerBorder,
      zIndex: 500, display: 'flex', flexDirection: 'column',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
    },
    header: {
      padding: '14px 16px', borderBottom: '1px solid ' + t.headerBorder,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    title: { color: t.text, fontWeight: 700, fontSize: 15 },
    closeBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: t.subtext, fontSize: 20, padding: '2px 6px', borderRadius: 6,
    },
    list: { overflowY: 'auto', flex: 1, padding: '8px 0' },
    empty: { textAlign: 'center', padding: 32, color: t.subtext, fontSize: 13 },
    item: {
      padding: '10px 14px', borderBottom: '1px solid ' + t.headerBorder,
      cursor: 'pointer', transition: 'background 0.1s',
    },
    sender: { color: '#00a884', fontSize: 12, fontWeight: 600, marginBottom: 2 },
    text: { color: t.text, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    meta: { color: t.subtext, fontSize: 11, marginTop: 3, display: 'flex', justifyContent: 'space-between' },
    removeBtn: {
      background: 'none', border: 'none', cursor: 'pointer',
      color: '#f59e0b', fontSize: 15, padding: '0 2px',
    },
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>Bookmarks</span>
        <button style={s.closeBtn} onClick={onClose}>x</button>
      </div>
      <div style={s.list}>
        {bookmarks.length === 0 ? (
          <div style={s.empty}>No bookmarks yet.<br />Star messages to save them here.</div>
        ) : (
          bookmarks.map((bm, i) => (
            <div key={i} style={s.item} onClick={() => { onJumpTo(bm); onClose(); }}>
              <div style={s.sender}>{bm.sender}</div>
              <div style={s.text}>{bm.text}</div>
              <div style={s.meta}>
                <span>{bm.date} {bm.time}</span>
                <button
                  style={s.removeBtn}
                  title="Remove bookmark"
                  onClick={e => { e.stopPropagation(); handleRemove(bm); }}
                >*</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
