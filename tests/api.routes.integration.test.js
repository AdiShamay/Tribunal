jest.mock('../services/openrouter.service', () => jest.fn());
jest.mock('../models/tribunal-case.model', () => ({
  create: jest.fn()
}));

const http = require('http');
const openRouterService = require('../services/openrouter.service');
const TribunalCase = require('../models/tribunal-case.model');
const app = require('../app');
let activePort;

describe('API route integration', () => {
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
    openRouterService.mockResolvedValue({
      data: {
        choices: [{ message: { content: 'Model analysis' } }]
      },
      usage: {
        promptTokens: 10,
        completionTokens: 6,
        totalTokens: 16,
        estimatedCost: 0
      }
    });
    TribunalCase.create.mockResolvedValue({
      _id: 'case-001',
      chargeSheet: 'The Realm v. Jon Snow',
      advocateArguments: [],
      judgeVerdicts: []
    });
  });

  it('should make all API endpoints reachable through the main app', async () => {
    const responses = await Promise.all([
      request('GET', '/api/status'),
      request('POST', '/api/verdict', {
        advocates: ['Jon Snow defense']
      }),
      request('POST', '/api/advocate', {
        role: 'Jon Snow defense',
        prompt: 'Assess the case.'
      }),
      request('POST', '/api/judge', {
        judge: 'Judge Barak',
        prompt: 'Decide the case.'
      }),
      request('POST', '/api/cases', {
        chargeSheet: 'The Realm v. Jon Snow',
        advocateArguments: [],
        judgePrompts: [{ judge: 'Judge Barak', prompt: 'Decide the case.' }]
      })
    ]);

    expect(responses[0].statusCode).toBe(200);
    expect(responses[1].statusCode).toBe(200);
    expect(responses[2].statusCode).toBe(200);
    expect(responses[3].statusCode).toBe(200);
    expect(responses[4].statusCode).toBe(201);
    expect(responses[4].body._id).toBe('case-001');
  });
});

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : '';
    const requestOptions = {
      method,
      hostname: 'localhost',
      port: activePort,
      path,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const clientRequest = http.request(requestOptions, (response) => {
      let responseData = '';
      response.on('data', (chunk) => { responseData += chunk; });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          body: responseData ? JSON.parse(responseData) : {}
        });
      });
    });

    clientRequest.on('error', reject);
    if (payload) {
      clientRequest.write(payload);
    }
    clientRequest.end();
  });
}
