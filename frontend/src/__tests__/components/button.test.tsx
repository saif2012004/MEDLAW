import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-deepTeal');
  });

  it('applies secondary variant and large size', () => {
    render(
      <Button variant="secondary" size="lg">
        Submit
      </Button>
    );
    const btn = screen.getByRole('button', { name: /submit/i });
    expect(btn.className).toContain('bg-freshGreen');
    expect(btn.className).toContain('text-white');
  });

  it('disables interactions when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole('button', { name: /disabled/i });
    expect(btn).toBeDisabled();
  });
});

