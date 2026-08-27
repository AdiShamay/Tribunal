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
