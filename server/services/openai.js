const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key-replace-with-real-openai-key') {
      console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
      this.client = null;
    } else {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    this.models = {
      chat: 'gpt-4o-mini',
      embedding: 'text-embedding-3-small',
      fallback: 'gpt-3.5-turbo'
    };
  }

  // Generate chat completion
  async generateChatCompletion(messages, options = {}) {
    if (!this.client) {
      // Demo mode - return simulated response
      return this.generateDemoResponse(messages);
    }

    try {
      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model: options.model || this.models.chat,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: options.stream || false,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0
      });

      const processingTime = Date.now() - startTime;

      if (options.stream) {
        return response; // Return stream directly
      }

      return {
        content: response.choices[0].message.content,
        tokensUsed: response.usage.total_tokens,
        model: response.model,
        processingTime,
        finishReason: response.choices[0].finish_reason
      };

    } catch (error) {
      console.error('OpenAI chat completion error:', error);

      // Try fallback model if main model fails
      if (options.model !== this.models.fallback && !options.noFallback) {
        console.log('Trying fallback model...');
        return this.generateChatCompletion(messages, {
          ...options,
          model: this.models.fallback,
          noFallback: true
        });
      }

      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  // Generate streaming chat completion
  async generateStreamingCompletion(messages, options = {}) {
    if (!this.client) {
      // Demo mode - return simulated streaming response
      return this.generateDemoStreamingResponse(messages);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.models.chat,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000,
        stream: true,
        presence_penalty: options.presencePenalty || 0,
        frequency_penalty: options.frequencyPenalty || 0
      });

      return response;

    } catch (error) {
      console.error('OpenAI streaming completion error:', error);
      throw new Error(`OpenAI streaming API error: ${error.message}`);
    }
  }

  // Generate embeddings for text
  async generateEmbedding(text, options = {}) {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    try {
      // Clean and truncate text if too long
      const cleanText = text.replace(/\n/g, ' ').trim();
      const maxLength = 8000; // Safe limit for embedding model
      const truncatedText = cleanText.length > maxLength
        ? cleanText.substring(0, maxLength) + '...'
        : cleanText;

      const response = await this.client.embeddings.create({
        model: options.model || this.models.embedding,
        input: truncatedText
      });

      return {
        embedding: response.data[0].embedding,
        tokensUsed: response.usage.total_tokens,
        model: response.model
      };

    } catch (error) {
      console.error('OpenAI embedding error:', error);
      throw new Error(`OpenAI embedding API error: ${error.message}`);
    }
  }

  // Generate embeddings for multiple texts
  async generateBatchEmbeddings(texts, options = {}) {
    try {
      const batchSize = 100; // OpenAI batch limit
      const results = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const cleanBatch = batch.map(text =>
          text.replace(/\n/g, ' ').trim().substring(0, 8000)
        );

        const response = await this.client.embeddings.create({
          model: options.model || this.models.embedding,
          input: cleanBatch
        });

        results.push(...response.data.map(item => item.embedding));
      }

      return results;

    } catch (error) {
      console.error('OpenAI batch embedding error:', error);
      throw new Error(`OpenAI batch embedding API error: ${error.message}`);
    }
  }

  // Create system message for RAG context
  createRAGSystemMessage(context, userQuery) {
    return {
      role: 'system',
      content: `You are a helpful AI assistant. Use the following context to answer the user's question. If the context doesn't contain relevant information, say so and provide a general response.

Context:
${context}

Instructions:
- Answer based on the provided context when relevant
- Be concise and accurate
- If you're unsure, acknowledge the uncertainty
- Cite specific parts of the context when applicable
- If the context is not relevant to the question, provide a helpful general response

User Question: ${userQuery}`
    };
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  // Generate demo streaming response for portfolio demonstrations
  async* generateDemoStreamingResponse(messages) {
    const demoResponse = this.generateDemoResponse(messages);
    const content = demoResponse.content;

    // Simulate streaming by yielding chunks
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = i === 0 ? words[i] : ' ' + words[i];
      yield {
        choices: [{
          delta: { content: chunk },
          finish_reason: i === words.length - 1 ? 'stop' : null
        }]
      };
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }

  // Generate demo response for portfolio demonstrations
  generateDemoResponse(messages) {
    const userMessage = messages[messages.length - 1]?.content || '';

    const demoResponses = {
      'hello': "Hello! I'm an AI assistant built with the MERN stack. This is a demo mode showcasing the application's capabilities.",
      'how are you': "I'm doing great! This AI chatbot demonstrates real-time chat, document analysis, and modern web development practices.",
      'what can you do': "I can help with conversations, analyze uploaded documents, create summaries, generate flashcards, and showcase full-stack development skills!",
      'tell me about this app': "This is a production-grade AI chatbot built with React, Node.js, MongoDB, and Socket.IO. It features real-time chat, JWT authentication, file upload, and RAG capabilities.",
      'default': "This is a demo response showcasing the AI chatbot functionality. The app demonstrates modern full-stack development with React, Node.js, MongoDB, and real-time features."
    };

    // Simple keyword matching for demo
    const lowerMessage = userMessage.toLowerCase();
    let response = demoResponses.default;

    for (const [key, value] of Object.entries(demoResponses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    return {
      content: response,
      tokensUsed: 50, // Simulated token usage
      model: 'demo-mode',
      processingTime: 500 + Math.random() * 1000, // Simulated processing time
      finishReason: 'stop'
    };
  }

  // Check if API key is configured
  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }

  // Get available models
  getAvailableModels() {
    return this.models;
  }

  // Generate a summary of text
  async generateSummary(text, options = {}) {
    try {
      const maxLength = options.maxLength || 200;
      const messages = [
        {
          role: 'system',
          content: `Summarize the following text in approximately ${maxLength} words. Be concise and capture the main points.`
        },
        {
          role: 'user',
          content: text
        }
      ];

      return await this.generateChatCompletion(messages, {
        maxTokens: Math.ceil(maxLength * 1.5), // Allow some buffer
        temperature: 0.3 // Lower temperature for more focused summaries
      });

    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error(`Summary generation error: ${error.message}`);
    }
  }

  // Generate flashcards from text
  async generateFlashcards(text, options = {}) {
    try {
      const count = options.count || 5;
      const messages = [
        {
          role: 'system',
          content: `Create ${count} flashcards from the following text. Format as JSON array with objects containing "question" and "answer" fields. Focus on key concepts and important information.`
        },
        {
          role: 'user',
          content: text
        }
      ];

      const response = await this.generateChatCompletion(messages, {
        maxTokens: 1500,
        temperature: 0.5
      });

      try {
        return JSON.parse(response.content);
      } catch (parseError) {
        // If JSON parsing fails, return a structured response
        return [{
          question: "Unable to generate flashcards",
          answer: "The content could not be processed into flashcard format."
        }];
      }

    } catch (error) {
      console.error('Flashcard generation error:', error);
      throw new Error(`Flashcard generation error: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
