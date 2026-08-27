const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const FREE_MODEL = 'meta-llama/llama-3-8b-instruct:free';

async function openRouterService(prompt) {
  // The API key is sent only in the request header so credentials stay out of
  // the prompt payload and can continue to be supplied through the environment.
  const response = await axios.post(
    OPENROUTER_URL,
    {
      model: FREE_MODEL,
      messages: [{ role: 'user', content: prompt }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // OpenRouter reports token counts in the response usage object. Free models
  // still need accounting so every call has a consistent audit record.
  const usage = response.data && response.data.usage ? response.data.usage : {};
  response.usage = {
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || 0,
    estimatedCost: 0
  };

  return response;
}

module.exports = openRouterService;