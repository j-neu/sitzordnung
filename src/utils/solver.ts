import type { Student, Relationship } from '../types';

export type SeatPosition = {
  id: string;
  x: number;
  y: number;
};

export type SolverConfig = {
  maxIterations: number;
  weights: {
    green: number; // Distance minimization for friends (and for a "prefer front" zone preference)
    red: number;   // Distance maximization for enemies (and for a "prefer back" zone preference)
    alone: number; // Penalty for sharing a double desk when the student prefers to sit alone
  };
};

export type SolverResult = {
  assignments: Record<string, string | null>;
  cost: number;
  iterations: number;
};

export function runOptimization(
  students: Student[],
  seats: SeatPosition[],
  initialAssignments: Record<string, string | null>,
  relationships: Relationship[],
  whiteboardPos: { x: number; y: number } | null,
  config: SolverConfig,
  lockedSeatIds: string[] = [],
  onProgress?: (result: SolverResult) => void
): SolverResult {
  // Current state: Map<seatId, studentId | null>
  let currentAssignments = { ...initialAssignments };

  // Pre-calculate Seat positions Map for O(1) access
  const seatPosMap = new Map<string, {x: number, y: number}>();
  seats.forEach(s => seatPosMap.set(s.id, { x: s.x, y: s.y }));

  // Sibling seat on the same double desk (table-double seats are always
  // "furnitureId-L"/"furnitureId-R" - see SEAT_LAYOUTS in constants.ts),
  // derived purely from the seat-id string so this doesn't need furniture
  // data. A single-table seat has no sibling.
  const seatIdSet = new Set(seats.map(s => s.id));
  const siblingSeatMap = new Map<string, string | null>();
  seats.forEach(s => {
    let sibling: string | null = null;
    if (s.id.endsWith('-L')) sibling = s.id.slice(0, -2) + '-R';
    else if (s.id.endsWith('-R')) sibling = s.id.slice(0, -2) + '-L';
    siblingSeatMap.set(s.id, sibling && seatIdSet.has(sibling) ? sibling : null);
  });

  // Pre-process relationships for faster lookup
  const studentRels = new Map<string, { friends: string[], enemies: string[] }>();
  students.forEach(s => studentRels.set(s.id, { friends: [], enemies: [] }));

  relationships.forEach(r => {
    const sA = studentRels.get(r.studentAId);
    const sB = studentRels.get(r.studentBId);
    if (sA) {
        if (r.type === 'green') sA.friends.push(r.studentBId);
        else sA.enemies.push(r.studentBId);
    }
    if (sB) {
        if (r.type === 'green') sB.friends.push(r.studentAId);
        else sB.enemies.push(r.studentAId);
    }
  });

  // Cost Function
  const calculateCost = (assigns: Record<string, string | null>) => {
    let cost = 0;

    const placedStudents = new Map<string, string>(); // studentId -> seatId
    for (const [seatId, studentId] of Object.entries(assigns)) {
        if (studentId) placedStudents.set(studentId, seatId);
    }

    // 1. Zone Preferences - treated as a "relationship" with the whiteboard:
    // "front" behaves like a green (like) relationship (cost grows with
    // distance, so the optimizer pulls the student as close as it can),
    // "back" like a red (dislike) one (cost spikes as distance shrinks, so
    // merely being on the correct side of the room isn't enough - it keeps
    // pushing toward the far wall). Same formulas as the relationship cost
    // below, just against a fixed whiteboard point instead of another seat.
    if (whiteboardPos) {
        students.forEach(s => {
            if (!s.zonePreference) return;

            const seatId = placedStudents.get(s.id);
            if (!seatId) return;

            const pos = seatPosMap.get(seatId);
            if (!pos) return;

            const dx = pos.x - whiteboardPos.x;
            const dy = pos.y - whiteboardPos.y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);

            if (s.zonePreference === 'front') {
                cost += dist * config.weights.green;
            } else {
                cost += (config.weights.red * 10) / (distSq + 0.1);
            }
        });
    }

    // 2. Sit-alone preference
    students.forEach(s => {
        if (!s.preferAlone) return;
        const seatId = placedStudents.get(s.id);
        if (!seatId) return;

        const siblingSeatId = siblingSeatMap.get(seatId);
        if (siblingSeatId && assigns[siblingSeatId]) cost += config.weights.alone;
    });

    // 3. Relationships
    relationships.forEach(r => {
        const seatA = placedStudents.get(r.studentAId);
        const seatB = placedStudents.get(r.studentBId);

        if (seatA && seatB) {
            const posA = seatPosMap.get(seatA)!;
            const posB = seatPosMap.get(seatB)!;

            const dx = posA.x - posB.x;
            const dy = posA.y - posB.y;
            const distSq = dx*dx + dy*dy;
            const dist = Math.sqrt(distSq);

            if (r.type === 'green') {
                cost += dist * config.weights.green;
            } else {
                cost += (config.weights.red * 10) / (distSq + 0.1);
            }
        }
    });

    return cost;
  };

  // Simulated Annealing Loop
  let currentCost = calculateCost(currentAssignments);
  let bestAssignments = { ...currentAssignments };
  let bestCost = currentCost;

  let temperature = 100.0;
  const coolingRate = 0.995;
  const absoluteZero = 0.001;

  // Locked seats are excluded from the swap-candidate pool entirely, so
  // their assignment can never be picked as idx1/idx2 below and therefore
  // never changes for the duration of the run.
  const lockedSet = new Set(lockedSeatIds);
  const seatIds = seats.map(s => s.id).filter(id => !lockedSet.has(id));

  let iteration = 0;

  while (temperature > absoluteZero && iteration < config.maxIterations) {
    const newAssignments = { ...currentAssignments };

    const idx1 = Math.floor(Math.random() * seatIds.length);
    const idx2 = Math.floor(Math.random() * seatIds.length);

    const seat1 = seatIds[idx1];
    const seat2 = seatIds[idx2];

    if (seat1 !== undefined && seat2 !== undefined && seat1 !== seat2) {
        const student1 = newAssignments[seat1];
        const student2 = newAssignments[seat2];

        newAssignments[seat1] = student2;
        newAssignments[seat2] = student1;

        const newCost = calculateCost(newAssignments);
        const delta = newCost - currentCost;

        if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
            currentAssignments = newAssignments;
            currentCost = newCost;

            if (currentCost < bestCost) {
                bestCost = currentCost;
                bestAssignments = { ...currentAssignments };
            }
        }
    }

    temperature *= coolingRate;
    iteration++;

    if (onProgress && iteration % 500 === 0) {
        onProgress({ assignments: currentAssignments, cost: currentCost, iterations: iteration });
    }
  }

  return { assignments: bestAssignments, cost: bestCost, iterations: iteration };
}
