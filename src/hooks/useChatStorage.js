import { useState, useEffect, useCallback } from 'react';

// Persist any value to sessionStorage (survives soft refresh, cleared on tab close)
export function useSessionStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const set = useCallback((v) => {
    setValue(v);
    try {
      sessionStorage.setItem(key, JSON.stringify(v));
    } catch {
      // storage full or unavailable
    }
  }, [key]);

  const clear = useCallback(() => {
    setValue(defaultValue);
    sessionStorage.removeItem(key);
  }, [key, defaultValue]);

  return [value, set, clear];
}

// Stores chat data - messages stay on reload within same tab session
export function useChatStorage() {
  const [chatData, setChatData, clearChatData] = useSessionStorage('wa_chat_data', null);

  const saveChat = useCallback((data) => {
    // Store messages (up to 50k messages to avoid storage limits)
    const payload = {
      msgs: data.msgs.slice(0, 50000),
      myName: data.myName,
      participants: data.participants,
      chatName: data.chatName,
      savedAt: Date.now(),
    };
    setChatData(payload);
  }, [setChatData]);

  return { chatData, saveChat, clearChatData };
}
