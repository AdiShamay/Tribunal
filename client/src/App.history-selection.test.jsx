/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('Tribunal history selection', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('should restore a selected tribunal run into the main view', async () => {
    const savedCase = {
      _id: 'case-001',
      chargeSheet: 'CASE T-001: Restored charge sheet',
      executionMode: 'Unified Model',
      createdAt: '2025-03-14T18:45:00Z',
      advocateArguments: [
        { role: 'Jon Snow', argument: 'Restored defense argument.' },
        { role: 'Tyrion Lannister', argument: 'Restored strategic argument.' },
        { role: 'Daenerys Targaryen', argument: 'Restored prosecution argument.' },
        { role: 'Grey Worm', argument: 'Restored final argument.' }
      ],
      judgeVerdicts: [
        { judge: 'Barak', verdict: 'Justified', reasoning: 'Restored Barak reasoning.' },
        { judge: 'Elon', verdict: 'Not Justified', reasoning: 'Restored Elon reasoning.' },
        { judge: 'Shamgar', verdict: 'Justified', reasoning: 'Restored Shamgar reasoning.' }
      ],
      telemetry: {
        promptTokens: 210,
        completionTokens: 95,
        cost: 1.25
      }
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [savedCase]
    });

    render(<App />);

    const historyItem = await screen.findByRole('button', { name: /restore case t-001/i });
    fireEvent.click(historyItem);

    await waitFor(() => {
      expect(screen.getByDisplayValue('CASE T-001: Restored charge sheet')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Unified Model').length).toBeGreaterThan(0);
    expect(screen.getByText('Restored Barak reasoning.')).toBeInTheDocument();
    expect(screen.getByText('Not Justified')).toBeInTheDocument();
    expect(screen.getByText('Restored Elon reasoning.')).toBeInTheDocument();
    expect(screen.getByText('Restored defense argument.')).toBeInTheDocument();
    expect(screen.getByText('Restored final argument.')).toBeInTheDocument();
    expect(screen.getByText('210')).toBeInTheDocument();
    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('$1.25')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/cases');
  });
});
