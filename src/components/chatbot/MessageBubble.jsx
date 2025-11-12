import React from 'react';

/**
 * MessageBubble Component
 * Displays individual chat messages with different styles for user and bot messages
 */
const MessageBubble = ({ message, isUser, timestamp }) => {
  const formatTime = (date) => {
    if (!date) return '';
    const messageDate = date instanceof Date ? date : new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex w-full mb-6 animate-fade-in ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
        style={isUser ? { backgroundColor: '#FF8132' } : {}}
      >
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>
        <span
          className={`text-xs mt-2 block ${
            isUser ? 'text-white opacity-80' : 'text-gray-500'
          }`}
        >
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;

