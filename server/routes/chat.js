const express = require('express');
const { body, validationResult } = require('express-validator');

const { auth, checkTokens } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Document = require('../models/Document');
const aiService = require('../services/aiService');
const vectorStore = require('../services/vectorStore');

const router = express.Router();

// @route   POST /api/chat/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', auth, async (req, res) => {
  try {
    const { title, systemPrompt, settings } = req.body;

    const conversation = new Conversation({
      user: req.user._id,
      title: title || 'New Conversation',
      context: {
        systemPrompt: systemPrompt || 'You are a helpful AI assistant. Provide accurate, helpful, and concise responses.',
        ...req.body.context
      },
      settings: {
        ragEnabled: true,
        streamingEnabled: true,
        memoryEnabled: true,
        ...settings
      }
    });

    await conversation.save();

    res.status(201).json({
      message: 'Conversation created successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        settings: conversation.settings,
        stats: conversation.stats
      }
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      message: 'Error creating conversation'
    });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      user: req.user._id,
      isActive: true
    })
    .sort({ lastActivity: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .select('-messages'); // Exclude messages for list view

    const total = await Conversation.countDocuments({
      user: req.user._id,
      isActive: true
    });

    res.json({
      conversations: conversations.map(conv => ({
        id: conv._id,
        title: conv.title,
        lastActivity: conv.lastActivity,
        stats: conv.stats,
        settings: conv.settings,
        createdAt: conv.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      message: 'Error retrieving conversations'
    });
  }
});

// @route   GET /api/chat/conversations/:id
// @desc    Get specific conversation with messages
// @access  Private
router.get('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    }).populate('context.documents', 'originalName size status');

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    res.json({
      conversation: {
        id: conversation._id,
        title: conversation.title,
        messages: conversation.messages,
        context: conversation.context,
        settings: conversation.settings,
        stats: conversation.stats,
        createdAt: conversation.createdAt,
        lastActivity: conversation.lastActivity
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      message: 'Error retrieving conversation'
    });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message in a conversation
// @access  Private
router.post('/conversations/:id/messages', [
  auth,
  checkTokens(100),
  body('content')
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message content must be between 1 and 4000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { content, useRAG = true } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    const startTime = Date.now();

    // Add user message
    await conversation.addMessage('user', content);

    // Prepare context for AI
    let contextContent = '';
    let sources = [];

    // Use RAG if enabled and user has documents
    if (useRAG && conversation.settings.ragEnabled) {
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
        // Continue without RAG if it fails
      }
    }

    // Prepare messages for OpenAI
    const messages = [];

    // Add system message with context if available
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

    // Add conversation history
    const contextMessages = conversation.getContextMessages(10);
    messages.push(...contextMessages);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(messages, {
      temperature: conversation.context.temperature,
      maxTokens: conversation.context.maxTokens
    });

    // Add AI message
    await conversation.addMessage('assistant', aiResponse.content, {
      tokensUsed: aiResponse.usage?.total_tokens || 0,
      model: aiResponse.provider || 'ai-service',
      processingTime: Date.now() - startTime,
      sources: [...new Set(sources)] // Remove duplicates
    });

    // Update conversation title if it's the first exchange
    if (conversation.messages.length === 2) {
      await conversation.generateTitle();
    }

    // Update user token usage
    await req.user.useTokens(aiResponse.usage?.total_tokens || 0);

    const totalTime = Date.now() - startTime;

    res.json({
      message: 'Message sent successfully',
      response: {
        content: aiResponse.content,
        tokensUsed: aiResponse.usage?.total_tokens || 0,
        processingTime: totalTime,
        sources: sources.length > 0 ? sources : null,
        provider: aiResponse.provider
      },
      conversation: {
        id: conversation._id,
        title: conversation.title,
        stats: conversation.stats
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: error.message || 'Error sending message'
    });
  }
});

// @route   DELETE /api/chat/conversations/:id
// @desc    Delete a conversation
// @access  Private
router.delete('/conversations/:id', auth, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    conversation.isActive = false;
    await conversation.save();

    res.json({
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      message: 'Error deleting conversation'
    });
  }
});

// @route   PUT /api/chat/conversations/:id
// @desc    Update conversation settings
// @access  Private
router.put('/conversations/:id', auth, async (req, res) => {
  try {
    const { title, settings, context } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        message: 'Conversation not found'
      });
    }

    if (title) conversation.title = title;
    if (settings) conversation.settings = { ...conversation.settings, ...settings };
    if (context) conversation.context = { ...conversation.context, ...context };

    await conversation.save();

    res.json({
      message: 'Conversation updated successfully',
      conversation: {
        id: conversation._id,
        title: conversation.title,
        settings: conversation.settings,
        context: conversation.context
      }
    });

  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({
      message: 'Error updating conversation'
    });
  }
});

