const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const path = require('path');

class PDFProcessor {
  constructor() {
    this.chunkSize = 1000; // Characters per chunk
    this.chunkOverlap = 200; // Overlap between chunks
  }

  // Extract text from PDF file
  async extractText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        text: pdfData.text,
        pageCount: pdfData.numpages,
        metadata: {
          info: pdfData.info,
          version: pdfData.version
        }
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Split text into chunks for vector storage
  splitIntoChunks(text, options = {}) {
    const {
      chunkSize = this.chunkSize,
      chunkOverlap = this.chunkOverlap,
      preserveParagraphs = true
    } = options;

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    let startIndex = 0;

    // Clean the text
    const cleanText = this.cleanText(text);

    while (startIndex < cleanText.length) {
      let endIndex = startIndex + chunkSize;
      
      // If we're not at the end of the text, try to find a good break point
      if (endIndex < cleanText.length && preserveParagraphs) {
        // Look for paragraph breaks first
        const paragraphBreak = cleanText.lastIndexOf('\n\n', endIndex);
        if (paragraphBreak > startIndex) {
          endIndex = paragraphBreak;
        } else {
          // Look for sentence breaks
          const sentenceBreak = cleanText.lastIndexOf('. ', endIndex);
          if (sentenceBreak > startIndex) {
            endIndex = sentenceBreak + 1;
          } else {
            // Look for word breaks
            const wordBreak = cleanText.lastIndexOf(' ', endIndex);
            if (wordBreak > startIndex) {
              endIndex = wordBreak;
            }
          }
        }
      }

      const chunk = cleanText.slice(startIndex, endIndex).trim();
      
      if (chunk.length > 0) {
        chunks.push({
          content: chunk,
          metadata: {
            startIndex,
            endIndex,
            chunkIndex: chunks.length,
            length: chunk.length
          }
        });
      }

      // Move start index, accounting for overlap
      startIndex = Math.max(endIndex - chunkOverlap, startIndex + 1);
      
      // Prevent infinite loop
      if (startIndex >= cleanText.length) break;
    }

    return chunks;
  }

  // Clean extracted text
  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (basic patterns)
      .replace(/^\d+\s*$/gm, '')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  // Process PDF file completely
  async processPDF(filePath, options = {}) {
    try {
      const startTime = Date.now();
      
      // Extract text
      const extraction = await this.extractText(filePath);
      
      // Split into chunks
      const chunks = this.splitIntoChunks(extraction.text, options);
      
      const processingTime = Date.now() - startTime;
      
      return {
        text: extraction.text,
        chunks,
        metadata: {
          ...extraction.metadata,
          pageCount: extraction.pageCount,
          wordCount: this.countWords(extraction.text),
          characterCount: extraction.text.length,
          chunkCount: chunks.length,
          processingTime
        }
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      throw error;
    }
  }

  // Count words in text
  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Validate PDF file
  async validatePDF(filePath) {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext !== '.pdf') {
        throw new Error('File is not a PDF');
      }
      
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('PDF file is too large (max 50MB)');
      }
      
      // Try to read the first few bytes to check if it's a valid PDF
      const buffer = Buffer.alloc(5);
      const fileHandle = await fs.open(filePath, 'r');
      await fileHandle.read(buffer, 0, 5, 0);
      await fileHandle.close();
      
      if (buffer.toString() !== '%PDF-') {
        throw new Error('File is not a valid PDF');
      }
      
      return true;
    } catch (error) {
      throw new Error(`PDF validation failed: ${error.message}`);
    }
  }

  // Extract metadata from PDF
  async extractMetadata(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      return {
        pageCount: pdfData.numpages,
        info: pdfData.info || {},
        version: pdfData.version,
        textLength: pdfData.text.length,
        wordCount: this.countWords(pdfData.text)
      };
    } catch (error) {
      console.error('PDF metadata extraction error:', error);
      throw new Error(`Failed to extract PDF metadata: ${error.message}`);
    }
  }

  // Get text preview (first N characters)
  async getTextPreview(filePath, length = 500) {
    try {
      const extraction = await this.extractText(filePath);
      const preview = extraction.text.substring(0, length);
      
      return {
        preview: preview + (extraction.text.length > length ? '...' : ''),
        totalLength: extraction.text.length,
        pageCount: extraction.pageCount
      };
    } catch (error) {
      console.error('PDF preview error:', error);
      throw error;
    }
  }

  // Search text within PDF
  searchInPDF(text, query, options = {}) {
    const {
      caseSensitive = false,
      wholeWords = false,
      maxResults = 10
    } = options;

    let searchText = text;
    let searchQuery = query;

    if (!caseSensitive) {
      searchText = text.toLowerCase();
      searchQuery = query.toLowerCase();
    }

    const results = [];
    let startIndex = 0;

    while (startIndex < searchText.length && results.length < maxResults) {
      const index = searchText.indexOf(searchQuery, startIndex);
      
      if (index === -1) break;

      // Check for whole words if required
      if (wholeWords) {
        const beforeChar = index > 0 ? searchText[index - 1] : ' ';
        const afterChar = index + searchQuery.length < searchText.length 
          ? searchText[index + searchQuery.length] : ' ';
        
        if (!/\s/.test(beforeChar) || !/\s/.test(afterChar)) {
          startIndex = index + 1;
          continue;
        }
      }

      // Get context around the match
      const contextStart = Math.max(0, index - 100);
      const contextEnd = Math.min(searchText.length, index + searchQuery.length + 100);
      const context = text.substring(contextStart, contextEnd);

      results.push({
        index,
        context,
        match: text.substring(index, index + query.length)
      });

      startIndex = index + searchQuery.length;
    }

    return results;
  }
}

module.exports = new PDFProcessor();
