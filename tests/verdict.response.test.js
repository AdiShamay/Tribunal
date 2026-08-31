jest.mock('../services/openrouter.service', () => jest.fn());
jest.mock('../models/tribunal-case.model', () => ({ create: jest.fn() }));

const http = require('http');
const openRouterService = require('../services/openrouter.service');
const TribunalCase = require('../models/tribunal-case.model');
const mongoose = require('mongoose');
const app = require('../app');
let activePort;

describe('POST /api/verdict response contract', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, () => {
      activePort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    openRouterService.mockReset();
    TribunalCase.create.mockReset();
    TribunalCase.create.mockResolvedValue({ _id: 'saved-case-001' });
    Object.defineProperty(mongoose.connection, 'readyState', { configurable: true, value: 1 });
    openRouterService.mockImplementation(async (prompt, role) => {
      const judge = prompt.includes('Elon') ? 'Elon' : prompt.includes('Shamgar') ? 'Shamgar' : 'Barak';
      const advocate = ['Tyrion Lannister', 'Daenerys Targaryen', 'Grey Worm'].find((name) => prompt.includes(name)) || 'Jon Snow';
      const content = role === 'judge'
        ? JSON.stringify({ name: judge, verdict: 'Justified because the threat was imminent.' })
        : JSON.stringify({ name: advocate, argument: advocate === 'Jon Snow' ? 'Defense argument.' : advocate === 'Tyrion Lannister' ? 'Strategic defense argument.' : advocate === 'Daenerys Targaryen' ? 'Prosecution argument.' : 'Final prosecution argument.' });

      return {
        data: { choices: [{ message: { content } }] },
        usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30, estimatedCost: 0 }
      };
    });
  });

  it('should return independent judges, advocates, and free-model telemetry', async () => {
    const requestBody = {
      modelMode: 'matrix',
      chargeSheet: 'CASE T-001: The Realm v. Jon Snow',
      advocates: [
        { name: 'Jon Snow', argument: 'Defense argument.' },
        { name: 'Tyrion Lannister', argument: 'Strategic defense argument.' },
        { name: 'Daenerys Targaryen', argument: 'Prosecution argument.' },
        { name: 'Grey Worm', argument: 'Final prosecution argument.' }
      ],
      judgePrompts: [
        { judge: 'Barak', prompt: 'Assess necessity.' },
        { judge: 'Elon', prompt: 'Assess proportionality.' },
        { judge: 'Shamgar', prompt: 'Assess safer alternatives.' }
      ]
    };

    const response = await postJson('/api/verdict', requestBody);

    expect(response.statusCode).toBe(200);
    expect(Object.keys(response.body).sort()).toEqual(['advocates', 'judges', 'telemetry']);
    expect(response.body.judges).toHaveLength(3);
    expect(response.body.judges).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Barak', decision: expect.stringMatching(/^(Justified|Not Justified)$/) }),
      expect.objectContaining({ name: 'Elon', decision: expect.stringMatching(/^(Justified|Not Justified)$/) }),
      expect.objectContaining({ name: 'Shamgar', decision: expect.stringMatching(/^(Justified|Not Justified)$/) })
    ]));
    expect(response.body.judges.every(({ reasoning }) => typeof reasoning === 'string')).toBe(true);
    expect(response.body.advocates).toEqual(requestBody.advocates);
    expect(response.body.telemetry).toEqual({
      promptTokens: 140,
      completionTokens: 70,
      totalRunCost: 0
    });
    expect(openRouterService).toHaveBeenCalledTimes(7);
  });

  it('should parse a unified JSON response with judges and advocates from the model output', async () => {
    openRouterService.mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              judges: [
                { name: 'Barak', verdict: 'Justified because the threat was imminent and no safer option existed.' },
                { name: 'Elon', verdict: 'Not justified because the killing was not necessary under the circumstances.' },
                { name: 'Shamgar', verdict: 'Justified to preserve the realm from catastrophic violence.' }
              ],
              advocates: [
                { name: 'Jon Snow', argument: 'I acted to stop an imminent massacre and protect the realm.' },
                { name: 'Tyrion Lannister', argument: 'The realm was already sliding toward tyranny, so restraint was necessary.' },
                { name: 'Daenerys Targaryen', argument: 'The realm must obey law, not panic, and my command was lawful.' },
                { name: 'Grey Worm', argument: 'No one can justify killing the ruler in private without process.' }
              ]
            })
          }
        }]
      },
      usage: {
        promptTokens: 25,
        completionTokens: 15,
        totalTokens: 40,
        estimatedCost: 0
      }
    });

    const response = await postJson('/api/verdict', {
      modelMode: 'unified',
      chargeSheet: 'CASE T-001: The Realm v. Jon Snow',
      advocates: [
        { name: 'Jon Snow', argument: 'Defense argument.' },
        { name: 'Tyrion Lannister', argument: 'Strategic defense argument.' },
        { name: 'Daenerys Targaryen', argument: 'Prosecution argument.' },
        { name: 'Grey Worm', argument: 'Final prosecution argument.' }
      ],
      judgePrompts: [
        { judge: 'Barak', prompt: 'Assess necessity.' },
        { judge: 'Elon', prompt: 'Assess proportionality.' },
        { judge: 'Shamgar', prompt: 'Assess safer alternatives.' }
      ]
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.judges).toHaveLength(3);
    expect(response.body.advocates).toHaveLength(4);
    expect(response.body.judges[0]).toEqual(expect.objectContaining({
      name: 'Barak',
      decision: expect.stringMatching(/^(Justified|Not Justified)$/)
    }));
    expect(response.body.advocates[0]).toEqual(expect.objectContaining({
      name: 'Jon Snow',
      argument: expect.any(String)
    }));
  });

  it('should reject an incomplete unified response instead of persisting it', async () => {
    openRouterService.mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: JSON.stringify({
              judges: [{ name: 'Barak', verdict: 'Justified.' }],
              advocates: [{ name: 'Jon Snow', argument: 'The realm required action.' }]
            })
          }
        }]
      },
      usage: { promptTokens: 2, completionTokens: 2, estimatedCost: 0 }
    });

    const response = await postJson('/api/verdict', {
      modelMode: 'unified',
      chargeSheet: 'CASE T-001: The Realm v. Jon Snow',
      advocates: [{ name: 'Jon Snow', argument: 'placeholder' }],
      judgePrompts: []
    });

    expect(response.statusCode).toBe(500);
    expect(TribunalCase.create).not.toHaveBeenCalled();
  });

  it('should aggregate matrix-mode judge and advocate JSON payloads with role-specific constraints', async () => {
    openRouterService.mockImplementation(async (prompt, role) => {
      if (role === 'judge') {
        return {
          data: { choices: [{ message: { content: JSON.stringify({ name: 'Barak', verdict: 'Justified to stop imminent harm.' }) } }] },
          usage: { promptTokens: 11, completionTokens: 7, totalTokens: 18, estimatedCost: 0 }
        };
      }
      if (role === 'advocate') {
        return {
          data: { choices: [{ message: { content: JSON.stringify({ name: 'Jon Snow', argument: 'I acted to prevent a massacre from escalating.' }) } }] },
          usage: { promptTokens: 13, completionTokens: 8, totalTokens: 21, estimatedCost: 0 }
        };
      }
      return {
        data: { choices: [{ message: { content: 'fallback' } }] },
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCost: 0 }
      };
    });

    const response = await postJson('/api/verdict', {
      modelMode: 'matrix',
      chargeSheet: 'CASE T-001: The Realm v. Jon Snow',
      advocates: [
        { name: 'Jon Snow', side: 'Defense', argument: 'Existing argument.' },
        { name: 'Tyrion Lannister', side: 'Defense', argument: 'Existing argument.' },
        { name: 'Daenerys Targaryen', side: 'Prosecution', argument: 'Existing argument.' },
        { name: 'Grey Worm', side: 'Prosecution', argument: 'Existing argument.' }
      ],
      judgePrompts: [
        { judge: 'Barak', prompt: 'Assess necessity.' },
        { judge: 'Elon', prompt: 'Assess proportionality.' },
        { judge: 'Shamgar', prompt: 'Assess safer alternatives.' }
      ]
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.judges).toHaveLength(3);
    expect(response.body.advocates).toHaveLength(4);
    expect(response.body.judges[0]).toEqual(expect.objectContaining({ name: 'Barak', decision: 'Justified' }));
    expect(response.body.advocates[0]).toEqual(expect.objectContaining({ name: 'Jon Snow', argument: expect.stringContaining('massacre') }));
  });

  it('should persist parsed matrix AI data instead of the submitted placeholders before responding', async () => {
    openRouterService.mockImplementation(async (prompt, role) => ({
      data: {
        choices: [{
          message: {
            content: role === 'judge'
              ? JSON.stringify({ name: prompt.includes('Elon') ? 'Elon' : prompt.includes('Shamgar') ? 'Shamgar' : 'Barak', verdict: 'Justified because the threat was imminent.' })
              : JSON.stringify({ name: prompt.includes('Tyrion') ? 'Tyrion Lannister' : prompt.includes('Daenerys') ? 'Daenerys Targaryen' : prompt.includes('Grey Worm') ? 'Grey Worm' : 'Jon Snow', argument: 'The real AI argument protects the realm.' })
          }
        }]
      },
      usage: { promptTokens: 1, completionTokens: 1, estimatedCost: 0 }
    }));

    const response = await postJson('/api/verdict', {
      modelMode: 'matrix',
      chargeSheet: 'CASE T-001: The Realm v. Jon Snow',
      advocates: [
        { name: 'Jon Snow', side: 'Defense', argument: 'The defense argument will appear here after deliberation.' },
        { name: 'Tyrion Lannister', side: 'Defense', argument: 'The defense argument will appear here after deliberation.' },
        { name: 'Daenerys Targaryen', side: 'Prosecution', argument: 'The prosecution argument will appear here after deliberation.' },
        { name: 'Grey Worm', side: 'Prosecution', argument: 'The prosecution argument will appear here after deliberation.' }
      ],
      judgePrompts: [
        { judge: 'Barak', prompt: 'Assess Barak.' },
        { judge: 'Elon', prompt: 'Assess Elon.' },
        { judge: 'Shamgar', prompt: 'Assess Shamgar.' }
      ]
    });

    expect(response.statusCode).toBe(200);
    expect(TribunalCase.create).toHaveBeenCalledWith(expect.objectContaining({
      telemetry: {
        promptTokens: 7,
        completionTokens: 7,
        cost: 0
      },
      judgeVerdicts: expect.arrayContaining([
        expect.objectContaining({ judge: 'Barak', reasoning: 'Justified because the threat was imminent.' })
      ]),
      advocateArguments: expect.arrayContaining([
        expect.objectContaining({ role: 'Jon Snow', argument: 'The real AI argument protects the realm.' })
      ]),
      telemetry: {
        promptTokens: 7,
        completionTokens: 7,
        cost: 0
      }
    }));
    const savedPayload = TribunalCase.create.mock.calls[0][0];
    expect(savedPayload.advocateArguments).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ argument: expect.stringContaining('will appear here after deliberation') })
    ]));
    expect(savedPayload.judgeVerdicts).toHaveLength(3);
  });
});

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = http.request({
      hostname: 'localhost',
      port: activePort,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (response) => {
      let responseData = '';
      response.on('data', (chunk) => { responseData += chunk; });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          body: responseData ? JSON.parse(responseData) : {}
        });
      });
    });

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}
