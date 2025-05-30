const OpenAI = require('openai');
require('dotenv').config({ path: '../.env' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🔑 Testing OpenAI API Key...');
  console.log('API Key (first 20 chars):', process.env.OPENAI_API_KEY?.substring(0, 20) + '...');

  // Test 1: Check account/organization
  try {
    console.log('\n📋 Testing account access...');
    const models = await openai.models.list();
    console.log('✅ Account access works! Available models:', models.data.length);
  } catch (error) {
    console.log('❌ Account access error:', error.message);
  }

  // Test 2: Try gpt-3.5-turbo
  try {
    console.log('\n🤖 Testing gpt-3.5-turbo...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello World" if this API key works!' }
      ],
      max_tokens: 10
    });

    console.log('✅ SUCCESS! gpt-3.5-turbo works!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);

  } catch (error) {
    console.log('❌ gpt-3.5-turbo ERROR:', error.message);
    console.log('Status:', error.status);
    console.log('Type:', error.type);
    console.log('Code:', error.code);
  }

  // Test 3: Try gpt-4o-mini (newer free model)
  try {
    console.log('\n🤖 Testing gpt-4o-mini...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "Hello World" if this API key works!' }
      ],
      max_tokens: 10
    });

    console.log('✅ SUCCESS! gpt-4o-mini works!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Usage:', response.usage);

  } catch (error) {
    console.log('❌ gpt-4o-mini ERROR:', error.message);
    console.log('Status:', error.status);
  }
}

testOpenAI();
