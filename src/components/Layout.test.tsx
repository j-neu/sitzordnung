import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from './Layout';
import { resetStore } from '../test/resetStore';

// RoomCanvas mounts a real Konva Stage, which requires a canvas implementation
// jsdom doesn't provide. Layout's mobile/desktop branching logic is independent
// of RoomCanvas's internals, so it's mocked out here (real Konva rendering is
// verified manually in a browser, per the plan).
vi.mock('./RoomCanvas', () => ({
  default: () => <div data-testid="room-canvas-mock" />,
}));

function mockMatchMedia(matches: boolean) {
  window.matchMedia = () => ({
    matches,
    media: '',
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;
}

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  resetStore();
});

describe('Layout responsive branching', () => {
  it('renders the mobile shell (MobileTopBar + MobileToolboxSheet) when the viewport is narrow', () => {
    mockMatchMedia(true);
    resetStore();

    render(<Layout />);

    expect(screen.getByText('Classroom Plan')).toBeInTheDocument(); // MobileTopBar title
    expect(screen.getByText('Save')).toBeInTheDocument(); // MobileTopBar save button
    expect(screen.getByTestId('room-canvas-mock')).toBeInTheDocument();
    // Desktop-only Sidebar chrome (export image button) should be absent.
    expect(screen.queryByTitle('Export as Image')).not.toBeInTheDocument();
  });

  it('renders the desktop shell (Sidebar) when the viewport is wide', () => {
    mockMatchMedia(false);
    resetStore();

    render(<Layout />);

    expect(screen.queryByText('Classroom Plan')).not.toBeInTheDocument();
    expect(screen.getByTestId('room-canvas-mock')).toBeInTheDocument();
    // Desktop Sidebar renders the app title and export button.
    expect(screen.getByText('Seating-Chart Generator')).toBeInTheDocument();
    expect(screen.getByTitle('Export as Image')).toBeInTheDocument();
  });
});
