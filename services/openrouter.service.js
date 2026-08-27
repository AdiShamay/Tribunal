const axios = require('axios');
require('dotenv').config();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODELS_URL = 'https://openrouter.ai/api/v1/models';
const PRIORITIZED_FREE_MODELS = [
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free'
];
const FALLBACK_FREE_MODELS = [
  ...PRIORITIZED_FREE_MODELS,
  'mistralai/mistral-7b-instruct:free'
];

function hasZeroPricing(pricing) {
  return pricing && Number(pricing.prompt) === 0 && Number(pricing.completion) === 0;
}

function isActiveFreeModel(model) {
  return model && typeof model.id === 'string' && !model.disabled && (
    model.id.endsWith(':free') || hasZeroPricing(model.pricing)
  );
}

async function getFreeModels() {
  try {
    const response = await axios.get(MODELS_URL);
    const models = response.data && Array.isArray(response.data.data)
      ? response.data.data
      : [];
    const freeModels = models.filter(isActiveFreeModel).map(({ id }) => id);
    const prioritizedModels = PRIORITIZED_FREE_MODELS.filter((model) => freeModels.includes(model));
    const remainingModels = freeModels.filter((model) => !prioritizedModels.includes(model));

    return [...prioritizedModels, ...remainingModels, ...FALLBACK_FREE_MODELS]
      .filter((model, index, candidates) => candidates.indexOf(model) === index);
  } catch (error) {
    return FALLBACK_FREE_MODELS;
  }
}

function isRetryableError(error) {
  return error.response && [429, 500].includes(error.response.status);
}

async function openRouterService(prompt) {
  const models = await getFreeModels();

  for (const model of models) {
    try {
      // The API key is sent only in the request header so credentials stay out
      // of the prompt payload and can continue to be supplied through the environment.
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
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
    } catch (error) {
      if (!isRetryableError(error) || model === models[models.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('No available OpenRouter free model succeeded');
}

module.exports = openRouterService;