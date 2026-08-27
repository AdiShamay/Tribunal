const axios = require('axios');

jest.mock('axios');

const openRouterService = require('../services/openrouter.service');

describe('OpenRouter service', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('should prioritize well-known free models over other discovered free models', async () => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          { id: 'inclusionai/ling-3.0-flash-fin:free' },
          { id: 'google/gemma-2-9b-it:free' },
          { id: 'meta-llama/llama-3.1-8b-instruct:free' }
        ]
      }
    });
    axios.post.mockResolvedValue({ data: { choices: [] } });

    await openRouterService('Assess the case.');

    expect(axios.post.mock.calls[0][1].model).toBe('meta-llama/llama-3.1-8b-instruct:free');
  });

  it.each([429, 500])('should retry with the next free model after HTTP %s', async (status) => {
    axios.get.mockResolvedValue({
      data: {
        data: [
          { id: 'meta-llama/llama-3.1-8b-instruct:free' },
          { id: 'google/gemma-2-9b-it:free' }
        ]
      }
    });
    axios.post
      .mockRejectedValueOnce({ response: { status } })
      .mockResolvedValueOnce({ data: { choices: [] } });

    await openRouterService('Assess the case.');

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[1][1].model).toBe('google/gemma-2-9b-it:free');
  });

  it('should surface non-retryable completion errors', async () => {
    axios.get.mockResolvedValue({
      data: { data: [{ id: 'meta-llama/llama-3.1-8b-instruct:free' }] }
    });
    const error = { response: { status: 401 }, message: 'Unauthorized' };
    axios.post.mockRejectedValue(error);

    await expect(openRouterService('Assess the case.')).rejects.toBe(error);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('should log the exact API response data when a completion fails', async () => {
    axios.get.mockResolvedValue({
      data: { data: [{ id: 'meta-llama/llama-3.1-8b-instruct:free' }] }
    });
    const error = {
      response: {
        status: 401,
        data: { error: { message: 'Invalid API key' } }
      }
    };
    axios.post.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(openRouterService('Assess the case.')).rejects.toBe(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      JSON.stringify(error.response?.data, null, 2)
    );
  });
});
