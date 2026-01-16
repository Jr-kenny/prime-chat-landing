import { useEffect, useCallback } from 'react';

const SESSION_KEY = 'primechat_session';

interface ChatSession {
  selectedConversationId: string | null;
  consentFilter: 'allowed' | 'unknown' | 'denied';
  showMobileChat: boolean;
}

/**
 * Persist and restore chat session state across page refreshes
 */
export function useSessionPersistence() {
  const saveSession = useCallback((session: ChatSession) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const loadSession = useCallback((): ChatSession | null => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as ChatSession;
    } catch {
      return null;
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { saveSession, loadSession, clearSession };
}

export type { ChatSession };
