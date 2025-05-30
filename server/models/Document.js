const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number], // Vector embedding
    required: false,
    default: []
  },
  metadata: {
    page: Number,
    startIndex: Number,
    endIndex: Number,
    chunkIndex: Number
  }
});

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: false,
    default: ''
  },
  chunks: [chunkSchema],
  metadata: {
    pageCount: {
      type: Number,
      default: 0
    },
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    language: {
      type: String,
      default: 'en'
    },
    extractedAt: {
      type: Date,
      default: Date.now
    },
    processingTime: {
      type: Number, // in milliseconds
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  error: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, status: 1 });
documentSchema.index({ filename: 1 });

// Calculate metadata before saving
documentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.metadata.characterCount = this.content.length;
    this.metadata.wordCount = this.content.split(/\s+/).filter(word => word.length > 0).length;
  }
  next();
});

// Method to search similar chunks
documentSchema.methods.findSimilarChunks = function(queryEmbedding, limit = 5, threshold = 0.7) {
  // Simple cosine similarity calculation
  const calculateSimilarity = (embedding1, embedding2) => {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  };

  const similarities = this.chunks.map(chunk => ({
    chunk,
    similarity: calculateSimilarity(queryEmbedding, chunk.embedding)
  }));

  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => ({
      content: item.chunk.content,
      similarity: item.similarity,
      metadata: item.chunk.metadata
    }));
};

// Method to get document summary
documentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    filename: this.originalName,
    size: this.size,
    pageCount: this.metadata.pageCount,
    wordCount: this.metadata.wordCount,
    status: this.status,
    uploadedAt: this.createdAt,
    chunksCount: this.chunks?.length || 0
  };
};

// Static method to find documents by user
documentSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId, isActive: true };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .select(options.select || '-content -chunks');
};

// Static method to search across user's documents
documentSchema.statics.searchUserDocuments = async function(userId, queryEmbedding, options = {}) {
  const documents = await this.find({
    user: userId,
    status: 'completed',
    isActive: true
  });

  const allResults = [];

  for (const doc of documents) {
    const similarChunks = doc.findSimilarChunks(
      queryEmbedding,
      options.chunksPerDoc || 3,
      options.threshold || 0.7
    );

    similarChunks.forEach(chunk => {
      allResults.push({
        ...chunk,
        documentId: doc._id,
        documentName: doc.originalName
      });
    });
  }

  // Sort all results by similarity and return top results
  return allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.limit || 10);
};

module.exports = mongoose.model('Document', documentSchema);
