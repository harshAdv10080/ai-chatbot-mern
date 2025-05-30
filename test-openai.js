const OpenAI = require('openai');
require('dotenv').config({ path: '../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🔑 Testing OpenAI API Key...');
  console.log('API Key (first 20 chars):', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

  try {
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello World" if this API key works!' }
      ],
      max_tokens: 10
    });

    console.log('✅ SUCCESS! API Key works!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);

  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Status:', error.status);
    console.log('Type:', error.type);
    console.log('Code:', error.code);

    if (error.status === 429) {
      console.log('\n🔍 QUOTA ERROR DETAILS:');
      console.log('- This means the API key is valid but has no credits');
      console.log('- Check your OpenAI account billing page');
      console.log('- Verify you\'re using the correct account');
    }
  }
}

testOpenAI();
