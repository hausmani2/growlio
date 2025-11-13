import React, { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiSend, FiLoader, FiPlus, FiTrash2, FiMoreVertical, FiMenu, FiX, FiEdit2 } from 'react-icons/fi';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/axiosInterceptors';
import { message, Modal } from 'antd';
import useStore from '../../../store/store';
import MessageBubble from '../../chatbot/MessageBubble';

/**
 * ChatPage Component
 * A full-page ChatGPT-like interface with conversation threads
 */
const ChatPage = () => {
  const { selectedConversationId: storeConversationId, setSelectedConversationId } = useStore();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationIdLocal] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  const [showMenuId, setShowMenuId] = useState(null);
  
  // Close sidebar on mobile by default and prevent body scroll when sidebar is open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else if (window.innerWidth >= 768 && !sidebarOpen) {
        // Only auto-open on desktop if it was closed
        setSidebarOpen(true);
      }
    };
    
    // Set initial state
    const isMobile = window.innerWidth < 768;
    setSidebarOpen(!isMobile);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const inputContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversationId && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [selectedConversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load conversation from store if available
  useEffect(() => {
    if (storeConversationId) {
      // Convert to string for comparison to handle number/string mismatches
      const storeIdStr = String(storeConversationId);
      const selectedIdStr = selectedConversationId ? String(selectedConversationId) : null;
      
      if (storeIdStr !== selectedIdStr) {
        loadConversationHistory(storeConversationId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeConversationId]);

  /**
   * Fetch all conversations for the logged-in user
   */
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await apiGet('/chatbot/conversations/');
      
      // Handle the new API response format: { detail: "...", data: [...] }
      const conversationsList = response.data?.data || response.data?.results || response.data?.conversations || response.data || [];
      const formattedConversations = Array.isArray(conversationsList) 
        ? conversationsList.map(conv => ({
            id: conv.thread_id || conv.id || conv.conversation_id,
            title: conv.title || getConversationTitle(conv),
            lastMessage: conv.last_message || conv.message || '',
            updatedAt: conv.updated_at || conv.updated || conv.created_at || conv.created,
            createdAt: conv.created_at || conv.created,
          }))
        : [];
      
      setConversations(formattedConversations);
      
      // Auto-select the most recent conversation only if no conversation is selected from store
      if (formattedConversations.length > 0 && !selectedConversationId && !storeConversationId) {
        const mostRecent = formattedConversations[0];
        if (mostRecent.id) {
          loadConversationHistory(mostRecent.id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  /**
   * Generate a title from conversation data
   */
  const getConversationTitle = (conv) => {
    if (conv.title) return conv.title;
    if (conv.last_message) {
      return conv.last_message.length > 30 
        ? conv.last_message.substring(0, 30) + '...' 
        : conv.last_message;
    }
    // If no title and no last message, generate a default title
    if (conv.created_at) {
      const date = new Date(conv.created_at);
      return `Conversation ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'New Conversation';
  };

  /**
   * Load conversation history for a specific thread
   */
  const loadConversationHistory = async (threadId) => {
    if (!threadId) return;

    try {
      setIsLoadingHistory(true);
      setSelectedConversationIdLocal(threadId);
      setSelectedConversationId(threadId); // Update store
      const response = await apiGet(`/chatbot/conversation/${threadId}/`);
      
      // Handle different response formats
      const history = response.data?.messages || response.data?.history || response.data || [];
      
      if (Array.isArray(history) && history.length > 0) {
        // Convert API response to message format
        const formattedMessages = history.map((msg) => {
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
      } else {
        // If no history, start with welcome message
        setMessages([
          {
            text: "Hello! I'm here to help you. How can I assist you today?",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      setMessages([
        {
          text: "Hello! I'm here to help you. How can I assist you today?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  /**
   * Start a new conversation
   */
  const startNewConversation = () => {
    setSelectedConversationIdLocal(null);
    setSelectedConversationId(null); // Update store
    setMessages([
      {
        text: "Hello! I'm here to help you. How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    setInputMessage('');
    
    // Close sidebar on mobile after starting new conversation
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    // Focus input after a short delay to ensure it's rendered
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  /**
   * Rename conversation title
   */
  const handleRenameConversation = async (threadId, newTitle) => {
    if (!newTitle.trim()) {
      setEditingConversationId(null);
      setEditingTitle('');
      return;
    }

    try {
      const response = await apiPut(`/chatbot/conversation/${threadId}/`, {
        title: newTitle.trim(),
      });

      if (response.data) {
        message.success('Conversation renamed successfully');
        // Update local state
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === threadId ? { ...conv, title: newTitle.trim() } : conv
          )
        );
        setEditingConversationId(null);
        setEditingTitle('');
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      message.error(error.response?.data?.message || 'Failed to rename conversation');
      setEditingConversationId(null);
      setEditingTitle('');
    }
  };

  /**
   * Delete conversation thread
   */
  const handleDeleteConversation = (threadId) => {
    Modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiDelete(`/chatbot/conversation/${threadId}/`);

          message.success('Conversation deleted successfully');
          
          // Remove from local state
          setConversations((prev) => prev.filter((conv) => conv.id !== threadId));
          
      // If deleted conversation was selected, clear it
      if (selectedConversationId === threadId) {
        setSelectedConversationIdLocal(null);
        setSelectedConversationId(null); // Update store
            setMessages([
              {
                text: "Hello! I'm here to help you. How can I assist you today?",
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (error) {
          console.error('Error deleting conversation:', error);
          message.error(error.response?.data?.message || 'Failed to delete conversation');
        }
      },
    });
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
    if (textareaRef.current) {
      textareaRef.current.style.height = '36px';
    }

    try {
      // Prepare request payload
      const payload = {
        question: messageText,
        conversation_id: selectedConversationId || '',
      };

      // Call the API
      const response = await apiPost('/chatbot/send_message/', payload);

      // Extract response data
      const botResponse = response.data?.answer || response.data?.response || 'I apologize, but I could not process your request at this time.';
      
      // Update conversation ID if provided in response
      const newConversationId = response.data?.thread_id || 
                                 response.data?.conversation_id || 
                                 response.data?.id;
      
      if (newConversationId && newConversationId !== selectedConversationId) {
        setSelectedConversationIdLocal(newConversationId);
        setSelectedConversationId(newConversationId); // Update store
        // Refresh conversations list to include the new conversation
        setTimeout(() => {
          fetchConversations();
        }, 500);
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

  /**
   * Auto-resize textarea
   */
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate difference in days
    const diffTime = today - messageDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Today - show time
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Yesterday
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    // 2-6 days ago
    if (diffDays >= 2 && diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // 7+ days ago - show date
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    }
    
    // Older than 30 days - show full date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="flex h-full bg-white absolute inset-0 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar - Conversation Threads */}
      <div 
        className={`${
          sidebarOpen 
            ? 'w-full sm:w-80 md:w-64 lg:w-80 translate-x-0' 
            : 'w-0 -translate-x-full md:translate-x-0'
        } border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative flex-shrink-0 z-50 md:z-auto`}
      >
        {/* Sidebar Header */}
        <div className={`border-b border-gray-200 bg-white flex-shrink-0 h-[60px] p-2 sm:p-3 flex items-center gap-2 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={startNewConversation}
            className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg text-white font-medium transition-all active:scale-95 touch-manipulation text-sm sm:text-base"
            style={{ backgroundColor: '#FF8132' }}
            onMouseEnter={(e) => {
              if (window.innerWidth >= 768) {
                e.target.style.backgroundColor = '#EB5B00';
              }
            }}
            onMouseLeave={(e) => {
              if (window.innerWidth >= 768) {
                e.target.style.backgroundColor = '#FF8132';
              }
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.backgroundColor = '#EB5B00';
            }}
            onTouchEnd={(e) => {
              setTimeout(() => {
                e.currentTarget.style.backgroundColor = '#FF8132';
              }, 150);
            }}
          >
            <FiPlus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="truncate">New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex-shrink-0 touch-manipulation "
            aria-label="Hide sidebar"
            title="Hide conversations"
          >
            <FiX className="w-5 h-5 text-gray-600 " />
          </button>
        </div>

        {/* Conversations List */}
        <div className={`flex-1 overflow-y-auto thin-scrollbar transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {isLoadingConversations ? (
            <div className="flex items-center justify-center p-8">
              <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative w-full rounded-lg mb-1 transition-colors ${
                    selectedConversationId === conversation.id
                      ? 'bg-white shadow-sm'
                      : 'hover:bg-gray-100'
                  }`}
                  style={
                    selectedConversationId === conversation.id
                      ? { borderLeft: '3px solid #FF8132', paddingLeft: '13px' }
                      : { paddingLeft: '16px' }
                  }
                  onMouseEnter={() => setHoveredConversationId(conversation.id)}
                  onMouseLeave={() => {
                    setHoveredConversationId(null);
                    setShowMenuId(null);
                  }}
                >
                  {editingConversationId === conversation.id ? (
                    // Edit mode
                    <div className="p-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameConversation(conversation.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            setEditingConversationId(null);
                            setEditingTitle('');
                          }
                        }}
                        onBlur={() => {
                          if (editingTitle.trim()) {
                            handleRenameConversation(conversation.id, editingTitle);
                          } else {
                            setEditingConversationId(null);
                            setEditingTitle('');
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        autoFocus
                        placeholder="Enter conversation title..."
                      />
                      <button
                        onClick={() => {
                          if (editingTitle.trim()) {
                            handleRenameConversation(conversation.id, editingTitle);
                          } else {
                            setEditingConversationId(null);
                            setEditingTitle('');
                          }
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <FiSend className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingConversationId(null);
                          setEditingTitle('');
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <FiX className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          loadConversationHistory(conversation.id);
                          // Close sidebar on mobile after selecting conversation
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
                          }
                        }}
                        className="flex-1 text-left p-3 rounded-lg transition-colors touch-manipulation active:bg-gray-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-tight truncate" title={conversation.title}>
                              {conversation.title.length > 25
                                ? conversation.title.substring(0, 25) + '...'
                                : conversation.title}
                            </p>
                            {conversation.lastMessage && (
                              <p className="text-xs text-gray-500 truncate mt-1.5 leading-relaxed">
                                {conversation.lastMessage.length > 35
                                  ? conversation.lastMessage.substring(0, 35) + '...'
                                  : conversation.lastMessage}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5 leading-tight">
                              {formatDate(conversation.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                      {/* Menu Button */}
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenuId(showMenuId === conversation.id ? null : conversation.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            showMenuId === conversation.id || hoveredConversationId === conversation.id
                              ? ' opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                          aria-label="Conversation options"
                        >
                          <FiMoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showMenuId === conversation.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40"
                              onClick={() => setShowMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[140px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTitle(conversation.title);
                                  setEditingConversationId(conversation.id);
                                  setShowMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg transition-colors"
                              >
                                <FiEdit2 className="w-4 h-4" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation.id);
                                  setShowMenuId(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg transition-colors"
                              >
                                <FiTrash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden">
        {/* Chat Header */}
        <div 
          className="px-2 sm:px-3 md:px-4  border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 min-h-[60px]"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {!sidebarOpen && (
            <>


            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors relative touch-manipulation flex-shrink-0"
              aria-label={ 'Show sidebar'}
              title={'Show conversations'}
              >
                  <FiMenu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 " />
                  </button>
                  </>
              )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 leading-tight truncate">Growlio Assistant</h2>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">AI-powered restaurant assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 relative thin-scrollbar">
          {/* Loading history indicator */}
          {isLoadingHistory && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-gray-600">
                <FiLoader className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading conversation...</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className={`mx-auto px-2 sm:px-3 md:px-4 py-3 sm:py-4 transition-all duration-300 ease-in-out w-full box-border ${
            sidebarOpen 
              ? 'max-w-full md:max-w-3xl' 
              : 'max-w-full md:max-w-5xl'
          }`}>
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="text-center py-16">
                <div 
                  className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{ backgroundColor: '#FF8132' }}
                >
                  <FiMessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 text-sm">
                  Ask me anything about your restaurant management
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message.text}
                  isUser={message.isUser}
                  timestamp={message.timestamp}
                />
              ))
            )}

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
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white overflow-x-hidden">
          <form onSubmit={handleSubmit} className={`mx-auto p-2 sm:p-3 md:p-4 transition-all duration-300 ease-in-out w-full ${
            sidebarOpen 
              ? 'max-w-full md:max-w-3xl' 
              : 'max-w-full md:max-w-5xl'
          }`}>
            <div 
              ref={inputContainerRef}
              className="flex justify-center items-end gap-2 sm:gap-3 bg-white rounded-2xl border border-gray-300 p-2 sm:p-3 transition-all"
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  if (inputContainerRef.current) {
                    inputContainerRef.current.style.borderColor = '#FF8132';
                    inputContainerRef.current.style.boxShadow = '0 0 0 2px rgba(255, 129, 50, 0.2)';
                  }
                }}
                onBlur={() => {
                  if (inputContainerRef.current) {
                    inputContainerRef.current.style.borderColor = '#d1d5db';
                    inputContainerRef.current.style.boxShadow = 'none';
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none border-none outline-none text-sm sm:text-base bg-transparent disabled:cursor-not-allowed overflow-y-auto leading-relaxed"
                style={{ 
                  maxHeight: '200px', 
                  minHeight: '36px',
                  lineHeight: '1.5'
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 touch-manipulation active:opacity-80 active:scale-95"
                style={{ backgroundColor: inputMessage.trim() && !isLoading ? '#FF8132' : '#d1d5db' }}
                onMouseEnter={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.target.style.backgroundColor = '#EB5B00';
                  }
                }}
                onMouseLeave={(e) => {
                  if (inputMessage.trim() && !isLoading) {
                    e.target.style.backgroundColor = '#FF8132';
                  }
                }}
                aria-label="Send message"
              >
                {isLoading ? (
                  <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <FiSend className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 sm:mt-3 text-center hidden sm:block">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

