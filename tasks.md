# Development Tasks

## Phase 1: Project Initialization & Setup
- [x] Initialize React + Vite project with TypeScript.
- [x] Setup Tailwind CSS.
- [x] Configure project structure (components, hooks, utils, types).
- [x] Install necessary dependencies (e.g., `konva` or `react-konva` for canvas manipulation, `lucide-react` for icons).

## Phase 2: Core Data Structures
- [x] Define TypeScript interfaces for:
  - `Student` (id, name, preferences, relationships)
  - `Seat` (id, x, y, type, occupantId, isLocked)
  - `Room` (dimensions, furniture, objects)
  - `Constraint` (type: lock, zone, relation)
- [x] Create state management store (Zustand) to hold application state.

## Phase 3: Room Editor (Canvas/SVG)
- [x] Implement UI to set Room Dimensions (Width/Height).
- [x] Implement scalable Canvas/Stage area.
- [x] Create draggable components for:
  - Teacher's Desk
  - Whiteboard
  - Door/Window
  - Tables (1-seater, 2-seater)
- [x] Implement logic to add/remove/rotate furniture.
- [x] Implement collision detection (basic) to prevent overlapping furniture.

## Phase 4: Student Management UI
- [x] Create Sidebar/Modal for student input.
- [x] Implement bulk import (paste text).
- [x] Implement manual add/edit/delete student.
- [x] Implement "Unseated Students" list.

## Phase 5: Interaction & Constraints
- [x] Implement Drag & Drop:
  - Student -> Seat (assign)
- [x] Seat -> Student (unassign)
- [x] Implement Context Menu / UI for Seat properties:
  - Lock Seat (Empty/Occupied)
  - Delete Furniture
- [x] Implement Context Menu / UI for Student properties:
  - Set Zone Preference (Front/Back)
  - Manage Relationships (Green/Red selector)
- [x] Support Double Tables (2 seats).

## Phase 6: Optimization Algorithm
- [x] Implement "Random Fill" feature (assign unseated students to random empty seats).
- [x] Design the Cost Function:
  - `Cost = (w1 * GreenDist) - (w2 * RedDist) + Penalties`
- [x] Implement the Solver (e.g., Simulated Annealing):
  - Initial state generation (random valid placement).
  - Neighbor generation (swap two students, move student to empty seat).
  - Acceptance probability logic.
- [x] Run solver in a Web Worker to prevent UI freezing.

## Phase 7: Polish & Visualization
- [X] Visualize "Green" and "Red" lines on the map during review.
- [X] Add "Generate" button with progress indicator.
- [X] Add "Print" or "Export to Image" functionality.

## Phase 8: Persistence
- [x] Implement Save Room Layout to JSON.
- [x] Implement Load Room Layout from JSON.

## Phase 9: Mobile Support (Touch Assignment + Responsive Layout)

### Phase 9a — Test infrastructure
- [x] Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom` as devDependencies; configure `test` block in `vite.config.ts`; create `src/test/setup.ts`; add `"test": "vitest run"` script.
  - Test: `src/test/smoke.test.ts` asserting `1 + 1 === 2` passes via `npm run test`.
- [x] Add a `resetStore()` test helper (`src/test/resetStore.ts`).
  - Test: `addStudent('X')`, `resetStore()`, assert `students` is empty.

### Phase 9b — Tap-to-place student assignment
- [x] Add `pendingAssignment: string | null` + `setPendingAssignment` (toggle) to `useStore.ts`.
  - Test: toggle on/off/replace semantics verified.
- [x] Add `assignPendingStudentToSeat(seatId)` action.
  - Test: assigns pending student to seat and clears pending; no-ops when nothing pending.
- [x] `setInteractionMode` also clears `pendingAssignment`.
  - Test: verified via store call.
- [x] Extract `decideSeatClickAction` pure function in `src/utils/interaction.ts`.
  - Test: table-driven coverage of all branches.
- [x] Wire `RoomCanvas.tsx` seat `onClick`/`onTap` to the new decision function; remove native `handleDragOver`/`handleDrop`.
  - Test: covered by `decideSeatClickAction` tests; manual browser check for the Konva wiring itself.
- [x] Add `PlacementBanner` component in `RoomCanvas.tsx`.
  - Test: shows armed student's name; Cancel clears `pendingAssignment`.
- [x] Make Sidebar student rows tap-to-select; remove `draggable`/`onDragStart` grip.
  - Test: click toggles `pendingAssignment` + selected style; Edit/Delete don't trigger selection; no `draggable` attribute remains.

### Phase 9c — Responsive mobile layout (mockup1.html-based)
- [x] Add `useIsMobile()` hook (`src/hooks/useIsMobile.ts`).
  - Test: mocked `matchMedia` true/false + change event.
- [x] Export `FurniturePanel`, `StudentsPanel`, `RelationsPanel`, `OptimizePanel` from `Sidebar.tsx`.
  - Test: `StudentsPanel` renders standalone correctly.
- [x] Add `MobileTopBar` component.
  - Test: renders title, Save button invokes callback.
- [x] Add `MobileToolboxSheet` component (collapsible bottom sheet, 4 tabs, auto-collapses on pending assignment).
  - Test: collapse/expand behavior + auto-collapse on pending assignment.
- [x] Update `Layout.tsx` to branch on `useIsMobile()`.
  - Test: mobile vs desktop branch renders the correct shell.
