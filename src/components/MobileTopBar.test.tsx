import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileTopBar from './MobileTopBar';
import { useStore } from '../store/useStore';
import { resetStore } from '../test/resetStore';

beforeEach(() => {
  resetStore();
});

describe('MobileTopBar', () => {
  it("renders the app title translated for the current language", () => {
    render(<MobileTopBar onSave={() => {}} />);

    expect(screen.getByText('Seating-Chart Generator')).toBeInTheDocument();
  });

  it('invokes onSave when the Save button is clicked', async () => {
    const onSave = vi.fn();
    render(<MobileTopBar onSave={onSave} />);

    await userEvent.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('switches the displayed title when the DE/EN toggle is clicked', async () => {
    render(<MobileTopBar onSave={() => {}} />);

    expect(screen.getByText('Seating-Chart Generator')).toBeInTheDocument();

    await userEvent.click(screen.getByText('DE'));

    expect(useStore.getState().language).toBe('de');
    expect(screen.getByText('Sitzordnung-Generator')).toBeInTheDocument();
    expect(screen.queryByText('Seating-Chart Generator')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('EN'));

    expect(useStore.getState().language).toBe('en');
    expect(screen.getByText('Seating-Chart Generator')).toBeInTheDocument();
  });
});
