jest.mock('../models/tribunal-case.model', () => ({
  create: jest.fn()
}));
jest.mock('../services/openrouter.service', () => jest.fn());

const TribunalCase = require('../models/tribunal-case.model');
const openRouterService = require('../services/openrouter.service');
const { createCase } = require('../controllers/case.controller');

describe('Case controller', () => {
  beforeEach(() => {
    TribunalCase.create.mockReset();
    openRouterService.mockReset();
  });

  it('should invoke OpenRouter for each judge and save the complete case', async () => {
    const request = {
      body: {
        chargeSheet: 'The Realm v. Jon Snow',
        advocateArguments: [
          { role: 'Jon Snow defense', argument: 'The killing prevented imminent harm.' }
        ],
        judgePrompts: [
          { judge: 'Judge Barak', prompt: 'Assess whether the killing was justified.' },
          { judge: 'Judge Elon', prompt: 'Assess whether the killing was justified.' }
        ]
      }
    };
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const savedCase = { _id: 'case-001', ...request.body };

    openRouterService.mockImplementation(async (prompt) => ({
      data: { choices: [{ message: { content: `Analysis for: ${prompt}` } }] },
      usage: {
        promptTokens: 10,
        completionTokens: 6,
        totalTokens: 16,
        estimatedCost: 0
      }
    }));
    TribunalCase.create.mockResolvedValue(savedCase);

    await createCase(request, response);

    expect(openRouterService).toHaveBeenCalledTimes(2);
    expect(openRouterService).toHaveBeenNthCalledWith(1, request.body.judgePrompts[0].prompt);
    expect(openRouterService).toHaveBeenNthCalledWith(2, request.body.judgePrompts[1].prompt);
    expect(TribunalCase.create).toHaveBeenCalledWith(expect.objectContaining({
      chargeSheet: request.body.chargeSheet,
      advocateArguments: request.body.advocateArguments,
      judgeVerdicts: expect.arrayContaining([
        expect.objectContaining({ judge: 'Judge Barak' }),
        expect.objectContaining({ judge: 'Judge Elon' })
      ])
    }));
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.json).toHaveBeenCalledWith(savedCase);
  });
});
