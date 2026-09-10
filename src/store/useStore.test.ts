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

describe('student seat locking', () => {
  it('lockStudentToSeat sets lockedSeatId', () => {
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({ assignments: { seatA: student.id } });

    useStore.getState().lockStudentToSeat(student.id, 'seatA');

    expect(useStore.getState().students[0].lockedSeatId).toBe('seatA');
  });

  it('unlockStudent clears lockedSeatId', () => {
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({
      assignments: { seatA: student.id },
      students: [{ ...student, lockedSeatId: 'seatA' }]
    });

    useStore.getState().unlockStudent(student.id);

    expect(useStore.getState().students[0].lockedSeatId).toBeNull();
  });

  it('unassignStudent clears the lock for a locked student', () => {
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({
      assignments: { seatA: student.id },
      students: [{ ...student, lockedSeatId: 'seatA' }]
    });

    useStore.getState().unassignStudent(student.id);

    expect(useStore.getState().assignments['seatA']).toBeUndefined();
    expect(useStore.getState().students[0].lockedSeatId).toBeNull();
  });

  it('assignStudent to a different seat clears a stale lock', () => {
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({
      assignments: { seatA: student.id },
      students: [{ ...student, lockedSeatId: 'seatA' }]
    });

    useStore.getState().assignStudent(student.id, 'seatB');

    expect(useStore.getState().assignments['seatB']).toBe(student.id);
    expect(useStore.getState().students[0].lockedSeatId).toBeNull();
  });

  it('assignStudent to the same locked seat keeps the lock', () => {
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({
      assignments: { seatA: student.id },
      students: [{ ...student, lockedSeatId: 'seatA' }]
    });

    useStore.getState().assignStudent(student.id, 'seatA');

    expect(useStore.getState().students[0].lockedSeatId).toBe('seatA');
  });

  it('removeFurniture clears the lock for a student locked to a seat on that furniture', () => {
    useStore.getState().addFurniture('table-single', 0, 0);
    const furnitureId = useStore.getState().furniture[0].id;
    const seatId = furnitureId; // table-single's own id is its seat id
    useStore.getState().addStudent('Alice');
    const student = useStore.getState().students[0];
    useStore.setState({
      assignments: { [seatId]: student.id },
      students: [{ ...student, lockedSeatId: seatId }]
    });

    useStore.getState().removeFurniture(furnitureId);

    expect(useStore.getState().students[0].lockedSeatId).toBeNull();
  });
});
