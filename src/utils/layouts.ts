import { v4 as uuidv4 } from 'uuid';
import type { Furniture, FurnitureType } from '../types';
import { FURNITURE_DIMENSIONS } from '../constants';

export type LayoutType = 'grid-single' | 'grid-double' | 'u-shape' | 'islands-6';

export const LAYOUT_TEMPLATES: LayoutType[] = ['grid-single', 'grid-double', 'u-shape', 'islands-6'];

export function generateLayout(type: LayoutType, roomWidth: number, roomHeight: number): Furniture[] {
  const furniture: Furniture[] = [];
  const PADDING = 1.0; // Meters from wall
  const usableWidth = Math.max(1, roomWidth - PADDING * 2);
  const usableHeight = Math.max(1, roomHeight - PADDING * 2);
  const startX = PADDING;
  const startY = PADDING;

  // Add Whiteboard
  furniture.push({
    id: uuidv4(),
    type: 'whiteboard',
    x: roomWidth / 2 - FURNITURE_DIMENSIONS['whiteboard'].width / 2,
    y: 0,
    rotation: 0,
    isLocked: true
  });

  const add = (t: FurnitureType, x: number, y: number, r: number = 0) => {
    furniture.push({
      id: uuidv4(),
      type: t,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      rotation: r,
      isLocked: false
    });
  };

  // Helper to place item by visual top-left coordinates, handling rotation adjustments
  const addVisual = (t: FurnitureType, vx: number, vy: number, r: number = 0) => {
    const { width: w, height: h } = FURNITURE_DIMENSIONS[t];
    // Calculate center based on visual target
    // If rot is 0: center = vx + w/2, vy + h/2
    // If rot is 90: visual width is h, visual height is w. center = vx + h/2, vy + w/2
    
    // Actually, let's just use the logic derived:
    // item.x = vx + (visualWidth/2) - (actualWidth/2)
    // item.y = vy + (visualHeight/2) - (actualHeight/2)
    
    let visualW = w;
    let visualH = h;
    
    if (Math.abs(r) === 90 || Math.abs(r) === 270) {
        visualW = h;
        visualH = w;
    }
    
    const ix = vx + visualW / 2 - w / 2;
    const iy = vy + visualH / 2 - h / 2;
    
    add(t, ix, iy, r);
  };

  if (type === 'grid-single') {
    // 24 seats = 6 rows x 4 cols
    const cols = 4;
    const rows = 6;
    const itemW = FURNITURE_DIMENSIONS['table-single'].width;
    const itemH = FURNITURE_DIMENSIONS['table-single'].height;
    
    // Spacing
    const gapX = (usableWidth - (cols * itemW)) / (cols - 1);
    const gapY = (usableHeight - (rows * itemH)) / (rows - 1);
    
    // Safety check if room too small
    const safeGapX = Math.max(0.1, gapX);
    const safeGapY = Math.max(0.1, gapY);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        add('table-single', startX + c * (itemW + safeGapX), startY + r * (itemH + safeGapY));
      }
    }
  } 
  else if (type === 'grid-double') {
    // 24 seats = 12 tables. 3 cols x 4 rows
    const cols = 3;
    const rows = 4;
    const itemW = FURNITURE_DIMENSIONS['table-double'].width;
    const itemH = FURNITURE_DIMENSIONS['table-double'].height;
    
    const gapX = (usableWidth - (cols * itemW)) / (cols - 1);
    const gapY = (usableHeight - (rows * itemH)) / (rows - 1);
    
    const safeGapX = Math.max(0.1, gapX);
    const safeGapY = Math.max(0.1, gapY);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        add('table-double', startX + c * (itemW + safeGapX), startY + r * (itemH + safeGapY));
      }
    }
  }
  else if (type === 'islands-6') {
    // Cluster of 6 single tables (6 seats)
    // Left: 2 vertical (facing right)
    // Right: 2 vertical (facing left)
    // Bottom: 2 horizontal (facing up)
    
    const groupVisualW = 2.0;
    const groupVisualH = 2.8;
    
    const cols = Math.floor(usableWidth / (groupVisualW + 0.5));
    const rows = Math.floor(usableHeight / (groupVisualH + 0.5));
    
    // Center the grid
    const totalGridW = cols * groupVisualW + (cols - 1) * 0.5;
    const totalGridH = rows * groupVisualH + (rows - 1) * 0.5;
    
    const gridStartX = Math.max(PADDING, (roomWidth - totalGridW) / 2);
    const gridStartY = Math.max(PADDING, (roomHeight - totalGridH) / 2);
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const gx = gridStartX + c * (groupVisualW + 0.5);
            const gy = gridStartY + r * (groupVisualH + 0.5);
            
            // Left Column (Rot 90)
            addVisual('table-single', gx, gy, 90);
            addVisual('table-single', gx, gy + 1.0, 90);
            
            // Right Column (Rot -90) - placed at x = 1.2
            // Width of vertical table is 0.8. 
            // Total width 2.0. Right col visual starts at 2.0 - 0.8 = 1.2?
            // T5/T6 are 1.0 wide each. Total 2.0.
            // Right col aligned to right edge.
            addVisual('table-single', gx + 1.2, gy, -90);
            addVisual('table-single', gx + 1.2, gy + 1.0, -90);
            
            // Bottom Row (Rot 0)
            addVisual('table-single', gx, gy + 2.0, 0);
            addVisual('table-single', gx + 1.0, gy + 2.0, 0);
        }
    }
  }
  else if (type === 'u-shape') {
    // U-Shape:
    // Left Col: Vertical, facing Right (Rot 90)
    // Right Col: Vertical, facing Left (Rot -90)
    // Bottom Row: Horizontal, facing Top (Rot 0)

    const tableDim = FURNITURE_DIMENSIONS['table-double'];
    const w = tableDim.width; // 1.8
    const h = tableDim.height; // 0.8

    // Visual dimensions for vertical tables
    const vW = h; // 0.8
    const vH = w; // 1.8
    
    // Bottom Y position (visual top)
    const bottomY = roomHeight - PADDING - h;
    
    // Top Start Y (leave space for whiteboard)
    const topY = PADDING + 1.5; 
    
    // Calculate Side Counts
    const sideAvailableH = bottomY - topY;
    const sideCount = Math.max(1, Math.floor(sideAvailableH / (vH + 0.1)));
    
    // Spacing optimization
    const sideGapY = sideCount > 1 ? (sideAvailableH - sideCount * vH) / (sideCount - 1) : 0.1;
    // Cap gap
    const finalSideGapY = Math.min(sideGapY, 0.5);
    // Re-center vertically if extra space
    const actualSideH = sideCount * vH + (sideCount - 1) * finalSideGapY;
    const sideStartActualY = topY + (sideAvailableH - actualSideH) / 2;

    // Place Left Side (Rot 90)
    for (let i = 0; i < sideCount; i++) {
        const y = sideStartActualY + i * (vH + finalSideGapY);
        addVisual('table-double', PADDING, y, 90);
    }
    
    // Place Right Side (Rot -90)
    for (let i = 0; i < sideCount; i++) {
        const y = sideStartActualY + i * (vH + finalSideGapY);
        addVisual('table-double', roomWidth - PADDING - vW, y, -90);
    }
    
    // Place Bottom Row
    const bottomAvailableW = (roomWidth - PADDING - vW) - (PADDING + vW); // Width between columns
    // Start X for bottom row
    const bottomStartX = PADDING + vW;
    
    const bottomCount = Math.max(1, Math.floor(bottomAvailableW / (w + 0.1)));
    
    const bottomGapX = bottomCount > 1 ? (bottomAvailableW - bottomCount * w) / (bottomCount - 1) : 0.1;
    const finalBottomGapX = Math.min(bottomGapX, 0.5);
    
    const actualBottomW = bottomCount * w + (bottomCount - 1) * finalBottomGapX;
    const bottomStartActualX = bottomStartX + (bottomAvailableW - actualBottomW) / 2;
    
    for (let i = 0; i < bottomCount; i++) {
        const x = bottomStartActualX + i * (w + finalBottomGapX);
        addVisual('table-double', x, bottomY, 0);
    }
  }

  return furniture;
}
