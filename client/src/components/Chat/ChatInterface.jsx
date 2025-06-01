import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { chatAPI } from '../../services/api';

import Sidebar from './Sidebar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import Header from './Header';
import LoadingSpinner from '../common/LoadingSpinner';
import FileUpload from './FileUpload';
import SettingsModal from './SettingsModal';

const ChatInterface = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, updateTokenUsage } = useAuth();
  const socket = useSocket();

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load specific conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      if (socket.isConnected) {
        socket.joinConversation(conversationId);
      }
    } else {
      setCurrentConversation(null);
      setMessages([]);
    }

    return () => {
      if (conversationId && socket.isConnected) {
        socket.leaveConversation(conversationId);
      }
    };
  }, [conversationId, socket.isConnected]);

  // Socket event listeners
  useEffect(() => {
    if (!socket.socket) return;

    // Message received
    socket.on('message_received', (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // Streaming events
    socket.on('stream_start', (data) => {
      if (data.conversationId === conversationId) {
        setIsStreaming(true);
        setStreamingMessage('');
      }
    });

    socket.on('stream_chunk', (data) => {
      if (data.conversationId === conversationId) {
        setStreamingMessage(data.fullContent);
      }
    });

    socket.on('stream_complete', (data) => {
      if (data.conversationId === conversationId) {
        setIsStreaming(false);
        setStreamingMessage('');
        setMessages(prev => [...prev, data.message]);

        // Update token usage
        if (data.message.metadata.tokensUsed) {
          updateTokenUsage(data.message.metadata.tokensUsed);
        }

        // Update conversation in sidebar
        setConversations(prev =>
          prev.map(conv =>
            conv.id === data.conversation.id
              ? { ...conv, ...data.conversation }
              : conv
          )
        );
      }
    });

    socket.on('stream_error', (data) => {
      if (data.conversationId === conversationId) {
        setIsStreaming(false);
        setStreamingMessage('');
        toast.error(data.message);
      }
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(u => u.userId !== data.userId), data];
        } else {
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    });

    // Cleanup
    return () => {
      socket.off('message_received');
      socket.off('stream_start');
      socket.off('stream_chunk');
      socket.off('stream_complete');
      socket.off('stream_error');
      socket.off('user_typing');
    };
  }, [socket.socket, conversationId, updateTokenUsage]);

  const loadConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id) => {
    try {
      setLoading(true);
      const response = await chatAPI.getConversation(id);
      const conversation = response.data.conversation;

      setCurrentConversation(conversation);
      setMessages(conversation.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
      navigate('/chat');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await chatAPI.createConversation({
        title: 'New Conversation'
      });

      const newConversation = response.data.conversation;
      setConversations(prev => [newConversation, ...prev]);
      navigate(`/chat/${newConversation.id}`);

      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  };

  const deleteConversation = async (id) => {
    try {
      await chatAPI.deleteConversation(id);
      setConversations(prev => prev.filter(conv => conv.id !== id));

      if (conversationId === id) {
        navigate('/chat');
      }

      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const sendMessage = async (content, useRAG = true) => {
    if (!content.trim()) return;

    let targetConversationId = conversationId;

    // Create new conversation if none exists
    if (!targetConversationId) {
      const newConversation = await createNewConversation();
      if (!newConversation) return;
      targetConversationId = newConversation.id;
    }

    // Send via socket for streaming
    if (socket.isConnected) {
      socket.sendStreamingMessage(targetConversationId, content, useRAG);
    } else {
      // Fallback to HTTP API
      try {
        const response = await chatAPI.sendMessage(targetConversationId, {
          content,
          useRAG
        });

        // Add messages to state
        setMessages(prev => [
          ...prev,
          { role: 'user', content, timestamp: new Date() },
          response.data.response
        ]);

        if (response.data.response.tokensUsed) {
          updateTokenUsage(response.data.response.tokensUsed);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message');
      }
    }
  };

  const handleTypingStart = () => {
    if (conversationId && socket.isConnected) {
      socket.sendTypingStart(conversationId);
    }
  };

  const handleTypingStop = () => {
    if (conversationId && socket.isConnected) {
      socket.sendTypingStop(conversationId);
    }
  };

  const handleUploadDocument = () => {
    setShowFileUpload(true);
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleUploadSuccess = (document) => {
    console.log('Document uploaded successfully:', document);
    toast.success(`Document "${document.filename}" uploaded successfully!`);
    setShowFileUpload(false);
  };

  if (loading && conversationId) {
    return <LoadingSpinner text="Loading conversation..." />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        currentConversationId={conversationId}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onSelectConversation={(id) => navigate(`/chat/${id}`)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-blue-50/30 to-indigo-100/40 dark:from-gray-800/50 dark:via-slate-800/30 dark:to-indigo-900/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]"></div>

        {/* Header */}
        <div className="relative z-10">
          <Header
            conversation={currentConversation}
            onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
            socketStatus={socket.getConnectionStatus()}
            onUploadDocument={handleUploadDocument}
            onOpenSettings={handleOpenSettings}
          />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden relative z-10">
          <MessageList
            messages={messages}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
            typingUsers={typingUsers}
            currentUser={user}
          />
        </div>

        {/* Input */}
        <div className="relative z-10">
          <MessageInput
            onSendMessage={sendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
            disabled={isStreaming}
            placeholder={
              conversationId
                ? "Type your message..."
                : "Start a new conversation..."
            }
          />
        </div>
      </div>

      {/* Modals */}
      {showFileUpload && (
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onClose={() => setShowFileUpload(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
