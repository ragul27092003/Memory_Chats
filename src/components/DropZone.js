import React, { useRef, useState } from 'react';

const styles = {
  wrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    textAlign: 'center',
    gap: 20,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  dragOver: { background: 'rgba(0,168,132,0.06)' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'rgba(0,168,132,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: 700, color: '#e9edef' },
  desc: { fontSize: 14, color: '#8696a0', lineHeight: 1.8, maxWidth: 340 },
  highlight: { color: '#00a884', fontWeight: 600 },
  btn: {
    background: '#00a884',
    color: '#fff',
    border: 'none',
    padding: '12px 32px',
    borderRadius: 24,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
  },
  error: {
    background: '#1f2c33',
    border: '1px solid rgba(231,76,60,0.4)',
    borderRadius: 10,
    padding: '12px 18px',
    color: '#e74c3c',
    fontSize: 13,
    maxWidth: 380,
    lineHeight: 1.6,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    color: '#8696a0',
    fontSize: 14,
  },
  spinner: {
    width: 36,
    height: 36,
    border: '3px solid #2a3942',
    borderTop: '3px solid #00a884',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

export default function DropZone({ onFileParsed, error, setError }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');
  const inputRef = useRef();

  const processFile = async (file) => {
    setError('');
    setLoading(true);
    setLoadMsg('Reading file...');
    try {
      let txt = '';
      let mediaMap = {};

      if (file.name.toLowerCase().endsWith('.zip')) {
        setLoadMsg('Extracting zip...');
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(file);
        const entries = Object.entries(zip.files);
        let foundTxt = false;

        for (const [name, entry] of entries) {
          if (entry.dir) continue;
          const short = name.split('/').pop();
          if (!foundTxt && short.toLowerCase().endsWith('.txt')) {
            setLoadMsg('Parsing messages...');
            txt = await entry.async('text');
            foundTxt = true;
          } else {
            const blob = await entry.async('blob');
            mediaMap[short] = URL.createObjectURL(blob);
          }
        }
        if (!foundTxt) {
          throw new Error('No .txt file found inside the zip. Files: ' + entries.map(e => e[0]).join(', '));
        }
      } else if (file.name.toLowerCase().endsWith('.txt')) {
        setLoadMsg('Parsing messages...');
        txt = await file.text();
      } else {
        throw new Error('Please upload a .zip or .txt file exported from WhatsApp.');
      }

      setLoadMsg('Building chat...');
      onFileParsed(txt, mediaMap, file.name);
    } catch (err) {
      setError(err.message || 'Failed to read file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };

  if (loading) {
    return (
      <div style={{ ...styles.wrap }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span>{loadMsg}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.wrap, ...(dragging ? styles.dragOver : {}) }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <div style={styles.iconWrap}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="#00a884">
          <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-4 8h-3v3h-2v-3H8v-2h3V9h2v3h3v2z"/>
        </svg>
      </div>

      <div>
        <div style={styles.title}>Open your WhatsApp export</div>
        <div style={{ ...styles.desc, marginTop: 10 }}>
          Drop your <span style={styles.highlight}>.zip</span> (with media) or{' '}
          <span style={styles.highlight}>.txt</span> file here.
          <br />
          Everything stays on your device — nothing is uploaded.
        </div>
      </div>

      <button
        style={styles.btn}
        onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
        onMouseOver={e => e.target.style.background = '#017561'}
        onMouseOut={e => e.target.style.background = '#00a884'}
      >
        Choose File
      </button>

      {error && (
        <div style={styles.error} onClick={e => e.stopPropagation()}>
          ⚠ {error}
        </div>
      )}

      <div style={{ ...styles.desc, fontSize: 12, marginTop: -8 }}>
        To export: Open WhatsApp chat → ⋮ → More → Export chat
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,.txt"
        style={{ display: 'none' }}
        onChange={handleChange}
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
