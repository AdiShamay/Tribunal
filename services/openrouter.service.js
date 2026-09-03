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

function buildRoleSystemPrompt(role = 'general') {
  if (role === 'judge') {
    return `You are a Tribunal judge.
Output raw JSON only. Do not use markdown formatting, code blocks, or conversational text.
JSON-only output is mandatory. Return only valid JSON with no markdown fences, no commentary, no analysis, no extra text.
The response must match this exact schema:
{ "name": "...", "verdict": "..." }
Rules:
- Include exactly a name and a verdict string.
- The verdict MUST state either 'Justified' or 'Not Justified' in the first clause and then give a brief reason.
- judge verdicts MUST NOT exceed 50 words.
- Keep the output compact and faithful to the case facts.`;
  }

  if (role === 'advocate') {
    return `You are a Tribunal advocate.
Output raw JSON only. Do not use markdown formatting, code blocks, or conversational text.
JSON-only output is mandatory. Return only valid JSON with no markdown fences, no commentary, no analysis, no extra text.
The response must match this exact schema:
{ "name": "...", "argument": "..." }
Rules:
- Include exactly a name and an argument string.
- advocate arguments MUST NOT exceed 80 words.
- Keep the argument persuasive, legally grounded, and aligned to the advocate's side of the case.`;
  }

  return `You are the Tribunal's legal reasoning engine.
Output raw JSON only. Do not use markdown formatting, code blocks, or conversational text.
JSON-only output is mandatory. Return only valid JSON with no markdown fences, no commentary, no analysis, no extra text.
You MUST wrap your entire response in { "judges": [...], "advocates": [...] }. Do not add any other text.
The response must match this exact schema:
{ "judges": [ { "name": "...", "verdict": "..." } ], "advocates": [ { "name": "...", "argument": "..." } ] }
Rules:
- You must return EXACTLY 3 judges named: Barak, Elon, Shamgar.
- You must return EXACTLY 4 advocates named: Jon Snow, Tyrion Lannister, Daenerys Targaryen, Grey Worm.
- Returning fewer than 7 participants is a failure. Never invent, replace, or omit a required participant.
- Every judge entry must include exactly a name and a verdict string.
- Every advocate entry must include exactly a name and an argument string.
- judge verdicts MUST NOT exceed 50 words each.
- advocate arguments MUST NOT exceed 80 words each.
- verdict text must state either 'Justified' or 'Not Justified' in the first clause, then give a brief reason.
- Use the provided case facts and keep the output compact and faithful to the legal issue.
- Do not include any keys beyond those two arrays.
- Output must remain compact JSON-only.`;
}


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

async function openRouterService(prompt, role = 'general') {
  const models = await getFreeModels();

  for (const model of models) {
    try {
      // The API key is sent only in the request header so credentials stay out
      // of the prompt payload and can continue to be supplied through the environment.
      // The role-specific prompt prevents the matrix model from producing the
      // verbose free-form prose that previously broke the client contract.
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model,
          max_tokens: 3000,
          messages: [
            { role: 'system', content: buildRoleSystemPrompt(role) },
            { role: 'user', content: prompt }
          ]
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
      console.error(JSON.stringify(error.response?.data, null, 2));
      if (!isRetryableError(error) || model === models[models.length - 1]) {
        throw error;
      }
    }
  }

  throw new Error('No available OpenRouter free model succeeded');
}

module.exports = openRouterService;