import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadModal } from '@/components/ui/UploadModal';

describe('UploadModal', () => {
  const onClose = jest.fn();
  const onUploadComplete = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [{ doc_id: 'doc1', filename: 'test.pdf', chunks: 2 }] }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders when isOpen is true', () => {
    render(
      <UploadModal isOpen onClose={onClose} onUploadComplete={onUploadComplete} />
    );
    expect(screen.getByText(/Upload Documents/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <UploadModal isOpen={false} onClose={onClose} onUploadComplete={onUploadComplete} />
    );
    expect(screen.queryByText(/Upload Documents/i)).not.toBeInTheDocument();
  });

  it('shows validation error for unsupported file type', async () => {
    const { container } = render(
      <UploadModal isOpen onClose={onClose} onUploadComplete={onUploadComplete} />
    );

    // First verify modal is rendered
    const uploadTexts = screen.queryAllByText(/Upload Documents/i);
    expect(uploadTexts.length).toBeGreaterThan(0);
    
    const input = container.querySelector('[data-testid="upload-input"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    
    const badFile = new File(['oops'], 'malware.exe', { type: 'application/octet-stream' });
    
    await act(async () => {
      await userEvent.upload(input, badFile);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 10000);

  it('uploads valid files and calls onUploadComplete', async () => {
    const { container } = render(
      <UploadModal isOpen onClose={onClose} onUploadComplete={onUploadComplete} />
    );

    // First verify modal is rendered
    const uploadTexts = screen.queryAllByText(/Upload Documents/i);
    expect(uploadTexts.length).toBeGreaterThan(0);

    const input = container.querySelector('[data-testid="upload-input"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    
    const goodFile = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    
    await act(async () => {
      await userEvent.upload(input, goodFile);
    });

    await waitFor(() => {
      const uploadButtons = screen.getAllByRole('button');
      const uploadButton = uploadButtons.find(btn => btn.textContent?.includes('Upload') && btn.textContent?.includes('file'));
      expect(uploadButton).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      const uploadButtons = screen.getAllByRole('button');
      const uploadButton = uploadButtons.find(btn => btn.textContent?.includes('Upload') && btn.textContent?.includes('file'));
      if (uploadButton) {
        fireEvent.click(uploadButton);
      }
    });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1), { timeout: 5000 });
    await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith([{ doc_id: 'doc1', filename: 'test.pdf', chunks: 2 }]), { timeout: 5000 });

    // allow close timeout to run
    act(() => {
      jest.runAllTimers();
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled(), { timeout: 2000 });
  }, 15000);
});

