// Helper to get conversation ID from sessionStorage (tab-specific)
const getStoredConversationId = () => {
  try {
    const stored = sessionStorage.getItem('chat_conversation_id');
    return stored ? (stored === 'null' ? null : stored) : null;
  } catch {
    return null;
  }
};

// Helper to set conversation ID in sessionStorage (tab-specific)
const setStoredConversationId = (conversationId) => {
  try {
    if (conversationId === null || conversationId === undefined) {
      sessionStorage.removeItem('chat_conversation_id');
    } else {
      sessionStorage.setItem('chat_conversation_id', String(conversationId));
    }
  } catch (error) {
    console.warn('Failed to store conversation ID:', error);
  }
};

const createChatSlice = (set, get) => {
  // Always start with null - don't initialize from sessionStorage
  // This prevents loading stale/invalid conversation IDs for new users
  // Conversation ID will be set only when user explicitly selects a conversation
  const initialConversationId = null;
  
  // Clear any existing conversation ID from sessionStorage on store initialization
  // This ensures fresh start for new users
  try {
    sessionStorage.removeItem('chat_conversation_id');
  } catch (error) {
    console.warn('Failed to clear chat conversation ID:', error);
  }
  
  return {
    name: 'chat',
    
    // Selected conversation ID to sync between ChatPage and ChatWidget within the same tab
    // Stored in sessionStorage to be tab-specific
    // Always start with null to ensure new conversations don't have an ID
    selectedConversationId: initialConversationId,
    
    // Actions
    setSelectedConversationId: (conversationId) => {
      setStoredConversationId(conversationId);
      set({ selectedConversationId: conversationId });
    },
    
    // Clear selected conversation
    clearSelectedConversation: () => {
      setStoredConversationId(null);
      set({ selectedConversationId: null });
    },
  };
};

export default createChatSlice;

