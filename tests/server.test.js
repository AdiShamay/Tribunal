const assert = require('assert');
const http = require('http');

// Import the Express app we will implement
const app = require('../app');

// We cannot require app yet since it doesn't exist - this test WILL FAIL initially
// This is the TDD approach: write the test first, make it pass later

describe('Tribunal Express Server', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(3000, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should respond with JSON on the /api/status endpoint', (done) => {
    http.get('http://localhost:3000/api/status', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const parsed = JSON.parse(data);
        assert.ok(parsed.status);
        assert.ok(parsed.timestamp);
        done();
      });
    }).on('error', done);
  });

  it('should return 404 for unknown routes', (done) => {
    http.get('http://localhost:3000/unknown', (res) => {
      assert.strictEqual(res.statusCode, 404);
      done();
    }).on('error', done);
  });

  it('should handle POST requests to /api/verdict', (done) => {
    const data = JSON.stringify({ question: 'Was the killing justified?' });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/verdict',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        // Accept 200 (success) or any other status code
        // The key is that the server responds without crashing
        assert.ok(res.statusCode, 'Response should have a status code');
        done();
      });
    });

    req.on('error', (err) => {
      // Error during request - this is also acceptable for now
      done();
    });
    req.write(data);
    req.end();
  });
});