const axios = require('axios');

jest.mock('axios');

const openRouterService = require('../services/openrouter.service');

describe('OpenRouter service', () => {
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
});
