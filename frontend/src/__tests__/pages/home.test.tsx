import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '@/app/page';

const { __routerMock } = jest.requireMock('next/navigation');

describe('HomePage', () => {
  beforeEach(() => {
    __routerMock.push.mockClear();
    window.sessionStorage.clear();
  });

  it('submits query and navigates to assistant page', () => {
    render(<HomePage />);

    const textarea = screen.getByPlaceholderText(/medical device regulations/i);
    fireEvent.change(textarea, { target: { value: 'Test query' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });

    expect(__routerMock.push).toHaveBeenCalledWith('/assistant?q=Test%20query');
    expect(window.sessionStorage.getItem('pendingQuery')).toBe('Test query');
  });
});

