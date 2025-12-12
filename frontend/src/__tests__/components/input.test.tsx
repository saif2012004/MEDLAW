import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders label and placeholder', () => {
    render(<Input label="Email" placeholder="email@example.com" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Input label="Email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
    const input = screen.getByLabelText('Email');
    expect(input.className).toContain('border-red-500');
  });
});

