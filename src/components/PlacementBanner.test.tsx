import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlacementBanner } from './RoomCanvas';

describe('PlacementBanner', () => {
  it("shows the armed student's name", () => {
    render(<PlacementBanner studentName="Alex Johnson" onCancel={() => {}} />);

    expect(screen.getByText(/Alex Johnson/)).toBeInTheDocument();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<PlacementBanner studentName="Alex Johnson" onCancel={onCancel} />);

    await userEvent.click(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
