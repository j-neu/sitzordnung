import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTopBar from './MobileTopBar';

describe('MobileTopBar', () => {
  it('renders the given title', () => {
    render(<MobileTopBar title="Grade 4 - Room 102" onSave={() => {}} />);

    expect(screen.getByText('Grade 4 - Room 102')).toBeInTheDocument();
  });

  it('invokes onSave when the Save button is clicked', async () => {
    const onSave = vi.fn();
    render(<MobileTopBar title="Room" onSave={onSave} />);

    await userEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
