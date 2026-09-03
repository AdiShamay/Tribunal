jest.mock('../services/database.service', () => jest.fn());

const connectToDatabase = require('../services/database.service');
const app = require('../app');

describe('Application startup', () => {
  beforeEach(() => {
    connectToDatabase.mockReset();
  });

  it('should connect to MongoDB before starting the Express server', async () => {
    connectToDatabase.mockResolvedValue({ readyState: 1 });

    const server = await app.startServer(0);

    expect(connectToDatabase).toHaveBeenCalledTimes(1);
    expect(server).toBeDefined();

    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });
});
