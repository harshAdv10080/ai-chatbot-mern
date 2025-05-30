const aiService = require('./aiService');

class VectorStore {
  constructor() {
    this.vectors = new Map(); // In-memory storage for development
    this.metadata = new Map();
  }

  // Add document chunks to vector store
  async addDocument(documentId, chunks) {
    try {
      const vectors = [];

      // Store vectors and metadata
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${documentId}_${i}`;
        const vector = chunks[i].embedding || Array(1536).fill(0).map(() => Math.random() - 0.5);
        const metadata = {
          documentId,
          chunkIndex: i,
          content: chunks[i].content,
          ...chunks[i].metadata
        };

        this.vectors.set(chunkId, vector);
        this.metadata.set(chunkId, metadata);
        vectors.push(vector);
      }

      console.log(`Added ${chunks.length} chunks to vector store for document ${documentId}`);
      return vectors;

    } catch (error) {
      console.error('Error adding document to vector store:', error);
      throw error;
    }
  }

  // Search for similar content
  async search(query, options = {}) {
    try {
      const {
        limit = 5,
        threshold = 0.7,
        documentIds = null,
        userId = null
      } = options;

      // Generate embedding for query
      const queryEmbedding = await aiService.generateEmbedding(query);

      // Calculate similarities
      const similarities = [];

      for (const [chunkId, vector] of this.vectors.entries()) {
        const metadata = this.metadata.get(chunkId);

        // Filter by document IDs if specified
        if (documentIds && !documentIds.includes(metadata.documentId)) {
          continue;
        }

        // Filter by user ID if specified (would need to be added to metadata)
        if (userId && metadata.userId && metadata.userId !== userId) {
          continue;
        }

        const similarity = this.cosineSimilarity(queryEmbedding.embedding, vector);

        if (similarity >= threshold) {
          similarities.push({
            chunkId,
            similarity,
            content: metadata.content,
            metadata
          });
        }
      }

      // Sort by similarity and return top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('Error searching vector store:', error);
      throw error;
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Remove document from vector store
  removeDocument(documentId) {
    const removedChunks = [];

    for (const [chunkId, metadata] of this.metadata.entries()) {
      if (metadata.documentId === documentId) {
        this.vectors.delete(chunkId);
        this.metadata.delete(chunkId);
        removedChunks.push(chunkId);
      }
    }

    console.log(`Removed ${removedChunks.length} chunks for document ${documentId}`);
    return removedChunks.length;
  }

  // Get document chunks
  getDocumentChunks(documentId) {
    const chunks = [];

    for (const [chunkId, metadata] of this.metadata.entries()) {
      if (metadata.documentId === documentId) {
        chunks.push({
          chunkId,
          content: metadata.content,
          metadata
        });
      }
    }

    return chunks.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);
  }

  // Get store statistics
  getStats() {
    const documentCounts = new Map();

    for (const metadata of this.metadata.values()) {
      const count = documentCounts.get(metadata.documentId) || 0;
      documentCounts.set(metadata.documentId, count + 1);
    }

    return {
      totalChunks: this.vectors.size,
      totalDocuments: documentCounts.size,
      documentsWithChunks: Array.from(documentCounts.entries()).map(([docId, count]) => ({
        documentId: docId,
        chunkCount: count
      }))
    };
  }

  // Clear all data
  clear() {
    this.vectors.clear();
    this.metadata.clear();
    console.log('Vector store cleared');
  }

  // Export data (for backup/migration)
  export() {
    return {
      vectors: Array.from(this.vectors.entries()),
      metadata: Array.from(this.metadata.entries())
    };
  }

  // Import data (for backup/migration)
  import(data) {
    this.vectors = new Map(data.vectors);
    this.metadata = new Map(data.metadata);
    console.log(`Imported ${this.vectors.size} vectors and ${this.metadata.size} metadata entries`);
  }

  // Batch search for multiple queries
  async batchSearch(queries, options = {}) {
    const results = [];

    for (const query of queries) {
      try {
        const searchResults = await this.search(query, options);
        results.push({
          query,
          results: searchResults,
          success: true
        });
      } catch (error) {
        results.push({
          query,
          results: [],
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // Find similar documents based on content
  async findSimilarDocuments(documentId, options = {}) {
    const { limit = 5, threshold = 0.8 } = options;

    const documentChunks = this.getDocumentChunks(documentId);
    if (documentChunks.length === 0) {
      return [];
    }

    // Use the first chunk as representative content
    const representativeContent = documentChunks[0].content;

    const results = await this.search(representativeContent, {
      ...options,
      limit: limit * 3 // Get more results to filter out same document
    });

    // Filter out chunks from the same document and group by document
    const documentSimilarities = new Map();

    for (const result of results) {
      if (result.metadata.documentId === documentId) continue;

      const docId = result.metadata.documentId;
      const existing = documentSimilarities.get(docId);

      if (!existing || result.similarity > existing.similarity) {
        documentSimilarities.set(docId, result);
      }
    }

    return Array.from(documentSimilarities.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

module.exports = new VectorStore();
