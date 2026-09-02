import { describe, it, expect } from 'vitest';
import { decideSeatClickAction, type InteractionMode } from './interaction';

describe('decideSeatClickAction', () => {
  const cases: {
    interactionMode: InteractionMode;
    hasStudent: boolean;
    hasPendingAssignment: boolean;
    expected: 'relation' | 'assign' | 'none';
  }[] = [
    { interactionMode: 'none', hasStudent: false, hasPendingAssignment: false, expected: 'none' },
    { interactionMode: 'none', hasStudent: true, hasPendingAssignment: false, expected: 'none' },
    { interactionMode: 'none', hasStudent: false, hasPendingAssignment: true, expected: 'assign' },
    { interactionMode: 'none', hasStudent: true, hasPendingAssignment: true, expected: 'assign' },
    { interactionMode: 'green', hasStudent: true, hasPendingAssignment: false, expected: 'relation' },
    { interactionMode: 'green', hasStudent: false, hasPendingAssignment: false, expected: 'none' },
    { interactionMode: 'red', hasStudent: true, hasPendingAssignment: true, expected: 'relation' },
    { interactionMode: 'define', hasStudent: true, hasPendingAssignment: false, expected: 'relation' },
    { interactionMode: 'define', hasStudent: false, hasPendingAssignment: true, expected: 'none' },
  ];

  it.each(cases)(
    'mode=$interactionMode hasStudent=$hasStudent hasPendingAssignment=$hasPendingAssignment -> $expected',
    ({ interactionMode, hasStudent, hasPendingAssignment, expected }) => {
      expect(decideSeatClickAction({ interactionMode, hasStudent, hasPendingAssignment })).toBe(expected);
    }
  );
});
