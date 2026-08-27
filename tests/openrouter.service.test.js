const axios = require('axios');

jest.mock('axios');

const openRouterService = require('../services/openrouter.service');

describe('OpenRouter service', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  it('should export a function that handles an OpenRouter API call with axios', async () => {
    const apiResponse = {
      data: {
        choices: [{ message: { content: 'A tribunal response' } }]
      }
    };
    axios.post.mockResolvedValue(apiResponse);

    const result = await openRouterService('Assess the case.');

    expect(typeof openRouterService).toBe('function');
    expect(axios.post).toHaveBeenCalled();
    expect(result).toEqual(apiResponse);
  });

  it('should discover and use the first active free model', async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          { id: 'provider/paid-model', pricing: { prompt: '0.001', completion: '0.002' } },
          { id: 'provider/active-free:free', pricing: { prompt: '0', completion: '0' } },
          { id: 'provider/second-free:free', pricing: { prompt: '0', completion: '0' } }
        ]
      }
    });
    const apiResponse = { data: { choices: [] } };
    axios.post.mockResolvedValue(apiResponse);

    await openRouterService('Assess the case.');

    expect(axios.get).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models');
    expect(axios.post.mock.calls[0][1].model).toBe('provider/active-free:free');
  });

  it('should use a known free model when model discovery fails', async () => {
    axios.get.mockRejectedValue(new Error('Models endpoint unavailable'));
    axios.post.mockResolvedValue({ data: { choices: [] } });

    await openRouterService('Assess the case.');

    expect(axios.post.mock.calls[0][1].model).toMatch(/:free$/);
  });
});
