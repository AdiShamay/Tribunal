jest.mock('../models/tribunal-case.model', () => ({
  create: jest.fn(),
  find: jest.fn()
}));

const http = require('http');
const TribunalCase = require('../models/tribunal-case.model');
const app = require('../app');
let activePort;

describe('GET /api/cases history', () => {
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
    TribunalCase.find.mockReset();
  });

  it('should return persisted tribunal cases from MongoDB', async () => {
    const history = [
      {
        _id: 'case-001',
        chargeSheet: 'The Realm v. Jon Snow',
        advocateArguments: [{ role: 'Jon Snow defense', argument: 'Defense argument.' }],
        judgeVerdicts: [{ judge: 'Barak', verdict: 'Justified', reasoning: 'Necessary defense.' }]
      }
    ];
    TribunalCase.find.mockResolvedValue(history);

    const response = await getJson('/api/cases');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(history);
    expect(TribunalCase.find).toHaveBeenCalledWith({});
  });

  it('should return an empty array when no tribunal cases have been persisted', async () => {
    TribunalCase.find.mockResolvedValue([]);

    const response = await getJson('/api/cases');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });
});

function getJson(path) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      hostname: 'localhost',
      port: activePort,
      path,
      method: 'GET'
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
    request.end();
  });
}
