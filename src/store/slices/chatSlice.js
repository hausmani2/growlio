const createChatSlice = (set, get) => ({
  name: 'chat',
  
  // Selected conversation ID to sync between ChatPage and ChatWidget
  selectedConversationId: null,
  
  // Actions
  setSelectedConversationId: (conversationId) => {
    set({ selectedConversationId: conversationId });
  },
  
  // Clear selected conversation
  clearSelectedConversation: () => {
    set({ selectedConversationId: null });
  },
});

export default createChatSlice;

