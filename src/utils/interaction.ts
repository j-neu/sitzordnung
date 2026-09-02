export type InteractionMode = 'none' | 'green' | 'red' | 'define';

export type SeatClickAction = 'relation' | 'assign' | 'none';

export function decideSeatClickAction({
  interactionMode,
  hasStudent,
  hasPendingAssignment,
}: {
  interactionMode: InteractionMode;
  hasStudent: boolean;
  hasPendingAssignment: boolean;
}): SeatClickAction {
  if (interactionMode !== 'none') {
    return hasStudent ? 'relation' : 'none';
  }

  if (hasPendingAssignment) {
    return 'assign';
  }

  return 'none';
}
