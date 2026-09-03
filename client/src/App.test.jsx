/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react';
import App from './App';

describe('Tribunal frontend', () => {
  it('renders the complete Case T-001 tribunal workspace', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /the tribunal: case t-001/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/charge sheet/i)).toHaveAttribute('readonly');
    expect(screen.getByRole('radio', { name: /unified model/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /multi-model matrix/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commence tribunal/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /judicial panel/i })).toBeInTheDocument();
    expect(screen.getByText(/barak/i)).toBeInTheDocument();
    expect(screen.getByText(/elon/i)).toBeInTheDocument();
    expect(screen.getByText(/shamgar/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /advocate arguments/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /jon snow/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /tyrion/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /daenerys/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /grey worm/i })).toBeInTheDocument();
    expect(screen.getByText(/total prompt tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/total completion tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/total run cost/i)).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument();
  });
});