// @route   POST /api/chat/search
// @desc    Search across all user documents
// @access  Private
router.post('/search', [
  auth,
  body('query')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Search query must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { query, limit = 10, threshold = 0.7 } = req.body;

    const results = await vectorStore.search(query, {
      limit: parseInt(limit),
      threshold: parseFloat(threshold)
    });

    res.json({
      query,
      results: results.map(result => ({
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata
      })),
      total: results.length
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'Error performing search'
    });
  }
});

// @route   POST /api/chat/generate/summary
// @desc    Generate summary of text or document
// @access  Private
router.post('/generate/summary', [
  auth,
  checkTokens(50),
  body('text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10000 characters'),
  body('documentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid document ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text, documentId, maxLength = 200 } = req.body;

    let contentToSummarize = text;

    if (documentId) {
      const document = await Document.findOne({
        _id: documentId,
        user: req.user._id,
        status: 'completed',
        isActive: true
      });

      if (!document) {
        return res.status(404).json({
          message: 'Document not found or not ready'
        });
      }

      contentToSummarize = document.content;
    }

    if (!contentToSummarize) {
      return res.status(400).json({
        message: 'Either text or documentId must be provided'
      });
    }

    // Generate summary using AI service
    const summaryResponse = await aiService.generateResponse([
      {
        role: 'system',
        content: `You are a helpful assistant that creates concise summaries. Create a summary of the following text in approximately ${maxLength} words.`
      },
      {
        role: 'user',
        content: contentToSummarize
      }
    ]);

    // Update user token usage
    await req.user.useTokens(summaryResponse.usage?.total_tokens || 0);

    res.json({
      summary: summaryResponse.content,
      tokensUsed: summaryResponse.usage?.total_tokens || 0,
      originalLength: contentToSummarize.length,
      summaryLength: summaryResponse.content.length,
      provider: summaryResponse.provider
    });

  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({
      message: error.message || 'Error generating summary'
    });
  }
});

// @route   POST /api/chat/generate/flashcards
// @desc    Generate flashcards from text or document
// @access  Private
router.post('/generate/flashcards', [
  auth,
  checkTokens(75),
  body('text')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text must be between 1 and 10000 characters'),
  body('documentId')
    .optional()
    .isMongoId()
    .withMessage('Invalid document ID'),
  body('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Count must be between 1 and 20')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { text, documentId, count = 5 } = req.body;

    let contentToProcess = text;

    if (documentId) {
      const document = await Document.findOne({
        _id: documentId,
        user: req.user._id,
        status: 'completed',
        isActive: true
      });

      if (!document) {
        return res.status(404).json({
          message: 'Document not found or not ready'
        });
      }

      contentToProcess = document.content;
    }

    if (!contentToProcess) {
      return res.status(400).json({
        message: 'Either text or documentId must be provided'
      });
    }

    // Generate flashcards using AI service
    const flashcardsResponse = await aiService.generateResponse([
      {
        role: 'system',
        content: `You are a helpful assistant that creates educational flashcards. Create exactly ${count} flashcards from the following text. Format each flashcard as JSON with "question" and "answer" fields. Return only a JSON array of flashcards.`
      },
      {
        role: 'user',
        content: contentToProcess
      }
    ]);

    let flashcards = [];
    try {
      // Try to parse the response as JSON
      flashcards = JSON.parse(flashcardsResponse.content);
    } catch (parseError) {
      // If parsing fails, create a simple flashcard
      flashcards = [{
        question: "What is the main topic of this content?",
        answer: flashcardsResponse.content.substring(0, 200) + "..."
      }];
    }

    // Update user token usage
    await req.user.useTokens(flashcardsResponse.usage?.total_tokens || 0);

    res.json({
      flashcards,
      count: flashcards.length,
      tokensUsed: flashcardsResponse.usage?.total_tokens || 0,
      provider: flashcardsResponse.provider
    });

  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({
      message: error.message || 'Error generating flashcards'
    });
  }
});

module.exports = router;
