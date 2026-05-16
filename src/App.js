import React, { useState, useCallback } from 'react';
import DropZone from './components/DropZone';
import ChatView from './components/ChatView';
import SenderSetup from './components/SenderSetup';
import { parseWhatsAppChat, detectParticipants } from './utils/parser';
import { useChatStorage } from './hooks/useChatStorage';

// Media blobs are NOT stored in sessionStorage (too large) â€” they're re-created
// when the file is loaded. On reload, user re-picks file but messages are cached.
let sessionMediaMap = {};

export default function App() {
  const { chatData, saveChat, clearChatData } = useChatStorage();
  const [phase, setPhase] = useState(() => chatData ? 'chat' : 'upload');
  const [error, setError] = useState('');
  const [pendingData, setPendingData] = useState(null);
  const [mediaMap, setMediaMap] = useState(sessionMediaMap);

  // Called when user picks a file
  const handleFileParsed = useCallback((txt, newMediaMap, fileName) => {
    const msgs = parseWhatsAppChat(txt);
    if (!msgs.length) {
      setError('Could not parse messages. Make sure this is a WhatsApp exported .txt or .zip file.');
      return;
    }

    const participants = detectParticipants(msgs);
    if (!participants.length) {
      setError('No participants found in this chat.');
      return;
    }

    sessionMediaMap = newMediaMap;
    setMediaMap(newMediaMap);

    const chatName = fileName.replace(/\.(zip|txt)$/i, '').replace(/^WhatsApp Chat with\s*/i, '');
    const msgCounts = {};
    participants.forEach(p => { msgCounts[p] = msgs.filter(m => m.sender === p).length; });

    // Always show sender selection so user can confirm who is "me"
    setPendingData({ msgs, participants, chatName, msgCounts });
    setPhase('setup');
  }, []);

  // User confirmed who they are
  const handleSenderConfirm = useCallback((myName) => {
    const { msgs, participants, chatName } = pendingData;
    const data = { msgs, myName, participants, chatName };
    saveChat(data);
    setPhase('chat');
    setPendingData(null);
  }, [pendingData, saveChat]);

  // Reset to upload phase
  const handleReset = useCallback(() => {
    clearChatData();
    sessionMediaMap = {};
    setMediaMap({});
    setPhase('upload');
    setError('');
  }, [clearChatData]);

  // Change "me" without re-uploading
  const handleChangeMe = useCallback(() => {
    if (!chatData) return;
    const msgCounts = {};
    chatData.participants.forEach(p => {
      msgCounts[p] = chatData.msgs.filter(m => m.sender === p).length;
    });
    setPendingData({
      msgs: chatData.msgs,
      participants: chatData.participants,
      chatName: chatData.chatName,
      msgCounts,
    });
    setPhase('setup');
  }, [chatData]);

  const topbar = (
    <div style={{
      background: '#202c33',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      borderBottom: '1px solid #2a3942',
      flexShrink: 0,
    }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#00a884">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.37 5.07L2 22l5.08-1.34A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.84 13.74c-.2.56-1.18 1.07-1.62 1.13-.41.06-.93.09-1.5-.09-.34-.11-.78-.26-1.35-.5-2.37-1.02-3.92-3.4-4.04-3.56-.12-.16-.96-1.27-.96-2.43 0-1.15.6-1.72.82-1.96.21-.24.46-.3.61-.3l.44.01c.14 0 .33-.05.52.4l.74 1.8c.07.16.03.35-.05.5l-.3.43c-.1.13-.2.27-.09.53.12.26.52.86 1.12 1.39.77.69 1.42.9 1.68 1 .26.1.41.09.57-.05l.4-.47c.17-.2.33-.14.56-.08l1.76.83c.26.12.43.18.49.28.06.1.06.57-.14 1.13z"/>
      </svg>
      <span style={{ color: '#e9edef', fontSize: 17, fontWeight: 700, flex: 1 }}>
        Memory Chats
      </span>
      <span style={{ color: '#8696a0', fontSize: 11 }}>
        100% private â€¢ stays on your device
      </span>
    </div>
  );

  if (phase === 'chat' && chatData) {
    return (
      <ChatView
        msgs={chatData.msgs}
        myName={chatData.myName}
        participants={chatData.participants}
        chatName={chatData.chatName}
        mediaMap={mediaMap}
        onReset={handleReset}
        onChangeMe={handleChangeMe}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#111b21' }}>
      {topbar}

      {phase === 'setup' && pendingData && (
        <SenderSetup
          participants={pendingData.participants}
          msgCounts={pendingData.msgCounts}
          onConfirm={handleSenderConfirm}
        />
      )}

      <DropZone
        onFileParsed={handleFileParsed}
        error={error}
        setError={setError}
      />
    </div>
  );
}        onChangeMe={handleChangeMe}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#111b21' }}>
      {topbar}

      {phase === 'setup' && pendingData && (
        <SenderSetup
          participants={pendingData.participants}
          msgCounts={pendingData.msgCounts}
          onConfirm={handleSenderConfirm}
        />
      )}

      <DropZone
        onFileParsed={handleFileParsed}
        error={error}
        setError={setError}
      />
    </div>
  );
}
