import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileToolboxSheet from './MobileToolboxSheet';
import { useStore } from '../store/useStore';
import { resetStore } from '../test/resetStore';

beforeEach(() => {
  resetStore();
});

describe('MobileToolboxSheet', () => {
  it('starts collapsed, showing no panel content', () => {
    render(<MobileToolboxSheet />);

    expect(screen.queryByText('Library')).not.toBeInTheDocument();
  });

  it('expands to show a panel when its tab is tapped, and collapses on a second tap', async () => {
    useStore.getState().addStudent('Alex Johnson');
    render(<MobileToolboxSheet />);

    await userEvent.click(screen.getByText('Students'));
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Students'));
    expect(screen.queryByText('Alex Johnson')).not.toBeInTheDocument();
  });

  it('auto-collapses when a student becomes armed for placement', async () => {
    useStore.getState().addStudent('Alex Johnson');
    render(<MobileToolboxSheet />);

    await userEvent.click(screen.getByText('Students'));
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();

    act(() => {
      useStore.getState().setPendingAssignment(useStore.getState().students[0].id);
    });

    expect(screen.queryByText('Alex Johnson')).not.toBeInTheDocument();
  });
});
