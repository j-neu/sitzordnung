import { describe, it, expect } from 'vitest';
import { runOptimization, type SeatPosition, type SolverConfig } from './solver';
import type { Student, Relationship } from '../types';

const config: SolverConfig = {
  maxIterations: 500,
  weights: { green: 1.0, red: 50.0, zone: 50.0, alone: 50.0 }
};

function student(id: string): Student {
  return { id, name: id, zonePreference: null, lockedSeatId: null, preferAlone: false };
}

describe('runOptimization', () => {
  it('never moves a locked student out of their seat, even when it would lower cost', () => {
    // s1 is right next to s2 (very close) and far from s3.
    const seats: SeatPosition[] = [
      { id: 's1', x: 0, y: 0 },
      { id: 's2', x: 0.1, y: 0 },
      { id: 's3', x: 100, y: 0 }
    ];
    const students = [student('locked'), student('mover'), student('other')];
    // A red relationship between the locked student and 'mover': the
    // optimizer wants to maximize their distance, which it can only do by
    // moving 'mover' away (it must not move 'locked').
    const relationships: Relationship[] = [
      { id: 'r1', studentAId: 'locked', studentBId: 'mover', type: 'red' }
    ];
    const initialAssignments = { s1: 'locked', s2: 'mover', s3: 'other' };

    const result = runOptimization(
      students, seats, initialAssignments, relationships, 10, config, ['s1']
    );

    expect(result.assignments['s1']).toBe('locked');
    // The optimizer should have found the available improvement: moving
    // 'mover' away from the locked student.
    expect(result.assignments['s2']).not.toBe('mover');
  });

  it('still optimizes normally when no seats are locked', () => {
    const seats: SeatPosition[] = [
      { id: 's1', x: 0, y: 0 },
      { id: 's2', x: 0.1, y: 0 },
      { id: 's3', x: 100, y: 0 }
    ];
    const students = [student('a'), student('b')];
    const relationships: Relationship[] = [
      { id: 'r1', studentAId: 'a', studentBId: 'b', type: 'green' }
    ];
    const initialAssignments = { s1: 'a', s3: 'b' };

    const result = runOptimization(
      students, seats, initialAssignments, relationships, 10, config, []
    );

    // The optimal arrangement puts 'a' and 'b' in the two adjacent seats
    // (s1, s2) and leaves the far seat (s3) empty - which one of 'a'/'b'
    // ends up in which of the two adjacent seats is an arbitrary tie, so
    // only assert on the seats used, not the exact student->seat mapping.
    expect(result.assignments['s3']).toBeFalsy();
    expect(new Set([result.assignments['s1'], result.assignments['s2']])).toEqual(new Set(['a', 'b']));
  });

  it('moves a "prefer alone" student off a shared double desk when a free seat exists', () => {
    const seats: SeatPosition[] = [
      { id: 'd-L', x: 0, y: 0 },
      { id: 'd-R', x: 0.9, y: 0 },
      { id: 's1', x: 100, y: 0 }
    ];
    const students = [
      { ...student('a'), preferAlone: true },
      student('b')
    ];
    const initialAssignments = { 'd-L': 'a', 'd-R': 'b' };

    const result = runOptimization(students, seats, initialAssignments, [], 10, config, []);

    const aSeat = Object.entries(result.assignments).find(([, sid]) => sid === 'a')?.[0];
    const siblingOfA = aSeat === 'd-L' ? 'd-R' : aSeat === 'd-R' ? 'd-L' : null;
    if (siblingOfA) {
      expect(result.assignments[siblingOfA]).toBeFalsy();
    }
  });
});
