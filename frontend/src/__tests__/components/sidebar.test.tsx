import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

jest.mock('@/context/ProjectContext', () => {
  const currentProject = { id: 'p1', name: 'Alpha' };
  const projects = [
    currentProject,
    { id: 'p2', name: 'Beta' },
  ];
  return {
    useProject: () => ({
      currentProject,
      projects,
      switchProject: jest.fn(),
    }),
  };
});

describe('Sidebar', () => {
  it('renders project switcher and navigation links', () => {
    render(<Sidebar />);

    expect(screen.getByText(/Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/Overview/)).toBeInTheDocument();
  });

  it('opens project dropdown', () => {
    render(<Sidebar />);
    const button = screen.getByRole('button', { name: /current workspace/i });
    fireEvent.click(button);
    expect(screen.getByText(/All Projects/)).toBeInTheDocument();
  });
});

