/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('Tribunal API integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('should send the tribunal request to /api/verdict and render the complete response', async () => {
    const tribunalResponse = {
      judges: [
        { name: 'Barak', decision: 'Justified', reasoning: 'The threat to civilians was imminent.' },
        { name: 'Elon', decision: 'Not Justified', reasoning: 'Safer alternatives were available.' },
        { name: 'Shamgar', decision: 'Justified', reasoning: 'The realm required immediate protection.' }
      ],
      advocates: [
        { name: 'Jon Snow', argument: 'The defense argument from the API.' },
        { name: 'Tyrion Lannister', argument: 'The strategic defense argument from the API.' },
        { name: 'Daenerys Targaryen', argument: 'The prosecution argument from the API.' },
        { name: 'Grey Worm', argument: 'The final prosecution argument from the API.' }
      ],
      telemetry: {
        promptTokens: 321,
        completionTokens: 144,
        totalRunCost: 0
      }
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => tribunalResponse
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /commence tribunal/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      '/api/verdict',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('CASE T-001')
      })
    ));

    expect(await screen.findByText('The threat to civilians was imminent.')).toBeInTheDocument();
    expect(screen.getByText('Not Justified')).toBeInTheDocument();
    expect(screen.getByText('The defense argument from the API.')).toBeInTheDocument();
    expect(screen.getByText('The final prosecution argument from the API.')).toBeInTheDocument();
    expect(screen.getByText('321')).toBeInTheDocument();
    expect(screen.getByText('144')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });

  it('should show the loading state while the tribunal request is pending', async () => {
    let resolveRequest;
    global.fetch.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    render(<App />);
    const button = screen.getByRole('button', { name: /commence tribunal/i });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('The Tribunal is deliberating...');

    resolveRequest({ ok: true, json: async () => ({}) });
    await waitFor(() => expect(button).not.toBeDisabled());
  });

  it('should show a visible error when the tribunal request fails', async () => {
    global.fetch.mockRejectedValue(new Error('Tribunal service unavailable'));

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /commence tribunal/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tribunal service unavailable');
  });

  it('should preserve all judge and advocate slots when the API returns incomplete arrays', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        judges: [{ name: 'Barak', decision: 'Justified', reasoning: 'Returned opinion.' }],
        advocates: [{ name: 'Jon Snow', argument: 'Returned argument.' }],
        telemetry: { promptTokens: 1, completionTokens: 1, totalRunCost: 0 }
      })
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /commence tribunal/i }));

    expect(await screen.findByText('Returned opinion.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Elon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shamgar' })).toBeInTheDocument();
    expect(screen.getByText('Returned argument.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tyrion Lannister' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daenerys Targaryen' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Grey Worm' })).toBeInTheDocument();
  });
});
