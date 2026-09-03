const mongoose = require('mongoose');

jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

const connectToDatabase = require('../services/database.service');

describe('Database service', () => {
  beforeEach(() => {
    mongoose.connect.mockReset();
    process.env.MONGODB_URI = 'mongodb://test-host/tribunal';
  });

  it('should export a function that connects to MongoDB with the configured URI', async () => {
    const connection = { readyState: 1 };
    mongoose.connect.mockResolvedValue(connection);

    const result = await connectToDatabase();

    expect(typeof connectToDatabase).toBe('function');
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(result).toBe(connection);
  });
});
