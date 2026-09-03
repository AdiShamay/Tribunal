const openRouterService = require('../services/openrouter.service');

function getAnalysis(response) {
  return response.data.choices[0].message.content;
}

async function handleAdvocate(req, res, next) {
  const { role, prompt } = req.body;

  // A prompt is required because the service cannot produce a meaningful
  // advocate argument without the case-specific instruction to analyze.
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await openRouterService(prompt);
    return res.json({
      role,
      analysis: getAnalysis(response),
      usage: response.usage
    });
  } catch (error) {
    return next(error);
  }
}

async function handleJudge(req, res, next) {
  const { judge, prompt } = req.body;

  // Judges use the same model service as advocates, but retain their identity
  // in the response so the frontend can display three independent opinions.
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const response = await openRouterService(prompt);
    return res.json({
      judge,
      analysis: getAnalysis(response),
      usage: response.usage
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  handleAdvocate,
  handleJudge
};