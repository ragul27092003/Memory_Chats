// â”€â”€ Analytics helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with',
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','need',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','its','our','their','this','that','these','those',
  'what','which','who','how','when','where','why','all','any','both',
  'not','no','so','if','as','up','out','about','into','than','then',
  'just','more','also','only','very','much','too','now','here','there',
  'ok','okay','yeah','yes','no','hi','hey','haha','lol','oh','ah','hmm',
  'like','get','got','got','go','going','come','back','know','think',
  'want','see','look','tell','said','say','time','day','one','two',
  'im','ill','ive','its','dont','cant','wont','isnt','wasnt','didnt',
  'https','http','www','com','null','omitted','media','image','video',
]);

function parseDate(d) {
  // handles DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const p = d.split(/[\/\.\-]/);
  const day = parseInt(p[0]), mon = parseInt(p[1]);
  const yr = p[2] ? (p[2].length === 2 ? 2000 + parseInt(p[2]) : parseInt(p[2])) : 2000;
  return new Date(yr, mon - 1, day);
}

// â”€â”€ Date range filter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function filterByDateRange(msgs, fromDate, toDate) {
  if (!fromDate && !toDate) return msgs;
  return msgs.filter(m => {
    if (m.isSystem || !m.date) return true;
    try {
      const d = parseDate(m.date);
      if (fromDate && d < fromDate) return false;
      if (toDate && d > toDate) return false;
      return true;
    } catch { return true; }
  });
}

// â”€â”€ Activity heatmap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildHeatmap(msgs) {
  // returns { date: count } for all dates with messages
  const map = {};
  msgs.forEach(m => {
    if (m.isSystem || !m.sender || !m.date) return;
    map[m.date] = (map[m.date] || 0) + 1;
  });
  return map;
}

// â”€â”€ Hourly activity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildHourlyActivity(msgs, myName) {
  const mine = new Array(24).fill(0);
  const theirs = new Array(24).fill(0);
  msgs.forEach(m => {
    if (m.isSystem || !m.sender || !m.time) return;
    const hour = parseInt(m.time.split(':')[0]);
    if (isNaN(hour)) return;
    if (m.sender === myName) mine[hour]++;
    else theirs[hour]++;
  });
  return { mine, theirs };
}

// â”€â”€ Word frequency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildWordFreq(msgs, sender, topN = 40) {
  const freq = {};
  msgs.forEach(m => {
    if (m.isSystem || !m.sender) return;
    if (sender && m.sender !== sender) return;
    const words = m.text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^a-z\u0900-\u097f\u0B80-\u0BFF\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));
    words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}

// â”€â”€ Reply gap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function toMinutes(date, time) {
  try {
    const d = parseDate(date);
    const clean = time.replace(/\s*(am|pm)/i, t => t.toLowerCase());
    const [h, rest] = clean.split(':');
    const m = parseInt(rest);
    let hr = parseInt(h);
    if (/pm/i.test(time) && hr !== 12) hr += 12;
    if (/am/i.test(time) && hr === 12) hr = 0;
    return d.getTime() / 60000 + hr * 60 + m;
  } catch { return null; }
}

export function buildReplyGaps(msgs, myName) {
  const myGaps = [], theirGaps = [];
  let lastSender = null, lastMin = null;
  msgs.forEach(m => {
    if (m.isSystem || !m.sender) return;
    const cur = toMinutes(m.date, m.time);
    if (cur === null) return;
    if (lastSender && lastSender !== m.sender && lastMin !== null) {
      const gap = cur - lastMin;
      if (gap >= 0 && gap < 1440) { // ignore gaps > 24h
        if (m.sender === myName) myGaps.push(gap);
        else theirGaps.push(gap);
      }
    }
    lastSender = m.sender;
    lastMin = cur;
  });
  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const fmt = mins => {
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${Math.round(mins)} min`;
    return `${(mins / 60).toFixed(1)} hr`;
  };
  return {
    myAvg: avg(myGaps), theirAvg: avg(theirGaps),
    myFmt: fmt(avg(myGaps)), theirFmt: fmt(avg(theirGaps)),
    myCount: myGaps.length, theirCount: theirGaps.length,
  };
}

// â”€â”€ Emoji stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const EMOJI_RE = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;

export function buildEmojiStats(msgs, participants) {
  const overall = {};
  const byPerson = {};
  participants.forEach(p => { byPerson[p] = {}; });

  msgs.forEach(m => {
    if (m.isSystem || !m.sender) return;
    const emojis = [...(m.text.match(EMOJI_RE) || [])];
    emojis.forEach(e => {
      overall[e] = (overall[e] || 0) + 1;
      if (byPerson[m.sender]) byPerson[m.sender][e] = (byPerson[m.sender][e] || 0) + 1;
    });
  });

  const top = (obj, n = 15) =>
    Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);

  return {
    overall: top(overall),
    byPerson: Object.fromEntries(
      Object.entries(byPerson).map(([p, obj]) => [p, top(obj, 10)])
    ),
  };
}

// â”€â”€ On This Day â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getOnThisDay(msgs) {
  const today = new Date();
  const todayMon = today.getMonth() + 1;
  const todayDay = today.getDate();

  const results = [];
  const byYear = {};

  msgs.forEach(m => {
    if (m.isSystem || !m.sender || !m.date) return;
    try {
      const p = m.date.split(/[\/\.\-]/);
      const day = parseInt(p[0]), mon = parseInt(p[1]);
      const yr = p[2] ? (p[2].length === 2 ? 2000 + parseInt(p[2]) : parseInt(p[2])) : 0;
      if (day === todayDay && mon === todayMon) {
        if (!byYear[yr]) byYear[yr] = [];
        byYear[yr].push(m);
      }
    } catch {}
  });

  Object.entries(byYear)
    .sort((a, b) => a[0] - b[0])
    .forEach(([yr, ms]) => results.push({ year: yr, msgs: ms }));

  return results;
}

// â”€â”€ Message volume over time â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildVolumeOverTime(msgs, granularity = 'month') {
  const map = {};
  msgs.forEach(m => {
    if (m.isSystem || !m.sender || !m.date) return;
    try {
      const p = m.date.split(/[\/\.\-]/);
      const day = parseInt(p[0]), mon = parseInt(p[1]);
      const yr = p[2] ? (p[2].length === 2 ? 2000 + parseInt(p[2]) : parseInt(p[2])) : 0;
      const key = granularity === 'month'
        ? `${yr}-${String(mon).padStart(2,'0')}`
        : `${yr}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      map[key] = (map[key] || 0) + 1;
    } catch {}
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
}

// â”€â”€ Bookmarks (sessionStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BM_KEY = 'wa_bookmarks';
export function getBookmarks() {
  try { return JSON.parse(sessionStorage.getItem(BM_KEY) || '[]'); } catch { return []; }
}
export function saveBookmarks(bms) {
  try { sessionStorage.setItem(BM_KEY, JSON.stringify(bms)); } catch {}
}
export function toggleBookmark(msg) {
  const bms = getBookmarks();
  const id = msg.date + '|' + msg.time + '|' + msg.sender;
  const idx = bms.findIndex(b => b.id === id);
  if (idx >= 0) { bms.splice(idx, 1); }
  else { bms.push({ id, date: msg.date, time: msg.time, sender: msg.sender, text: msg.text }); }
  saveBookmarks(bms);
  return idx < 0; // true = added
}
export function isBookmarked(msg) {
  const id = msg.date + '|' + msg.time + '|' + msg.sender;
  return getBookmarks().some(b => b.id === id);
}
