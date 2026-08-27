const openRouterService = require('../services/openrouter.service');

const judgeNames = ['Barak', 'Elon', 'Shamgar'];

function getModelContent(response) {
  return response.data.choices[0].message.content;
}

function getDecision(content) {
  return /not justified/i.test(content) ? 'Not Justified' : 'Justified';
}

async function createVerdict(req, res, next) {
  const {
    chargeSheet = '',
    advocates,
    judgePrompts = []
  } = req.body || {};

  if (!Array.isArray(advocates) || advocates.length === 0) {
    return res.status(400).json({ error: 'advocates array is required' });
  }

  try {
    const promptsByJudge = judgeNames.map((judge, index) => {
      const requestedPrompt = judgePrompts[index];
      return {
        judge,
        prompt: requestedPrompt?.prompt || chargeSheet
      };
    });

    // Each judge receives an independent call so the response preserves the
    // separate opinions required by the tribunal protocol.
    const judgeResults = await Promise.all(promptsByJudge.map(async ({ judge, prompt }) => {
      const response = await openRouterService(prompt);
      const reasoning = getModelContent(response);

      return {
        name: judge,
        decision: getDecision(reasoning),
        reasoning,
        usage: response.usage || {}
      };
    }));

    const telemetry = judgeResults.reduce((total, judge) => ({
      promptTokens: total.promptTokens + (judge.usage.promptTokens || 0),
      completionTokens: total.completionTokens + (judge.usage.completionTokens || 0),
      totalRunCost: total.totalRunCost + (judge.usage.estimatedCost || 0)
    }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

    return res.json({
      judges: judgeResults.map(({ name, decision, reasoning }) => ({ name, decision, reasoning })),
      advocates,
      telemetry
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createVerdict
};