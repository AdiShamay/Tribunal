const TribunalCase = require('../models/tribunal-case.model');
const openRouterService = require('../services/openrouter.service');

function getAnalysis(response) {
  return response.data.choices[0].message.content;
}

async function createCase(req, res, next) {
  const {
    chargeSheet,
    advocateArguments,
    judgePrompts
  } = req.body || {};

  // A case cannot be persisted or judged without its factual record and the
  // prompts that define the independent judicial perspectives.
  if (!chargeSheet || !Array.isArray(judgePrompts)) {
    return res.status(400).json({
      error: 'chargeSheet and judgePrompts are required'
    });
  }

  try {
    // Each judge receives a separate model call so the saved case preserves
    // distinct judicial opinions rather than collapsing them into one result.
    const judgeVerdicts = await Promise.all(judgePrompts.map(async ({ judge, prompt }) => {
      const response = await openRouterService(prompt);
      const analysis = getAnalysis(response);

      return {
        judge,
        verdict: analysis,
        reasoning: analysis,
        usage: response.usage
      };
    }));

    const savedCase = await TribunalCase.create({
      chargeSheet,
      advocateArguments,
      judgeVerdicts
    });

    return res.status(201).json(savedCase);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createCase
};