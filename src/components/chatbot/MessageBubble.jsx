import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * MessageBubble Component
 * Displays individual chat messages with different styles for user and bot messages
 * Uses react-markdown to render markdown content in AI responses
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
        <div className="text-sm md:text-base leading-relaxed break-words markdown-content">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => (
                  <p className="mb-2 last:mb-0" {...props} />
                ),
                h1: ({ node, ...props }) => (
                  <h1 className="text-xl font-bold mb-2 mt-3 first:mt-0" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-base font-semibold mb-2 mt-2 first:mt-0" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="ml-2" {...props} />
                ),
                code: ({ node, inline, ...props }) => {
                  const className = inline
                    ? 'bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono'
                    : 'block bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto my-2';
                  return <code className={className} {...props} />;
                },
                pre: ({ node, ...props }) => (
                  <pre className="bg-gray-200 p-2 rounded text-sm font-mono overflow-x-auto my-2" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-gray-400 pl-3 italic my-2" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse border border-gray-300 text-sm" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gray-200" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr className="border-b border-gray-300" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-gray-300 px-3 py-2" {...props} />
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          )}
        </div>
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

