import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '@/components/ui/Modal';

describe('Modal', () => {
  it('renders when open and closes on button click', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()} title="Hidden">
        Hidden
      </Modal>
    );
    expect(container.firstChild).toBeNull();
  });
});

