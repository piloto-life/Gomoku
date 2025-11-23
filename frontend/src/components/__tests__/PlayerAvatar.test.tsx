import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import md5 from 'blueimp-md5';

// Mock the auth hook so PlayerAvatar can read a predictable user
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';
import PlayerAvatar from '../PlayerAvatar';

describe('PlayerAvatar', () => {
  beforeEach(() => {
    // reset mock implementation before each test
    (useAuth as jest.Mock).mockReset();
  });

  it('renders gravatar URL when user has email and no explicit avatar', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', email: 'test@example.com', avatar: undefined } });

    render(<PlayerAvatar />);

    const img = screen.getByRole('img') as HTMLImageElement;
    const expected = `https://www.gravatar.com/avatar/${md5('test@example.com')}?s=80&d=identicon&r=pg`;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe(expected);
  });

  it('falls back to generated avatar on error and recovers when prop changes', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u2', email: 'alice@example.com', avatar: undefined } });

    const { rerender } = render(<PlayerAvatar name="Alice" avatarUrl="https://bad.example.com/missing.png" />);
    const img = screen.getByRole('img') as HTMLImageElement;

    // Simulate image load error
    fireEvent.error(img);

    // After error, the component should show a generated data URL (svg)
    await waitFor(() => {
      expect(img.src.startsWith('data:image/svg+xml')).toBe(true);
    });

    // Now provide a new valid avatarUrl prop and ensure the component recovers
    rerender(<PlayerAvatar name="Alice" avatarUrl="https://good.example.com/ok.png" />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://good.example.com/ok.png');
    });
  });
});
