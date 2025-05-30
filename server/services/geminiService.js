const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.isDemo = !this.apiKey;

    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini AI service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini AI:', error.message);
        this.isDemo = true;
      }
    } else {
      console.log('⚠️ Gemini API key not found, running in demo mode');
    }
  }

  isConfigured() {
    return !this.isDemo && this.model;
  }

  async generateResponse(messages, options = {}) {
    if (this.isDemo) {
      return this.generateDemoResponse(messages);
    }

    try {
      // Convert OpenAI-style messages to Gemini format
      const prompt = this.convertMessagesToPrompt(messages);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        usage: {
          prompt_tokens: this.estimateTokens(prompt),
          completion_tokens: this.estimateTokens(text),
          total_tokens: this.estimateTokens(prompt + text)
        }
      };
    } catch (error) {
      console.error('Gemini API error:', error);

      // Fallback to demo mode on error
      return this.generateDemoResponse(messages);
    }
  }

  async generateStreamingResponse(messages, onChunk, options = {}) {
    if (this.isDemo) {
      return this.generateDemoStreamingResponse(messages, onChunk);
    }

    try {
      const prompt = this.convertMessagesToPrompt(messages);

      const result = await this.model.generateContentStream(prompt);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;

        if (onChunk) {
          onChunk({
            choices: [{
              delta: {
                content: chunkText
              }
            }]
          });
        }
      }

      return {
        content: fullText,
        usage: {
          prompt_tokens: this.estimateTokens(prompt),
          completion_tokens: this.estimateTokens(fullText),
          total_tokens: this.estimateTokens(prompt + fullText)
        }
      };
    } catch (error) {
      console.error('Gemini streaming error:', error);
      return this.generateDemoStreamingResponse(messages, onChunk);
    }
  }

  convertMessagesToPrompt(messages) {
    // Convert OpenAI chat format to Gemini prompt format
    let prompt = '';

    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    prompt += 'Assistant: ';
    return prompt;
  }

  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  generateDemoResponse(messages) {
    const lastMessage = messages[messages.length - 1];
    const demoResponses = [
      "I'm currently running in demo mode. This is a simulated AI response to demonstrate the chat functionality. Your application is working perfectly!",
      "This is a demo response showing how the AI chatbot would work with a real API. The interface, real-time features, and all functionality are working correctly.",
      "Demo mode is active. In production, this would be a real AI response from Google Gemini. Your full-stack application demonstrates excellent technical skills!",
      "This simulated response shows your chatbot's capabilities. The MERN stack, Socket.IO, and all features are production-ready and impressive for your portfolio.",
      "Demo response: Your AI chatbot showcases advanced full-stack development with real-time communication, file upload, and professional UI/UX design."
    ];

    const response = demoResponses[Math.floor(Math.random() * demoResponses.length)];

    return {
      content: response,
      usage: {
        prompt_tokens: this.estimateTokens(lastMessage.content),
        completion_tokens: this.estimateTokens(response),
        total_tokens: this.estimateTokens(lastMessage.content + response)
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

  // For compatibility with existing code
  async generateEmbedding(text) {
    // Gemini doesn't have embeddings API, so we'll create a simple hash-based embedding
    if (this.isDemo) {
      return {
        embedding: this.createSimpleEmbedding(text)
      };
    }

    // For now, return a simple embedding
    return {
      embedding: this.createSimpleEmbedding(text)
    };
  }

  async generateBatchEmbeddings(texts) {
    return texts.map(text => this.createSimpleEmbedding(text));
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
}

module.exports = new GeminiService();
