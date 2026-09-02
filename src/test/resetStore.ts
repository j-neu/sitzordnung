import { useStore } from '../store/useStore';

const DEFAULT_ROOM_WIDTH = 8;
const DEFAULT_ROOM_HEIGHT = 10;

export function resetStore() {
  useStore.setState({
    width: DEFAULT_ROOM_WIDTH,
    height: DEFAULT_ROOM_HEIGHT,
    unit: 'meters',
    language: 'en',
    furniture: [],
    students: [],
    relationships: [],
    assignments: {},
    isOptimizing: false,
    optimizationStats: null,
    optimizationReport: null,
    interactionMode: 'none',
    relationSelection: null,
    pendingAssignment: null,
  });
}
