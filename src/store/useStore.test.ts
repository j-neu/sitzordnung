import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './useStore';
import { resetStore } from '../test/resetStore';

beforeEach(() => {
  resetStore();
});

describe('resetStore test helper', () => {
  it('wipes state added by a previous test', () => {
    useStore.getState().addStudent('X');
    expect(useStore.getState().students).toHaveLength(1);

    resetStore();

    expect(useStore.getState().students).toEqual([]);
  });
});

describe('setPendingAssignment', () => {
  it('sets the pending student', () => {
    useStore.getState().setPendingAssignment('s1');
    expect(useStore.getState().pendingAssignment).toBe('s1');
  });

  it('toggles off when called again with the same id', () => {
    useStore.getState().setPendingAssignment('s1');
    useStore.getState().setPendingAssignment('s1');
    expect(useStore.getState().pendingAssignment).toBeNull();
  });

  it('replaces the pending student when a different id is set', () => {
    useStore.getState().setPendingAssignment('s1');
    useStore.getState().setPendingAssignment('s2');
    expect(useStore.getState().pendingAssignment).toBe('s2');
  });
});

describe('assignPendingStudentToSeat', () => {
  it('assigns the pending student to the seat and clears pending', () => {
    useStore.setState({ pendingAssignment: 'stu1' });

    useStore.getState().assignPendingStudentToSeat('seatX');

    expect(useStore.getState().assignments['seatX']).toBe('stu1');
    expect(useStore.getState().pendingAssignment).toBeNull();
  });

  it('is a no-op when nothing is pending', () => {
    useStore.setState({ assignments: { seatX: 'someoneElse' } });

    useStore.getState().assignPendingStudentToSeat('seatX');

    expect(useStore.getState().assignments).toEqual({ seatX: 'someoneElse' });
  });
});

describe('setInteractionMode', () => {
  it('clears a pending assignment when switching tools', () => {
    useStore.setState({ pendingAssignment: 'stu1' });

    useStore.getState().setInteractionMode('green');

    expect(useStore.getState().pendingAssignment).toBeNull();
  });
});
