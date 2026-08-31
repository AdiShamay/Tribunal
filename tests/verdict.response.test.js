jest.mock('../services/openrouter.service', () => jest.fn());

const http = require('http');
const openRouterService = require('../services/openrouter.service');
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
    openRouterService.mockResolvedValue({
      data: {
        choices: [{ message: { content: 'Model-generated tribunal analysis.' } }]
      },
      usage: {
        promptTokens: 20,
        completionTokens: 10,
        totalTokens: 30,
        estimatedCost: 0
      }
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
      promptTokens: 60,
      completionTokens: 30,
      totalRunCost: 0
    });
    expect(openRouterService).toHaveBeenCalledTimes(3);
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
