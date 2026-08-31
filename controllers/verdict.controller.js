const mongoose = require('mongoose');
const openRouterService = require('../services/openrouter.service');
const TribunalCase = require('../models/tribunal-case.model');

const judgeNames = ['Barak', 'Elon', 'Shamgar'];

function getModelContent(response) {
  const content = response?.data?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

function stripJsonFence(content) {
  return String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function parseJsonPayload(content) {
  const candidate = stripJsonFence(content);

  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch (error) {
    // The model occasionally wraps the payload in an object or extra prose.
    // We trim the outer text and retry with the first full JSON object.
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch (error) {
      return null;
    }
  }

  return null;
}

function getDecision(value) {
  if (typeof value === 'string' && /not justified/i.test(value)) {
    return 'Not Justified';
  }
  return 'Justified';
}

function normalizeJudgeData(entry, index) {
  const verdictText = typeof entry?.verdict === 'string' ? entry.verdict : (typeof entry?.reasoning === 'string' ? entry.reasoning : '');
  const name = entry?.name || entry?.judge || judgeNames[index] || `Judge ${index + 1}`;
  const decision = getDecision(verdictText);

  return {
    name,
    decision,
    reasoning: verdictText || 'No reasoning provided.',
    usage: {}
  };
}

function normalizeAdvocateData(entry) {
  return {
    name: entry?.name || 'Advocate',
    argument: typeof entry?.argument === 'string' ? entry.argument : 'No argument provided.'
  };
}

function buildMatrixJudgePrompt(chargeSheet, judge) {
  return `${chargeSheet}\n\nYou are ${judge}. Return only JSON { "name": "${judge}", "verdict": "..." } with a verdict limited to 50 words. State either 'Justified' or 'Not Justified' at the start.`;
}

function buildMatrixAdvocatePrompt(chargeSheet, advocateName, side) {
  return `${chargeSheet}\n\nYou are ${advocateName}, speaking for the ${side}. Return only JSON { "name": "${advocateName}", "argument": "..." } with the argument limited to 80 words.`;
}

async function createVerdict(req, res, next) {
  const {
    modelMode = 'matrix',
    chargeSheet = '',
    advocates,
    judgePrompts = []
  } = req.body || {};

  if (!Array.isArray(advocates) || advocates.length === 0) {
    return res.status(400).json({ error: 'advocates array is required' });
  }

  try {
    let judgeResults = [];
    let normalizedAdvocates = advocates.map(normalizeAdvocateData);

    if (modelMode === 'unified') {
      const response = await openRouterService(`${chargeSheet}\n\nReturn all tribunal output as JSON with judges and advocates arrays. Include the four named advocates in the final output.`);
      const parsed = parseJsonPayload(getModelContent(response));
      const incomingJudges = Array.isArray(parsed?.judges) ? parsed.judges : [];
      const incomingAdvocates = Array.isArray(parsed?.advocates) ? parsed.advocates : [];

      judgeResults = incomingJudges.map(normalizeJudgeData);
      normalizedAdvocates = incomingAdvocates.length ? incomingAdvocates.map(normalizeAdvocateData) : normalizedAdvocates;

      // Persist only when MongoDB is actually connected. This keeps the app
      // responsive in environments without a live database while still saving
      // the case when the configured datastore is available.
      if (process.env.MONGODB_URI && mongoose.connection.readyState === 1) {
        try {
          await TribunalCase.create({
            chargeSheet,
            advocateArguments: normalizedAdvocates.map((advocate) => ({ role: advocate.name, argument: advocate.argument })),
            judgeVerdicts: judgeResults.map((judge) => ({
              judge: judge.name,
              verdict: judge.decision,
              reasoning: judge.reasoning
            }))
          });
        } catch (saveError) {
          console.warn('Unified verdict persistence skipped:', saveError.message);
        }
      }
    } else {
      const promptsByJudge = judgeNames.map((judge, index) => {
        const requestedPrompt = judgePrompts[index];
        return {
          judge,
          prompt: buildMatrixJudgePrompt(requestedPrompt?.prompt || chargeSheet, judge)
        };
      });

      // Each judge receives an independent call so the response preserves the
      // separate opinions required by the tribunal protocol.
      judgeResults = await Promise.all(promptsByJudge.map(async ({ judge, prompt }) => {
        const response = await openRouterService(prompt, 'judge');
        const parsed = parseJsonPayload(getModelContent(response));
        const verdictText = typeof parsed?.verdict === 'string'
          ? parsed.verdict
          : (typeof parsed?.reasoning === 'string' ? parsed.reasoning : getModelContent(response));

        return {
          name: parsed?.name || judge,
          decision: getDecision(verdictText),
          reasoning: verdictText || 'No reasoning provided.',
          usage: response.usage || {}
        };
      }));

      const advocateResults = await Promise.all(advocates.map(async (advocate) => {
        const response = await openRouterService(
          buildMatrixAdvocatePrompt(chargeSheet, advocate.name, advocate.side || 'the case'),
          'advocate'
        );
        const parsed = parseJsonPayload(getModelContent(response));

        if (parsed && typeof parsed.argument === 'string') {
          return {
            name: parsed.name || advocate.name,
            argument: parsed.argument,
            usage: response.usage || {}
          };
        }

        return {
          ...advocate,
          usage: response.usage || {}
        };
      }));

      normalizedAdvocates = advocateResults.map(({ name, argument }) => ({ name, argument }));
      const advocateTelemetry = advocateResults.reduce((total, advocate) => ({
        promptTokens: total.promptTokens + (advocate.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (advocate.usage?.completionTokens || 0),
        totalRunCost: total.totalRunCost + (advocate.usage?.estimatedCost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

      const telemetry = judgeResults.reduce((total, judge) => ({
        promptTokens: total.promptTokens + (judge.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (judge.usage?.completionTokens || 0),
        totalRunCost: total.totalRunCost + (judge.usage?.estimatedCost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

      telemetry.promptTokens += advocateTelemetry.promptTokens;
      telemetry.completionTokens += advocateTelemetry.completionTokens;
      telemetry.totalRunCost += advocateTelemetry.totalRunCost;

      return res.json({
        judges: judgeResults.map(({ name, decision, reasoning }) => ({ name, decision, reasoning })),
        advocates: normalizedAdvocates,
        telemetry
      });
    }

    const telemetry = judgeResults.reduce((total, judge) => ({
      promptTokens: total.promptTokens + (judge.usage?.promptTokens || 0),
      completionTokens: total.completionTokens + (judge.usage?.completionTokens || 0),
      totalRunCost: total.totalRunCost + (judge.usage?.estimatedCost || 0)
    }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

    return res.json({
      judges: judgeResults.map(({ name, decision, reasoning }) => ({ name, decision, reasoning })),
      advocates: normalizedAdvocates,
      telemetry
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createVerdict
};