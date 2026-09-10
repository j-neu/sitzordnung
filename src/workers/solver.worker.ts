import type { Student, Relationship } from '../types';
import { runOptimization, type SeatPosition, type SolverConfig } from '../utils/solver';

type SolverMessage = {
  type: 'START';
  payload: {
    students: Student[];
    seats: SeatPosition[];
    assignments: Record<string, string | null>;
    relationships: Relationship[];
    whiteboardPos: { x: number; y: number } | null;
    lockedSeatIds?: string[];
    config: SolverConfig;
  };
};

self.onmessage = (e: MessageEvent<SolverMessage>) => {
  if (e.data.type === 'START') {
    const { students, seats, assignments, relationships, whiteboardPos, lockedSeatIds, config } = e.data.payload;

    const result = runOptimization(
      students,
      seats,
      assignments,
      relationships,
      whiteboardPos,
      config,
      lockedSeatIds ?? [],
      (progress) => {
        self.postMessage({
          type: 'PROGRESS',
          payload: {
            currentCost: progress.cost,
            assignments: progress.assignments,
            iteration: progress.iterations
          }
        });
      }
    );

    self.postMessage({
      type: 'DONE',
      payload: {
        currentCost: result.cost,
        assignments: result.assignments,
        iteration: result.iterations
      }
    });
  }
};
