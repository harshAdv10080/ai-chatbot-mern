const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const aiService = require('../services/aiService');
const vectorStore = require('../services/vectorStore');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Main socket handler
const chatSocket = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.name} connected: ${socket.id}`);

    // Join user to their personal room
    socket.join(`user_${socket.user._id}`);

    // Handle joining a conversation room
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user owns this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.user._id,
          isActive: true
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        socket.currentConversation = conversationId;

        socket.emit('joined_conversation', {
          conversationId,
          message: 'Successfully joined conversation'
        });

      } catch (error) {
        console.error('Join conversation error:', error);
        socket.emit('error', { message: 'Error joining conversation' });
      }
    });

    // Handle leaving a conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      if (socket.currentConversation === conversationId) {
        socket.currentConversation = null;
      }

      socket.emit('left_conversation', {
        conversationId,
        message: 'Left conversation'
      });
    });

    // Handle typing indicator
    socket.on('typing_start', (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', (conversationId) => {
      if (socket.currentConversation === conversationId) {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping: false
        });
      }
    });

    // Handle streaming chat messages
    socket.on('send_message_stream', async (data) => {
      try {
        const { conversationId, content, useRAG = true } = data;

        // Validate input
        if (!conversationId || !content || content.trim().length === 0) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Check token limits
        if (!socket.user.hasTokensAvailable(100)) {
          socket.emit('error', {
            message: 'Token limit exceeded',
            tokensUsed: socket.user.subscription.tokensUsed,
            tokensLimit: socket.user.subscription.tokensLimit
          });
          return;
        }

        // Get conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          user: socket.user._id,
          isActive: true
        });

        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        // Add user message
        await conversation.addMessage('user', content);

        // Emit user message to conversation room
        io.to(`conversation_${conversationId}`).emit('message_received', {
          conversationId,
          message: {
            role: 'user',
            content,
            timestamp: new Date(),
            metadata: {}
          }
        });

        // Prepare context for AI
        let contextContent = '';
        let sources = [];

        // Use RAG if enabled (temporarily disabled due to quota)
        if (false && useRAG && conversation.settings.ragEnabled) {
          try {
            const searchResults = await vectorStore.search(content, {
              limit: 5,
              threshold: 0.7
            });

            if (searchResults.length > 0) {
              contextContent = searchResults
                .map(result => result.content)
                .join('\n\n');

              sources = searchResults.map(result => result.metadata.documentId);
            }
          } catch (ragError) {
            console.error('RAG search error:', ragError);
          }
        }

        // Prepare messages for OpenAI
        const messages = [];

        if (contextContent) {
          messages.push({
            role: 'system',
            content: `You are a helpful AI assistant. Use the following context to answer the user's question accurately and helpfully.

Context from documents:
${contextContent}

User question: ${content}

Please provide a comprehensive answer based on the context provided. If the context doesn't contain relevant information, say so and provide a general response.`
          });
        } else {
          messages.push({
            role: 'system',
            content: conversation.context.systemPrompt
          });
        }

        const contextMessages = conversation.getContextMessages(10);
        messages.push(...contextMessages);

        // Start streaming response
        socket.emit('stream_start', { conversationId });

        let fullResponse = '';
        let tokensUsed = 0;

        // Generate streaming response using AI service
        const response = await aiService.generateStreamingResponse(messages, (chunk) => {
          const delta = chunk.choices[0]?.delta?.content || '';

          if (delta) {
            fullResponse += delta;

            // Emit chunk to conversation room
            io.to(`conversation_${conversationId}`).emit('stream_chunk', {
              conversationId,
              chunk: delta,
              fullContent: fullResponse
            });
          }
        }, {
          temperature: conversation.context.temperature,
          maxTokens: conversation.context.maxTokens
        });

        // Update final response and token usage
        fullResponse = response.content;
        tokensUsed = response.usage?.total_tokens || Math.ceil(fullResponse.length / 4);

        // Stream completed
        const processingTime = Date.now();

        // Add AI message to conversation
        await conversation.addMessage('assistant', fullResponse, {
          tokensUsed,
          model: 'gpt-4o-mini',
          processingTime,
          sources: [...new Set(sources)]
        });

        // Update user token usage
        await socket.user.useTokens(tokensUsed);

        // Emit stream completion
        io.to(`conversation_${conversationId}`).emit('stream_complete', {
          conversationId,
          message: {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
            metadata: {
              tokensUsed,
              processingTime,
              sources: sources.length > 0 ? sources : null
            }
          },
          conversation: {
            id: conversation._id,
            title: conversation.title,
            stats: conversation.stats
          }
        });

        // Update conversation title if it's the first exchange
        if (conversation.messages.length === 2) {
          await conversation.generateTitle();
        }

      } catch (error) {
        console.error('Streaming message error:', error);
        socket.emit('stream_error', {
          conversationId: data.conversationId,
          message: error.message || 'Error processing message'
        });
      }
    });

    // Handle message reactions (future feature)
    socket.on('message_reaction', async (data) => {
      try {
        const { conversationId, messageId, reaction } = data;

        // Emit reaction to conversation room
        io.to(`conversation_${conversationId}`).emit('reaction_added', {
          conversationId,
          messageId,
          reaction,
          userId: socket.user._id,
          userName: socket.user.name
        });

      } catch (error) {
        console.error('Message reaction error:', error);
        socket.emit('error', { message: 'Error adding reaction' });
      }
    });

    // Handle user status updates
    socket.on('update_status', (status) => {
      socket.to(`user_${socket.user._id}`).emit('status_updated', {
        userId: socket.user._id,
        status
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.name} disconnected: ${reason}`);

      // Notify conversation rooms about user leaving
      if (socket.currentConversation) {
        socket.to(`conversation_${socket.currentConversation}`).emit('user_typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          isTyping: false
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to chat server',
      user: {
        id: socket.user._id,
        name: socket.user.name,
        subscription: socket.user.subscription
      }
    });
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
};

module.exports = chatSocket;
