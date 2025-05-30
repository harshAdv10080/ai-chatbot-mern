const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const { auth, checkTokens } = require('../middleware/auth');
const Document = require('../models/Document');
const pdfProcessor = require('../services/pdfProcessor');
const vectorStore = require('../services/vectorStore');
const openaiService = require('../services/openai');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// @route   POST /api/upload
// @desc    Upload and process PDF file
// @access  Private
router.post('/', [auth, checkTokens(50)], upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;

    // Validate PDF
    await pdfProcessor.validatePDF(filePath);

    // Create document record
    const document = new Document({
      user: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: filePath,
      content: 'Processing...', // Will be filled after processing
      status: 'processing'
    });

    await document.save();

    // Process PDF in background
    processDocumentAsync(document._id, filePath, req.user);

    res.status(201).json({
      message: 'File uploaded successfully, processing started',
      document: {
        id: document._id,
        filename: document.originalName,
        size: document.size,
        status: document.status,
        uploadedAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }

    res.status(500).json({
      message: error.message || 'Error uploading file'
    });
  }
});

// Background processing function
async function processDocumentAsync(documentId, filePath, user) {
  try {
    const document = await Document.findById(documentId);
    if (!document) return;

    const startTime = Date.now();

    // Process PDF
    const result = await pdfProcessor.processPDF(filePath);

    // Generate embeddings for chunks (demo mode compatible)
    const chunksWithEmbeddings = [];
    for (const chunk of result.chunks) {
      try {
        if (openaiService.isConfigured()) {
          // Real mode: generate actual embeddings
          const embedding = await openaiService.generateEmbedding(chunk.content);
          chunksWithEmbeddings.push({
            ...chunk,
            embedding: embedding.embedding
          });
        } else {
          // Demo mode: create dummy embeddings
          chunksWithEmbeddings.push({
            ...chunk,
            embedding: Array(1536).fill(0).map(() => Math.random() - 0.5) // Dummy 1536-dim vector
          });
        }
      } catch (embeddingError) {
        console.error('Error generating embedding for chunk:', embeddingError);
        // Demo mode fallback: create dummy embedding
        chunksWithEmbeddings.push({
          ...chunk,
          embedding: Array(1536).fill(0).map(() => Math.random() - 0.5)
        });
      }
    }

    // Update document
    document.content = result.text;
    document.chunks = chunksWithEmbeddings;
    document.metadata = {
      ...document.metadata,
      ...result.metadata,
      processingTime: Date.now() - startTime
    };
    document.status = 'completed';

    await document.save();

    // Add to vector store
    await vectorStore.addDocument(documentId, chunksWithEmbeddings);

    // Update user token usage (only in real mode)
    if (openaiService.isConfigured()) {
      const tokensUsed = chunksWithEmbeddings.length * 10; // Estimate
      await user.useTokens(tokensUsed);
    }

    console.log(`Document ${documentId} processed successfully`);

  } catch (error) {
    console.error('Document processing error:', error);

    try {
      const document = await Document.findById(documentId);
      if (document) {
        document.status = 'failed';
        document.error = error.message;
        await document.save();
      }
    } catch (updateError) {
      console.error('Error updating document status:', updateError);
    }
  }
}

// @route   GET /api/upload/documents
// @desc    Get user's uploaded documents
// @access  Private
router.get('/documents', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const options = {
      status,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const documents = await Document.findByUser(req.user._id, options);
    const total = await Document.countDocuments({
      user: req.user._id,
      isActive: true,
      ...(status && { status })
    });

    res.json({
      documents: documents.map(doc => doc.getSummary()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      message: 'Error retrieving documents'
    });
  }
});

// @route   GET /api/upload/documents/:id
// @desc    Get specific document details
// @access  Private
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
      isActive: true
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    res.json({
      document: {
        ...document.getSummary(),
        content: document.status === 'completed' ? document.content.substring(0, 1000) + '...' : null,
        metadata: document.metadata
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      message: 'Error retrieving document'
    });
  }
});

// @route   DELETE /api/upload/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/documents/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found'
      });
    }

    // Remove from vector store
    vectorStore.removeDocument(document._id);

    // Mark as inactive (soft delete)
    document.isActive = false;
    await document.save();

    // Clean up file
    try {
      await fs.unlink(document.path);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      message: 'Error deleting document'
    });
  }
});

// @route   POST /api/upload/documents/:id/search
// @desc    Search within a specific document
// @access  Private
router.post('/documents/:id/search', auth, async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        message: 'Search query is required'
      });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'completed',
      isActive: true
    });

    if (!document) {
      return res.status(404).json({
        message: 'Document not found or not ready'
      });
    }

    // Search using vector store
    const results = await vectorStore.search(query, {
      limit: parseInt(limit),
      documentIds: [document._id.toString()]
    });

    res.json({
      query,
      results: results.map(result => ({
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata
      })),
      document: document.getSummary()
    });

  } catch (error) {
    console.error('Document search error:', error);
    res.status(500).json({
      message: 'Error searching document'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large'
      });
    }
  }

  res.status(500).json({
    message: error.message || 'Upload error'
  });
});

module.exports = router;
