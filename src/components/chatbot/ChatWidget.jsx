import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend, FiLoader, FiClock, FiMaximize2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/store';
import MessageBubble from './MessageBubble';
import { apiPost, apiGet } from '../../utils/axiosInterceptors';

/**
 * ChatWidget Component
 * A professional floating chatbot widget with smooth animations
 */
const ChatWidget = ({ botName = 'Growlio Assistant' }) => {
  const navigate = useNavigate();
  const { selectedConversationId: storeConversationId, setSelectedConversationId } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm here to help you. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null); // Start with null, not empty string
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Initialize: Clear conversation ID on mount to ensure new conversations start fresh
  useEffect(() => {
    // Always start with no conversation ID for new conversations
    // Clear any existing conversation ID from sessionStorage to prevent auto-loading invalid IDs
    const isImpersonating = sessionStorage.getItem('impersonated_user');
    
    // Always clear conversation ID on mount for new users
    // Only keep it if user explicitly selects a conversation later
    setConversationId(null);
    sessionStorage.removeItem('chat_conversation_id');
    
    // Also clear from store if impersonating or if we want fresh start
    if (isImpersonating || !storeConversationId) {
      setSelectedConversationId(null);
    }
  }, []); // Only run on mount

  // Fetch conversations when chat opens and clear conversation ID if impersonating
  useEffect(() => {
    if (isOpen) {
      // If impersonating, always start with fresh conversation (no ID)
      const isImpersonating = sessionStorage.getItem('impersonated_user');
      if (isImpersonating && conversationId) {
        setConversationId(null);
        sessionStorage.removeItem('chat_conversation_id');
        setSelectedConversationId(null);
        setMessages([
          {
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Sync with selected conversation from ChatPage (only within same tab)
  // Note: This sync only works within the same tab since we use sessionStorage
  // IMPORTANT: Only load if conversation ID is explicitly set and widget is open
  // Don't auto-load from sessionStorage on mount - let user explicitly select
  useEffect(() => {
    // Only sync if widget is open and we have a valid store conversation ID
    // Don't auto-load on initial mount - wait for explicit user selection
    if (storeConversationId && isOpen && conversationId === null) {
      // Only load if we don't already have a conversation ID loaded
      // This prevents auto-loading stale conversation IDs from sessionStorage
      const storeIdStr = String(storeConversationId);
      
      // Only load if this is a fresh open (conversationId is null)
      // This means user explicitly selected a conversation, not just opened widget
      loadConversationHistory(storeConversationId);
    } else if (!storeConversationId && conversationId && isOpen) {
      // If store is cleared (new conversation started), clear local state too
      setConversationId(null);
      sessionStorage.removeItem('chat_conversation_id');
      setMessages([
        {
          text: "Hello! I'm here to help you. How can I assist you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeConversationId, isOpen]);

  /**
   * Fetch all conversations for the logged-in user
   */
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await apiGet('/chatbot/conversations/');
      
      // Handle different response formats
      const conversationsList = response.data?.results || response.data?.conversations || response.data || [];
      setConversations(Array.isArray(conversationsList) ? conversationsList : []);
      
      // Don't auto-load conversations - let user explicitly choose
      // This ensures new conversations start with no ID
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Don't show error to user, just log it
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  /**
   * Load conversation history for a specific thread
   */
  const loadConversationHistory = async (threadId) => {
    if (!threadId) return;

    try {
      setIsLoadingHistory(true);
      const response = await apiGet(`/chatbot/conversation/${threadId}/`);
      
      // Handle different response formats
      const history = response.data?.messages || response.data?.history || response.data || [];
      
      if (Array.isArray(history) && history.length > 0) {
        // Convert API response to message format
        const formattedMessages = history.map((msg) => {
          // Handle different API response formats
          const text = msg.text || msg.message || msg.content || msg.question || '';
          const isUser = msg.is_user !== undefined ? msg.is_user : 
                        msg.sender === 'user' || 
                        msg.role === 'user' ||
                        msg.type === 'user';
          const timestamp = msg.timestamp ? new Date(msg.timestamp) : 
                          msg.created_at ? new Date(msg.created_at) : 
                          new Date();

          return {
            text,
            isUser: Boolean(isUser),
            timestamp,
          };
        });

        setMessages(formattedMessages);
        setConversationId(threadId);
        setSelectedConversationId(threadId); // Update store
      } else {
        // If no history, start with welcome message
        setMessages([
          {
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setConversationId(threadId);
        setSelectedConversationId(threadId); // Update store
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      
      // If conversation not found (404), clear the invalid conversation ID
      if (error.response?.status === 404) {
        setConversationId(null);
        sessionStorage.removeItem('chat_conversation_id');
        setSelectedConversationId(null);
        setMessages([
          {
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      } else {
        // For other errors, reset to welcome message but keep the conversation ID
        setMessages([
          {
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setConversationId(threadId);
        setSelectedConversationId(threadId); // Update store
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  /**
   * Send message to the backend API
   */
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message to chat immediately
    const userMessage = {
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }

    try {
      // Prepare request payload
      // For new conversations, conversation_id should be empty string
      // Only use conversationId if it's explicitly set (not null, not empty string)
      const conversationIdToUse = (conversationId && conversationId !== '') ? String(conversationId) : '';
    
      const payload = {
        question: messageText,
        conversation_id: conversationIdToUse,
      };

      // Call the API
      const response = await apiPost('/chatbot/send_message/', payload);

      // Extract response data
      const botResponse = response.data?.answer || response.data?.response || 'I apologize, but I could not process your request at this time.';
      
      // Update conversation ID if provided in response (only for new conversations)
      const newConversationId = response.data?.conversation_id || 
                                 response.data?.thread_id || 
                                 response.data?.id;
      if (newConversationId && (!conversationId || conversationId === '')) {
        // Only set conversation ID if we didn't have one before (new conversation)
        setConversationId(newConversationId);
        setSelectedConversationId(newConversationId); // Update store
        // Refresh conversations list to include the new conversation
        fetchConversations();
      } else if (newConversationId && conversationId && newConversationId !== conversationId) {
        // If conversation ID changed, update it
        setConversationId(newConversationId);
        setSelectedConversationId(newConversationId);
      }

      // Add bot response after a short delay for better UX
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: botResponse,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Chat API Error:', error);
      
      // Show error message to user
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            text: error.response?.data?.message || 
                  error.message || 
                  'Sorry, I encountered an error. Please try again later.',
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
      }, 500);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      sendMessage(inputMessage);
    }
  };

  /**
   * Handle Enter key press (submit) or Shift+Enter (new line)
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-12 z-50 w-10 h-10 md:w-14 md:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out text-white opacity-50 hover:opacity-100 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 scale-95'
            : 'bg-[#FF8132] hover:bg-[#EB5B00] hover:scale-110'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <FiX className="w-6 h-6 md:w-7 md:h-7" />
        ) : (
          <FiMessageCircle className="w-6 h-6 md:w-7 md:h-7" />
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[600px] max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        {/* Chat Header */}
        <div 
          className="text-white px-4 py-4 rounded-t-2xl flex items-center justify-between"
          style={{ 
            background: 'linear-gradient(to right, #FF8132, #EB5B00)' 
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FiMessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg">{botName}</h3>
              <p className="text-xs opacity-90">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigate('/dashboard/chat');
                setIsOpen(false);
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Open full screen chat"
              title="Open full screen chat"
            >
              <FiMaximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 relative">
          {/* Loading history indicator */}
          {isLoadingHistory && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-gray-600">
                <FiLoader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading conversation...</span>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <FiLoader className="w-5 h-5 text-gray-500 animate-spin" />
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-200 bg-white px-4 py-3 rounded-b-2xl"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none border rounded-lg px-4 py-2.5 text-sm md:text-base focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed overflow-y-auto transition-all"
              style={{ 
                maxHeight: '120px', 
                minHeight: '44px', 
                height: '44px',
                borderColor: '#d1d5db'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FF8132';
                e.target.style.boxShadow = '0 0 0 2px rgba(255, 129, 50, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 md:w-11 md:h-11 rounded-lg text-white flex items-center justify-center bg-[#FF8132] hover:bg-[#EB5B00] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300 transition-colors"
              aria-label="Send message"
            >
              {isLoading ? (
                <FiLoader className="w-5 h-5 animate-spin" />
              ) : (
                <FiSend className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ChatWidget;

