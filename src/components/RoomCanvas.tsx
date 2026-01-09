import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva';
import { useStore } from '../store/useStore';
import type { Furniture, FurnitureType, Student } from '../types';

const PIXELS_PER_METER = 100;
const GRID_SIZE_METERS = 0.5;

const FURNITURE_DIMENSIONS: Record<FurnitureType, { width: number; height: number; color: string }> = {
  'table-single': { width: 1.0, height: 0.8, color: '#FFFFFF' }, // Wider to fit card content
  'table-double': { width: 1.8, height: 0.8, color: '#FFFFFF' },
  'teacher-desk': { width: 1.6, height: 0.8, color: '#EFF6FF' }, // Light blue background
  'whiteboard': { width: 3.0, height: 0.2, color: '#E5E7EB' },
  'door': { width: 1.0, height: 1.0, color: '#E5E7EB' },
  'window': { width: 1.5, height: 0.1, color: '#34D399' },
};

export default function RoomCanvas() {
  const { width, height, furniture, updateFurniture, assignments, students } = useStore();
  
  const stageWidth = width * PIXELS_PER_METER;
  const stageHeight = height * PIXELS_PER_METER;
  const PADDING = 60;

  // Dot Grid Generation
  const dots = [];
  const gridStep = GRID_SIZE_METERS * PIXELS_PER_METER;
  
  for (let x = 0; x <= stageWidth; x += gridStep) {
    for (let y = 0; y <= stageHeight; y += gridStep) {
      dots.push(
        <Circle 
          key={`${x}-${y}`} 
          x={x} 
          y={y} 
          radius={1.5} 
          fill="#CBD5E1" // Slate-300
        />
      );
    }
  }

  // Helper to find student for a seat (simplified: assumes 1 seat per furniture for now for single tables)
  // In a real app, furniture would have multiple seats defined. 
  // For this prototype, we treat the whole furniture ID as the seat key for single tables.
  const getStudentForFurniture = (furnitureId: string) => {
    const studentId = assignments[furnitureId];
    return students.find(s => s.id === studentId);
  };

  return (
    <div className="h-full w-full overflow-auto bg-gray-50 custom-scrollbar relative">
      <div className="min-w-fit min-h-fit p-16 flex justify-center items-center">
        {/* We remove the outer shadow box for a more 'infinite canvas' feel, or keep it subtle */}
        <div className="bg-white/50 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/20 shadow-xl">
          <Stage width={stageWidth + PADDING * 2} height={stageHeight + PADDING * 2}>
            <Layer x={PADDING} y={PADDING}>
              
              {/* Room Boundary (Subtle) */}
              <Rect 
                width={stageWidth} 
                height={stageHeight} 
                fill="rgba(255,255,255,0.8)"
                stroke="#E2E8F0" // Slate-200
                strokeWidth={2}
                cornerRadius={24}
              />

              {/* Dot Grid */}
              <Group opacity={0.5}>
                {dots}
              </Group>

              {/* Front Row Label */}
              <Group x={stageWidth / 2} y={40}>
                 <Text
                    text="FRONT ROW (WHITEBOARD)"
                    fontSize={12}
                    fontFamily="Inter"
                    fontStyle="bold"
                    fill="#94A3B8" // Slate-400
                    align="center"
                    offsetX={100} // Approximate half width to center
                    letterSpacing={1.5}
                 />
                 <Rect
                    y={20}
                    width={200}
                    height={4}
                    fill="#E2E8F0"
                    offsetX={100}
                    cornerRadius={2}
                 />
              </Group>

              {/* Furniture */}
              {furniture.map((item) => (
                <FurnitureItem 
                  key={item.id} 
                  item={item} 
                  student={getStudentForFurniture(item.id)}
                  roomWidth={width}
                  roomHeight={height}
                  updateFurniture={updateFurniture}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

interface FurnitureItemProps {
  item: Furniture;
  student?: Student;
  roomWidth: number;
  roomHeight: number;
  updateFurniture: (id: string, updates: Partial<Furniture>) => void;
}

function FurnitureItem({ item, student, roomWidth, roomHeight, updateFurniture }: FurnitureItemProps) {
  const { width, height, color } = FURNITURE_DIMENSIONS[item.type];
  const pixelWidth = width * PIXELS_PER_METER;
  const pixelHeight = height * PIXELS_PER_METER;
  
  // Card Styling Constants
  const isTable = item.type.startsWith('table');
  const isOccupied = !!student;
  
  // Dynamic Styles based on state
  const strokeColor = isOccupied ? '#3B82F6' : (isTable ? '#E2E8F0' : '#94A3B8'); // Blue if occupied, Slate-200 if empty desk
  const strokeWidth = isOccupied ? 2 : 1;
  const dash = (!isOccupied && isTable) ? [6, 4] : undefined;
  const shadowBlur = isOccupied ? 15 : 5;
  const shadowOpacity = isOccupied ? 0.15 : 0.05;

  return (
    <Group
      x={item.x * PIXELS_PER_METER}
      y={item.y * PIXELS_PER_METER}
      draggable
      onDragEnd={(e) => {
        const node = e.target;
        let newX = Math.round((node.x() / PIXELS_PER_METER) * 10) / 10;
        let newY = Math.round((node.y() / PIXELS_PER_METER) * 10) / 10;

        newX = Math.max(0, Math.min(newX, roomWidth - width));
        newY = Math.max(0, Math.min(newY, roomHeight - height));

        updateFurniture(item.id, { x: newX, y: newY });
        node.position({ x: newX * PIXELS_PER_METER, y: newY * PIXELS_PER_METER });
      }}
    >
      {/* Main Card Background */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        fill={color}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        dash={dash}
        cornerRadius={16}
        shadowColor="#0f172a"
        shadowBlur={shadowBlur}
        shadowOpacity={shadowOpacity}
        shadowOffset={{ x: 0, y: 4 }}
      />

      {/* Card Content - Only for Tables/Desks */}
      {isTable && (
        <Group x={16} y={16} width={pixelWidth - 32}>
          {/* Label */}
          <Text 
            text="DESK" 
            fontSize={10} 
            fontFamily="Inter" 
            fontStyle="bold"
            fill="#94A3B8" // Slate-400
          />
          
          {/* Student Name or 'Open Desk' */}
          <Text 
            y={20}
            text={student ? student.name : "Open Desk"} 
            fontSize={student ? 14 : 12}
            fontFamily="Inter"
            fontStyle="bold"
            fill={student ? "#1E293B" : "#CBD5E1"} // Slate-800 or Slate-300
            width={pixelWidth - 32}
            ellipsis={true}
            wrap="none"
          />
          
          {/* Metadata / Icon Placeholder */}
          {student ? (
             <Group y={40}>
                {/* Simulated 'Tag' */}
                <Text
                    text="No preferences"
                    fontSize={10}
                    fontFamily="Inter"
                    fill="#64748B"
                />
             </Group>
          ) : (
            <Group y={35}>
                 {/* Plus Icon Simulation */}
                 <Circle radius={10} fill="#F1F5F9" x={10} y={10} />
                 <Text text="+" x={4} y={3} fontSize={14} fill="#94A3B8" fontStyle="bold" />
            </Group>
          )}

          {/* Status Dot */}
          {student && (
            <Circle
                x={pixelWidth - 32}
                y={pixelHeight - 32}
                radius={4}
                fill="#22C55E" // Green-500
            />
          )}
        </Group>
      )}

      {/* Simple Label for non-tables */}
      {!isTable && (
        <Text 
            text={item.type.replace('-', ' ').toUpperCase()} 
            width={pixelWidth} 
            align="center" 
            y={pixelHeight / 2 - 6} 
            fontSize={10} 
            fontFamily="Inter"
            fontStyle="bold"
            fill="rgba(0,0,0,0.3)" 
        />
      )}
    </Group>
  );
}