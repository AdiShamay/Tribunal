/** @jest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('Tribunal history view', () => {
  afterEach(() => {
    delete global.fetch;
  });

  it('should fetch and display past tribunal cases in a history sidebar', async () => {
    const today = new Date('2025-03-14T18:45:00Z');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          _id: 'case-002',
          chargeSheet: 'Case T-002: The Wall v. The Night King',
          createdAt: today.toISOString(),
          executionMode: 'Multi-Model Matrix',
          judgeVerdicts: [
            { judge: 'Barak', verdict: 'Justified', reasoning: 'The response was necessary.' }
          ]
        },
        {
          _id: 'case-001',
          chargeSheet: 'Case T-001: The Realm v. Jon Snow',
          createdAt: new Date('2025-03-13T09:30:00Z').toISOString(),
          executionMode: 'Unified Model',
          judgeVerdicts: [
            { judge: 'Elon', verdict: 'Not Justified', reasoning: 'Alternatives existed.' }
          ]
        }
      ]
    });

    render(<App />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/cases'));
    expect(await screen.findByRole('complementary', { name: /tribunal history/i })).toBeInTheDocument();
    expect(screen.getByText('CASE T-002')).toBeInTheDocument();
    expect(screen.getByText('CASE T-001')).toBeInTheDocument();
    expect(screen.getByText('14/03/2025 20:45')).toBeInTheDocument();
    expect(screen.getAllByText(/multi-model matrix/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/unified model/i).length).toBeGreaterThan(0);
  });

  it('should show an empty state when no previous cases exist', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(<App />);

    expect(await screen.findByText(/no previous tribunal cases/i)).toBeInTheDocument();
  });

  it('should show a visible error when case history cannot be loaded', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('History service unavailable'));

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('History service unavailable');
  });
});
