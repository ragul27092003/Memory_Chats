// Parses WhatsApp exported .txt chat files
// Handles: DD/MM/YYYY, HH:MM - Sender: text
// Also handles am/pm, narrow no-break space (\u202F), reactions, etc.

// ─── Reaction detection ───────────────────────────────────────────────────────
//
// WhatsApp exports reactions as their OWN timestamped lines, not continuations.
// There are two formats depending on the device / export version:
//
//  Format A (most common, Android & iOS):
//    "Priya reacted 👍 to your message"
//    "You reacted ❤️ to Priya's message"
//
//  Format B (some iOS exports, quoted):
//    "Priya reacted 👍 to your message: \"Mm\""
//    "You reacted ❤️ to Priya's message: \"Mm\""
//
//  Format C (older / some locales):
//    "👍 Priya"   — bare emoji + sender as a continuation line
//
// We handle all three.

// Matches "Someone reacted <emoji> to ..." or "You reacted <emoji> to ..."
const REACTION_RE = /^(.+?)\s+reacted\s+([\p{Emoji_Presentation}\p{Extended_Pictographic}\u200D\uFE0F]+)\s+to\s+/u;

// Matches a bare "emoji sender" continuation line (Format C)
function looksLikeBareReaction(line) {
  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+\s+\S/u.test(line.trim());
}

export function parseWhatsAppChat(txt) {
  // Strip BOM
  if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
  // Normalize unicode spaces
  txt = txt
    .replace(/\u202F/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\u200E/g, '');

  const lines = txt.split('\n');
  const msgs = [];

  const LINE_RE = /^(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\s+-\s+(.+)$/;

  // We need to match a reaction back to the message it belongs to.
  // WhatsApp exports include the reacted-to text after a colon in Format B,
  // but not always. The safest strategy: walk backwards from the reaction
  // line and find the last non-reaction, non-system message.
  function addReactionToMsg(reactor, emoji) {
    // Walk backwards to find last real message
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (!msgs[i].isSystem && msgs[i].sender) {
        if (!msgs[i].reactions) msgs[i].reactions = [];
        const existing = msgs[i].reactions.find(r => r.sender === reactor);
        if (existing) {
          existing.emoji = emoji;
        } else {
          msgs[i].reactions.push({ emoji, sender: reactor });
        }
        return;
      }
    }
  }

  for (const line of lines) {
    if (!line.trim()) continue;
    const m = line.match(LINE_RE);
    if (m) {
      const rest = m[3];

      // ── Format A / B: timestamped reaction line ──────────────────────────
      const rxMatch = rest.match(REACTION_RE);
      if (rxMatch) {
        const reactor = rxMatch[1].trim(); // "Priya" or "You"
        const emoji   = rxMatch[2].trim();
        addReactionToMsg(reactor, emoji);
        continue; // do NOT push this as a real message
      }

      // ── Normal message ────────────────────────────────────────────────────
      const colon = rest.indexOf(': ');
      if (colon > 0 && colon < 80) {
        msgs.push({
          date: m[1].trim(),
          time: m[2].trim(),
          sender: rest.slice(0, colon).trim(),
          text: rest.slice(colon + 2),
          isSystem: false,
          reactions: [],
        });
      } else {
        msgs.push({
          date: m[1].trim(),
          time: m[2].trim(),
          sender: '',
          text: rest,
          isSystem: true,
          reactions: [],
        });
      }
    } else if (msgs.length && line.trim()) {
      // ── Format C: bare "emoji sender" continuation line ──────────────────
      if (looksLikeBareReaction(line)) {
        const trimmed = line.trim();
        const spaceIdx = trimmed.search(/\s/);
        if (spaceIdx > 0) {
          const emoji   = trimmed.slice(0, spaceIdx).trim();
          const reactor = trimmed.slice(spaceIdx).trim();
          addReactionToMsg(reactor, emoji);
        } else {
          msgs[msgs.length - 1].text += '\n' + line.trim();
        }
      } else {
        // plain continuation line
        msgs[msgs.length - 1].text += '\n' + line.trim();
      }
    }
  }

  return msgs;
}

export function detectParticipants(msgs) {
  const counts = {};
  msgs.forEach(m => {
    if (m.sender) counts[m.sender] = (counts[m.sender] || 0) + 1;
  });
  // Sort by message count descending
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(e => e[0]);
}

export function formatDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  try {
    const p = d.split(/[\/\.\-]/);
    const day = parseInt(p[0]);
    const mon = parseInt(p[1]);
    const yr = p[2].length === 2 ? '20' + p[2] : p[2];
    return `${day} ${months[mon - 1]} ${yr}`;
  } catch (e) { return d; }
}

export function isImageFile(text) {
  return /\.(jpg|jpeg|png|gif|webp|heic|bmp)/i.test(text);
}
export function isVideoFile(text) {
  return /\.(mp4|mov|avi|3gp|mkv)/i.test(text);
}
export function isAudioFile(text) {
  return /\.(opus|mp3|ogg|m4a|aac|wav)/i.test(text);
}
export function isStickerFile(text) {
  return /\.(webp)/i.test(text);
}
export function isGifFile(text) {
  return /\.gif/i.test(text);
}
export function isDocFile(text) {
  return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)/i.test(text);
}
export function isMediaOmitted(text) {
  return /omitted/i.test(text);
}

export function getMediaTypeLabel(text) {
  if (/video.*omitted/i.test(text) || isVideoFile(text)) return { icon: '🎬', label: 'Video' };
  if (/audio.*omitted/i.test(text) || /ptt.*omitted/i.test(text) || isAudioFile(text)) return { icon: '🎵', label: 'Voice / Audio' };
  if (/gif.*omitted/i.test(text) || isGifFile(text)) return { icon: '🎞️', label: 'GIF' };
  if (/sticker.*omitted/i.test(text) || isStickerFile(text)) return { icon: '🪄', label: 'Sticker' };
  if (/document.*omitted/i.test(text) || isDocFile(text)) return { icon: '📄', label: 'Document' };
  if (/image.*omitted/i.test(text) || isImageFile(text)) return { icon: '🖼️', label: 'Photo' };
  return { icon: '📎', label: 'Media' };
}

export function getChatStats(msgs, myName) {
  const total = msgs.length;
  const media = msgs.filter(m =>
    isImageFile(m.text) || isVideoFile(m.text) || isAudioFile(m.text) || isMediaOmitted(m.text)
  ).length;
  const byMe = msgs.filter(m => m.sender === myName).length;
  const byOther = msgs.filter(m => m.sender && m.sender !== myName).length;
  return { total, media, byMe, byOther };
}
