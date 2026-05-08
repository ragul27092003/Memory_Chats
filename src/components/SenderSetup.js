import React from 'react';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 24,
  },
  card: {
    background: '#1f2c33',
    borderRadius: 16,
    padding: '28px 24px',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  title: {
    color: '#e9edef',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  sub: {
    color: '#8696a0',
    fontSize: 13,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  senderBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 16px',
    borderRadius: 12,
    border: '1.5px solid #2a3942',
    background: '#202c33',
    cursor: 'pointer',
    marginBottom: 10,
    transition: 'border-color 0.15s, background 0.15s',
    textAlign: 'left',
  },
  senderBtnActive: {
    borderColor: '#00a884',
    background: 'rgba(0,168,132,0.1)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#00a884',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  senderName: {
    color: '#e9edef',
    fontSize: 15,
    fontWeight: 600,
  },
  msgCount: {
    color: '#8696a0',
    fontSize: 12,
    marginTop: 2,
  },
  confirmBtn: {
    width: '100%',
    background: '#00a884',
    color: '#fff',
    border: 'none',
    padding: '13px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 6,
    transition: 'background 0.2s',
  },
};

function getInitials(name) {
  return name.replace(/[^\w\s]/g, '').trim()
    .split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??';
}

const AVATAR_COLORS = ['#00a884', '#9c6b9e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function SenderSetup({ participants, msgCounts, onConfirm }) {
  const [selected, setSelected] = React.useState(
    // Default: the person with FEWER messages is likely the exporter ("me")
    participants.length > 1
      ? participants.reduce((a, b) => (msgCounts[a] || 0) <= (msgCounts[b] || 0) ? a : b)
      : participants[0] || ''
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>Which one is you?</div>
        <div style={styles.sub}>
          Select your name so your messages appear on the right side (green bubbles), just like WhatsApp.
        </div>

        {participants.map((p, i) => (
          <button
            key={p}
            style={{
              ...styles.senderBtn,
              ...(selected === p ? styles.senderBtnActive : {}),
            }}
            onClick={() => setSelected(p)}
          >
            <div style={{ ...styles.avatar, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              {getInitials(p)}
            </div>
            <div>
              <div style={styles.senderName}>{p}</div>
              <div style={styles.msgCount}>{msgCounts[p] || 0} messages</div>
            </div>
            {selected === p && (
              <div style={{ marginLeft: 'auto', color: '#00a884', fontSize: 20 }}>✓</div>
            )}
          </button>
        ))}

        <button
          style={styles.confirmBtn}
          onClick={() => selected && onConfirm(selected)}
          onMouseOver={e => e.target.style.background = '#017561'}
          onMouseOut={e => e.target.style.background = '#00a884'}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
