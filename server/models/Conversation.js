const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    tokensUsed: {
      type: Number,
      default: 0
    },
    model: {
      type: String,
      default: 'gpt-4'
    },
    processingTime: {
      type: Number, // in milliseconds
      default: 0
    },
    sources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }]
  }
});

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  messages: [messageSchema],
  context: {
    documents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    systemPrompt: {
      type: String,
      default: 'You are a helpful AI assistant. Provide accurate, helpful, and concise responses.'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000,
      min: 1,
      max: 4000
    }
  },
  settings: {
    ragEnabled: {
      type: Boolean,
      default: true
    },
    streamingEnabled: {
      type: Boolean,
      default: true
    },
    memoryEnabled: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ user: 1, createdAt: -1 });
conversationSchema.index({ user: 1, lastActivity: -1 });
conversationSchema.index({ 'messages.timestamp': -1 });

// Update last activity on message add
conversationSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastActivity = new Date();
    this.stats.totalMessages = this.messages.length;
    
    // Calculate total tokens used
    this.stats.totalTokensUsed = this.messages.reduce((total, msg) => {
      return total + (msg.metadata.tokensUsed || 0);
    }, 0);
    
    // Calculate average response time for assistant messages
    const assistantMessages = this.messages.filter(msg => 
      msg.role === 'assistant' && msg.metadata.processingTime > 0
    );
    
    if (assistantMessages.length > 0) {
      this.stats.averageResponseTime = assistantMessages.reduce((total, msg) => {
        return total + msg.metadata.processingTime;
      }, 0) / assistantMessages.length;
    }
  }
  next();
});

// Method to add a message
conversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata: {
      tokensUsed: metadata.tokensUsed || 0,
      model: metadata.model || 'gpt-4',
      processingTime: metadata.processingTime || 0,
      sources: metadata.sources || []
    }
  });
  
  return this.save();
};

// Method to get conversation context for AI
conversationSchema.methods.getContextMessages = function(limit = 10) {
  // Get last N messages for context, excluding system messages
  return this.messages
    .filter(msg => msg.role !== 'system')
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

// Method to update title based on first user message
conversationSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage && this.title === 'New Conversation') {
    // Take first 50 characters of the first user message
    this.title = firstUserMessage.content.substring(0, 50) + 
                 (firstUserMessage.content.length > 50 ? '...' : '');
  }
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
