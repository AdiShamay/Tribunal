const mongoose = require('mongoose');
const openRouterService = require('../services/openrouter.service');
const TribunalCase = require('../models/tribunal-case.model');

const judgeNames = ['Barak', 'Elon', 'Shamgar'];
const advocateNames = ['Jon Snow', 'Tyrion Lannister', 'Daenerys Targaryen', 'Grey Worm'];

function getModelContent(response) {
  const content = response?.data?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

function sanitizeJSON(rawText) {
  const markdownFreeText = String(rawText || '')
    .replace(/```(json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!markdownFreeText) {
    return '';
  }

  const objectStart = markdownFreeText.indexOf('{');
  const arrayStart = markdownFreeText.indexOf('[');
  const startCandidates = [objectStart, arrayStart].filter((index) => index !== -1);
  const objectEnd = markdownFreeText.lastIndexOf('}');
  const arrayEnd = markdownFreeText.lastIndexOf(']');
  const endCandidates = [objectEnd, arrayEnd].filter((index) => index !== -1);

  if (startCandidates.length === 0 || endCandidates.length === 0) {
    return '';
  }

  const start = Math.min(...startCandidates);
  const end = Math.max(...endCandidates);

  return end >= start ? markdownFreeText.slice(start, end + 1) : '';
}

function parseJsonPayload(content) {
  const candidate = sanitizeJSON(content);

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

function buildPersistedCasePayload({ chargeSheet, judges, advocates, executionMode, telemetry }) {
  return {
    chargeSheet,
    executionMode,
    telemetry: {
      promptTokens: telemetry.promptTokens,
      completionTokens: telemetry.completionTokens,
      cost: telemetry.totalRunCost
    },
    advocateArguments: advocates.map((advocate) => ({
      role: advocate.name,
      argument: advocate.argument
    })),
    judgeVerdicts: judges.map((judge) => ({
      judge: judge.name,
      verdict: judge.decision,
      reasoning: judge.reasoning || ''
    }))
  };
}

async function persistVerdictCase({ chargeSheet, judges, advocates, executionMode, telemetry }) {
  if (!process.env.MONGODB_URI || mongoose.connection.readyState !== 1) {
    console.warn('Skipping TribunalCase persistence because MongoDB is not connected.', {
      chargeSheet,
      judgeCount: judges.length,
      advocateCount: advocates.length,
      readyState: mongoose.connection.readyState
    });
    return null;
  }

  const payload = buildPersistedCasePayload({ chargeSheet, judges, advocates, executionMode, telemetry });

  try {
    const savedCase = await TribunalCase.create(payload);
    console.log('Saved tribunal verdict to MongoDB:', savedCase?._id || 'unknown');
    return savedCase;
  } catch (saveError) {
    console.error('Failed to save TribunalCase to MongoDB. Payload:', JSON.stringify(payload, null, 2), saveError);
    throw saveError;
  }
}

function buildMatrixJudgePrompt(chargeSheet, judge) {
  return `${chargeSheet}\n\nYou are ${judge}. Return only JSON { "name": "${judge}", "verdict": "..." } with a verdict limited to 50 words. State either 'Justified' or 'Not Justified' at the start.`;
}

function buildMatrixAdvocatePrompt(chargeSheet, advocateName, side) {
  return `${chargeSheet}\n\nYou are ${advocateName}, speaking for the ${side}. Return only JSON { "name": "${advocateName}", "argument": "..." } with the argument limited to 80 words.`;
}

function requireStructuredArray(value, field, minimumLength) {
  if (!Array.isArray(value) || value.length < minimumLength) {
    throw new Error(`OpenRouter response did not contain a complete ${field} array.`);
  }
  return value;
}

function requireExactParticipants(entries, expectedNames, field) {
  if (entries.length !== expectedNames.length || entries.some((entry) => !expectedNames.includes(entry?.name))) {
    throw new Error(`OpenRouter response did not contain the exact required ${field} participants.`);
  }

  const names = entries.map((entry) => entry.name);
  if (new Set(names).size !== expectedNames.length) {
    throw new Error(`OpenRouter response contained duplicate ${field} participants.`);
  }

  return entries;
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
    let telemetry;

    if (modelMode === 'unified') {
      const response = await openRouterService(`${chargeSheet}\n\nReturn all tribunal output as JSON with judges and advocates arrays. Include the four named advocates in the final output.`);
      const parsed = parseJsonPayload(getModelContent(response));
      const incomingJudges = requireExactParticipants(requireStructuredArray(parsed?.judges, 'judges', 1), judgeNames, 'judge');
      const incomingAdvocates = requireExactParticipants(requireStructuredArray(parsed?.advocates, 'advocates', 1), advocateNames, 'advocate');

      judgeResults = incomingJudges.map(normalizeJudgeData);
      normalizedAdvocates = incomingAdvocates.map(normalizeAdvocateData);
      telemetry = {
        promptTokens: response.usage?.promptTokens || 0,
        completionTokens: response.usage?.completionTokens || 0,
        totalRunCost: response.usage?.estimatedCost || 0
      };

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
        const rawText = getModelContent(response);
        const parsed = parseJsonPayload(rawText);
        if (!parsed || typeof parsed.verdict !== 'string' || !parsed.verdict.trim()) {
          console.error('RAW LLM OUTPUT:', rawText);
          throw new Error(`OpenRouter judge response for ${judge} was not valid structured JSON.`);
        }
        const verdictText = parsed.verdict;

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
        const rawText = getModelContent(response);
        const parsed = parseJsonPayload(rawText);

        if (!parsed || typeof parsed.argument !== 'string' || !parsed.argument.trim()) {
          console.error('RAW LLM OUTPUT:', rawText);
          throw new Error(`OpenRouter advocate response for ${advocate.name} was not valid structured JSON.`);
        }

        return {
          name: parsed.name || advocate.name,
          argument: parsed.argument,
          usage: response.usage || {}
        };
      }));

      normalizedAdvocates = advocateResults.map(({ name, argument }) => ({ name, argument }));
      const advocateTelemetry = advocateResults.reduce((total, advocate) => ({
        promptTokens: total.promptTokens + (advocate.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (advocate.usage?.completionTokens || 0),
        totalRunCost: total.totalRunCost + (advocate.usage?.estimatedCost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

      telemetry = judgeResults.reduce((total, judge) => ({
        promptTokens: total.promptTokens + (judge.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (judge.usage?.completionTokens || 0),
        totalRunCost: total.totalRunCost + (judge.usage?.estimatedCost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });

      telemetry.promptTokens += advocateTelemetry.promptTokens;
      telemetry.completionTokens += advocateTelemetry.completionTokens;
      telemetry.totalRunCost += advocateTelemetry.totalRunCost;

    }

    if (!telemetry) {
      telemetry = judgeResults.reduce((total, judge) => ({
        promptTokens: total.promptTokens + (judge.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (judge.usage?.completionTokens || 0),
        totalRunCost: total.totalRunCost + (judge.usage?.estimatedCost || 0)
      }), { promptTokens: 0, completionTokens: 0, totalRunCost: 0 });
    }

    const persistedCase = await persistVerdictCase({
      chargeSheet,
      executionMode: modelMode === 'unified' ? 'Unified Model' : 'Multi-Model Matrix',
      judges: judgeResults.map(({ name, decision, reasoning }) => ({ name, decision, reasoning })),
      advocates: normalizedAdvocates,
      telemetry
    });

    if (persistedCase) {
      console.log('Verdict persisted before response:', persistedCase._id || 'no-id');
    }

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
  createVerdict,
  sanitizeJSON
};