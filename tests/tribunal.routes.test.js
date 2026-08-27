const assert = require('assert');
const http = require('http');

jest.mock('../services/openrouter.service', () => jest.fn());

const openRouterService = require('../services/openrouter.service');
const app = require('../app');

describe('Tribunal advocate and judge routes', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(3001, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    openRouterService.mockClear();
    openRouterService.mockResolvedValue({
      data: {
        choices: [{ message: { content: 'Model analysis' } }]
      },
      usage: {
        promptTokens: 12,
        completionTokens: 8,
        totalTokens: 20,
        estimatedCost: 0
      }
    });
  });

  it('should send an advocate prompt to OpenRouter and return the analysis with telemetry', async () => {
    const requestBody = {
      role: 'Jon Snow defense',
      prompt: 'Assess whether the killing was justified.'
    };

    const response = await postJson('/api/advocate', requestBody);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.role, requestBody.role);
    assert.strictEqual(response.body.analysis, 'Model analysis');
    assert.deepStrictEqual(response.body.usage, {
      promptTokens: 12,
      completionTokens: 8,
      totalTokens: 20,
      estimatedCost: 0
    });
    expect(openRouterService).toHaveBeenCalledWith(requestBody.prompt);
  });

  it('should send a judge prompt to OpenRouter and return the judgment with telemetry', async () => {
    const requestBody = {
      judge: 'Judge Barak',
      prompt: 'Decide whether the killing was justified.'
    };

    const response = await postJson('/api/judge', requestBody);

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.body.judge, requestBody.judge);
    assert.strictEqual(response.body.analysis, 'Model analysis');
    assert.deepStrictEqual(response.body.usage.estimatedCost, 0);
    expect(openRouterService).toHaveBeenCalledWith(requestBody.prompt);
  });

  it('should reject advocate and judge requests without a prompt', async () => {
    const [advocateResponse, judgeResponse] = await Promise.all([
      postJson('/api/advocate', { role: 'Jon Snow defense' }),
      postJson('/api/judge', { judge: 'Judge Barak' })
    ]);

    assert.strictEqual(advocateResponse.statusCode, 400);
    assert.strictEqual(judgeResponse.statusCode, 400);
    assert.strictEqual(openRouterService.mock.calls.length, 0);
  });
});

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = http.request(
      {
        hostname: 'localhost',
        port: 3001,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (response) => {
        let responseData = '';
        response.on('data', (chunk) => { responseData += chunk; });
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            body: responseData ? JSON.parse(responseData) : {}
          });
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}
