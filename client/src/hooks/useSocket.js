import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const useSocket = () => {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected the socket, try to reconnect manually
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      
      if (error.message.includes('Authentication')) {
        toast.error('Authentication failed. Please login again.');
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'Connection error');
    });

    // Welcome message
    socket.on('connected', (data) => {
      console.log('Welcome message:', data);
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, data.userName);
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });

      // Clear typing indicator after 3 seconds
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 3000);
      }
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, [isConnected]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  }, [isConnected]);

  // Send typing indicator
  const sendTypingStart = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', conversationId);
    }
  }, [isConnected]);

  const sendTypingStop = useCallback((conversationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', conversationId);
    }
  }, [isConnected]);

  // Send streaming message
  const sendStreamingMessage = useCallback((conversationId, content, useRAG = true) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message_stream', {
        conversationId,
        content,
        useRAG
      });
    }
  }, [isConnected]);

  // Add message reaction
  const addMessageReaction = useCallback((conversationId, messageId, reaction) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message_reaction', {
        conversationId,
        messageId,
        reaction
      });
    }
  }, [isConnected]);

  // Subscribe to events
  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  // Unsubscribe from events
  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Emit custom events
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return {
      isConnected,
      connectionError,
      socketId: socketRef.current?.id || null,
    };
  }, [isConnected, connectionError]);

  // Reconnect manually
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  // Get typing users for a conversation
  const getTypingUsers = useCallback(() => {
    return Array.from(typingUsers.values());
  }, [typingUsers]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    typingUsers: getTypingUsers(),
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
    sendStreamingMessage,
    addMessageReaction,
    on,
    off,
    emit,
    getConnectionStatus,
    reconnect,
  };
};

export default useSocket;
