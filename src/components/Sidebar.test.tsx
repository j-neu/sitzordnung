import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentsPanel } from './Sidebar';
import { useStore } from '../store/useStore';
import { resetStore } from '../test/resetStore';

beforeEach(() => {
  resetStore();
});

describe('StudentsPanel standalone rendering', () => {
  it('renders correctly when imported and rendered outside the desktop Sidebar shell', () => {
    useStore.getState().addStudent('Jamie Rivera');

    render(<StudentsPanel />);

    expect(screen.getByText('Jamie Rivera')).toBeInTheDocument();
  });
});

describe('StudentsPanel tap-to-select', () => {
  it('selecting an unassigned student sets pendingAssignment and highlights the row', async () => {
    useStore.getState().addStudent('Alex Johnson');
    const studentId = useStore.getState().students[0].id;

    render(<StudentsPanel />);

    const row = screen.getByTestId(`student-row-${studentId}`);
    expect(row).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(row);

    expect(useStore.getState().pendingAssignment).toBe(studentId);
    expect(row).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking the same student again deselects it', async () => {
    useStore.getState().addStudent('Alex Johnson');
    const studentId = useStore.getState().students[0].id;

    render(<StudentsPanel />);
    const row = screen.getByTestId(`student-row-${studentId}`);

    await userEvent.click(row);
    expect(useStore.getState().pendingAssignment).toBe(studentId);

    await userEvent.click(row);
    expect(useStore.getState().pendingAssignment).toBeNull();
  });

  it('does not have a draggable attribute (native HTML5 drag removed)', () => {
    useStore.getState().addStudent('Alex Johnson');
    const studentId = useStore.getState().students[0].id;

    render(<StudentsPanel />);
    const row = screen.getByTestId(`student-row-${studentId}`);

    expect(row.getAttribute('draggable')).not.toBe('true');
  });

  it('clicking Edit opens the edit modal without selecting the student', async () => {
    useStore.getState().addStudent('Alex Johnson');
    const studentId = useStore.getState().students[0].id;

    render(<StudentsPanel />);
    const row = screen.getByTestId(`student-row-${studentId}`);

    // The row's first button is Edit, the second is Delete.
    const editButton = row.querySelectorAll('button')[0];
    await userEvent.click(editButton);

    expect(useStore.getState().pendingAssignment).toBeNull();
    expect(await screen.findByDisplayValue('Alex Johnson')).toBeInTheDocument();
  });
});
