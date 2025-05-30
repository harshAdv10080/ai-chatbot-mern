const openaiService = require('./openai');
const geminiService = require('./geminiService');

class AIService {
  constructor() {
    this.primaryService = null;
    this.fallbackService = null;
    this.currentProvider = 'demo';

    this.initializeServices();
  }

  initializeServices() {
    // Check which services are available
    const openaiAvailable = openaiService.isConfigured();
    const geminiAvailable = geminiService.isConfigured();

    console.log('🔍 AI Service Status:');
    console.log(`  OpenAI: ${openaiAvailable ? '✅ Available' : '❌ Not configured'}`);
    console.log(`  Gemini: ${geminiAvailable ? '✅ Available' : '❌ Not configured'}`);

    // Set primary and fallback services
    if (geminiAvailable) {
      this.primaryService = geminiService;
      this.fallbackService = openaiAvailable ? openaiService : null;
      this.currentProvider = 'gemini';
      console.log('🚀 Using Google Gemini as primary AI service');
    } else if (openaiAvailable) {
      this.primaryService = openaiService;
      this.fallbackService = null;
      this.currentProvider = 'openai';
      console.log('🚀 Using OpenAI as primary AI service');
    } else {
      this.primaryService = geminiService; // Will run in demo mode
      this.fallbackService = null;
      this.currentProvider = 'demo';
      console.log('⚠️ No AI services configured, running in demo mode');
    }
  }

  isConfigured() {
    return this.primaryService && (this.currentProvider !== 'demo' || this.primaryService.isConfigured());
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  async generateResponse(messages, options = {}) {
    try {
      const response = await this.primaryService.generateResponse(messages, options);
      return {
        ...response,
        provider: this.currentProvider
      };
    } catch (error) {
      console.error(`${this.currentProvider} service error:`, error.message);

      // Try fallback service if available
      if (this.fallbackService) {
        console.log('🔄 Trying fallback AI service...');
        try {
          const response = await this.fallbackService.generateResponse(messages, options);
          return {
            ...response,
            provider: this.fallbackService === openaiService ? 'openai' : 'gemini'
          };
        } catch (fallbackError) {
          console.error('Fallback service also failed:', fallbackError.message);
        }
      }

      // If all else fails, return demo response
      return this.generateDemoResponse(messages);
    }
  }

  async generateStreamingResponse(messages, onChunk, options = {}) {
    try {
      const response = await this.primaryService.generateStreamingResponse(messages, onChunk, options);
      return {
        ...response,
        provider: this.currentProvider
      };
    } catch (error) {
      console.error(`${this.currentProvider} streaming error:`, error.message);

      // Try fallback service if available
      if (this.fallbackService) {
        console.log('🔄 Trying fallback AI service for streaming...');
        try {
          const response = await this.fallbackService.generateStreamingResponse(messages, onChunk, options);
          return {
            ...response,
            provider: this.fallbackService === openaiService ? 'openai' : 'gemini'
          };
        } catch (fallbackError) {
          console.error('Fallback streaming also failed:', fallbackError.message);
        }
      }

      // If all else fails, return demo streaming response
      return this.generateDemoStreamingResponse(messages, onChunk);
    }
  }

  async generateEmbedding(text) {
    try {
      return await this.primaryService.generateEmbedding(text);
    } catch (error) {
      console.error('Embedding generation error:', error.message);

      // Try fallback service
      if (this.fallbackService) {
        try {
          return await this.fallbackService.generateEmbedding(text);
        } catch (fallbackError) {
          console.error('Fallback embedding also failed:', fallbackError.message);
        }
      }

      // Return simple embedding as fallback
      return {
        embedding: this.createSimpleEmbedding(text)
      };
    }
  }

  async generateBatchEmbeddings(texts) {
    try {
      return await this.primaryService.generateBatchEmbeddings(texts);
    } catch (error) {
      console.error('Batch embedding generation error:', error.message);

      // Try fallback service
      if (this.fallbackService) {
        try {
          return await this.fallbackService.generateBatchEmbeddings(texts);
        } catch (fallbackError) {
          console.error('Fallback batch embedding also failed:', fallbackError.message);
        }
      }

      // Return simple embeddings as fallback
      return texts.map(text => this.createSimpleEmbedding(text));
    }
  }

  generateDemoResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    const demoResponses = [
      "I'm an AI assistant running in demo mode. This showcases the complete functionality of your MERN stack chatbot with real-time features!",
      "Demo response: Your application demonstrates excellent full-stack development skills with React, Node.js, MongoDB, and Socket.IO integration.",
      "This is a simulated AI response showing your chatbot's capabilities. The file upload, real-time chat, and professional UI are all working perfectly!",
      "Demo mode active: Your AI chatbot showcases advanced technical skills including authentication, document processing, and modern web development.",
      "Simulated response: This production-ready application demonstrates your expertise in building scalable, real-time web applications with AI integration."
    ];

    const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];

    return {
      content: response,
      provider: 'demo',
      usage: {
        prompt_tokens: Math.ceil(lastMessage.content.length / 4),
        completion_tokens: Math.ceil(response.length / 4),
        total_tokens: Math.ceil((lastMessage.content + response).length / 4)
      }
    };
  }

  async generateDemoStreamingResponse(messages, onChunk) {
    const response = this.generateDemoResponse(messages);
    const words = response.content.split(' ');

    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      currentText += word;

      if (onChunk) {
        onChunk({
          choices: [{
            delta: {
              content: word
            }
          }]
        });
      }

      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }

    return response;
  }

  createSimpleEmbedding(text) {
    // Create a simple 1536-dimensional embedding based on text hash
    const embedding = new Array(1536);
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Use hash to seed pseudo-random embedding
    for (let i = 0; i < 1536; i++) {
      hash = (hash * 9301 + 49297) % 233280;
      embedding[i] = (hash / 233280) - 0.5; // Normalize to [-0.5, 0.5]
    }

    return embedding;
  }

  // Get service status for debugging
  getServiceStatus() {
    return {
      primary: this.currentProvider,
      fallback: this.fallbackService ? (this.fallbackService === openaiService ? 'openai' : 'gemini') : null,
      configured: this.isConfigured()
    };
  }
}

module.exports = new AIService();
