import React, { useState } from 'react';
import { isImageFile, isVideoFile, isAudioFile, isStickerFile, isGifFile, isMediaOmitted, getMediaTypeLabel } from '../utils/parser';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatText(text, searchQuery) {
  let t = escapeHtml(text);
  t = t.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  t = t.replace(/_(.*?)_/g, '<em>$1</em>');
  t = t.replace(/\n/g, '<br>');
  if (searchQuery) {
    const safe = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(safe, 'gi'), m => `<mark style="background:rgba(255,215,0,0.35);color:#ffd700;border-radius:2px">${m}</mark>`);
  }
  return t;
}

function getFileName(text) {
  const match = text.match(/([^\s/\\]+\.\w{2,5})/);
  return match ? match[1] : null;
}

const SENDER_COLORS = [
  '#00a884', '#9c6b9e', '#3b82f6', '#f59e0b', '#06b6d4', '#ec4899',
];

function ReactionPill({ emoji, sender }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{
        background: 'rgba(128,128,128,0.15)',
        border: '1px solid rgba(128,128,128,0.2)',
        borderRadius: 20, padding: '2px 8px', fontSize: 14,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: 'default', userSelect: 'none', position: 'relative',
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {emoji}
      {show && (
        <span style={{
          position: 'absolute', bottom: '110%', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1f2c34', border: '1px solid #2a3942',
          borderRadius: 6, padding: '4px 10px', fontSize: 11,
          color: '#e9edef', whiteSpace: 'nowrap', zIndex: 100,
          pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>{sender}</span>
      )}
    </span>
  );
}

export default function MessageBubble({ msg, isMine, showSenderName, mediaMap, searchQuery, onImageClick, senderIndex, darkMode, theme }) {
  const url = getMediaUrl(msg.text, mediaMap);
  const omitted = isMediaOmitted(msg.text) && !url;
  const color = SENDER_COLORS[senderIndex % SENDER_COLORS.length];
  const reactions = msg.reactions || [];

  const isImg = url && (isImageFile(msg.text) || isStickerFile(msg.text) || isGifFile(msg.text));
  const isVid = url && isVideoFile(msg.text);
  const isAud = url && isAudioFile(msg.text);

  // Bubble colors from theme
  const bubbleBg = isMine
    ? (darkMode ? '#005c4b' : '#d9fdd3')
    : (darkMode ? '#202c33' : '#ffffff');
  const textColor = darkMode ? '#e9edef' : '#111b21';
  const timeColor = darkMode ? '#8696a0' : '#54656f';

  return (
    <div style={{ display: 'flex', marginBottom: 2, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '72%', padding: '6px 10px 4px',
        borderRadius: 8, fontSize: 13.5, lineHeight: 1.5,
        wordBreak: 'break-word', position: 'relative',
        background: bubbleBg,
        borderTopRightRadius: isMine ? 2 : 8,
        borderTopLeftRadius: isMine ? 8 : 2,
        boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.08)',
      }}>
        {showSenderName && !isMine && (
          <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 2 }}>{msg.sender}</div>
        )}

        {isImg ? (
          <img
            src={url} alt="media"
            style={{ maxWidth: 240, maxHeight: 220, borderRadius: 6, display: 'block', marginBottom: 2, cursor: 'pointer', objectFit: 'cover' }}
            loading="lazy"
            onClick={() => onImageClick(url)}
          />
        ) : isVid ? (
          <video controls style={{ maxWidth: 240, borderRadius: 6, display: 'block' }}>
            <source src={url} />
          </video>
        ) : isAud ? (
          <audio controls style={{ width: 210, display: 'block' }}>
            <source src={url} />
          </audio>
        ) : omitted ? (
          <OmittedMedia text={msg.text} darkMode={darkMode} />
        ) : (
          <div
            style={{ color: textColor }}
            dangerouslySetInnerHTML={{ __html: formatText(msg.text, searchQuery) }}
          />
        )}

        {reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4, marginBottom: 2 }}>
            {reactions.map((r, i) => (
              <ReactionPill key={i} emoji={r.emoji} sender={r.sender} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
          <span style={{ fontSize: 10.5, color: timeColor }}>{msg.time}</span>
        </div>
      </div>
    </div>
  );
}

function OmittedMedia({ text, darkMode }) {
  const { icon, label } = getMediaTypeLabel(text);
  const filename = getFileName(text);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.06)',
      borderRadius: 8, padding: '8px 12px', marginBottom: 2, minWidth: 170,
    }}>
      <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <span style={{ color: darkMode ? '#e9edef' : '#111b21', fontSize: 13, fontWeight: 600 }}>{label}</span>
        {filename && <span style={{ color: darkMode ? '#8696a0' : '#54656f', fontSize: 11 }}>{filename}</span>}
        <span style={{ color: darkMode ? '#8696a0' : '#54656f', fontSize: 11 }}>Not included in export</span>
      </div>
    </div>
  );
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
