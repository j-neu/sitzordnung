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

    // Always 4 islands (2x2) x 6 seats = 24 seats, regardless of room size.
    const cols = 2;
    const rows = 2;

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

    // Fixed counts so the U always totals 12 double-tables = 24 seats
    // (4 per side + 4 along the bottom), regardless of room size.
    const sideCount = 4;
    const bottomCount = 4;

    // 4 stacked double-tables (7.2m) plus the bottom row (0.8m) is already
    // 8m tall before any gaps - close to (or, in the default 8x10 room,
    // exactly) the full usable height. So the gap between tables is
    // *derived* from whatever vertical room is actually left over (split
    // across the top clearance + the gaps between the 4 side tables + the
    // gap before the bottom row), clamped to a sensible max, rather than a
    // fixed constant. That keeps the whole U within the room's walls (with
    // the usual PADDING margin) for any room tall enough to fit it at all,
    // shrinking toward touching-but-never-overlapping tables only when the
    // room is too short to give a full margin - never past the far wall.
    const MAX_GAP = 0.15;
    const bottomRowH = h;
    const gapSlots = sideCount + 1; // top clearance + (sideCount-1) side gaps + 1 gap before the bottom row
    const contentMinHeight = sideCount * vH + bottomRowH;
    const availableHeight = Math.max(contentMinHeight, roomHeight - 2 * PADDING);
    const slack = availableHeight - contentMinHeight;
    const GAP = Math.max(0, Math.min(MAX_GAP, slack / gapSlots));

    // Top Start Y (leave space for whiteboard)
    const topY = PADDING + GAP;
    const actualSideH = sideCount * vH + (sideCount - 1) * GAP;

    // Place Left Side (Rot 90)
    const leftColX = PADDING;
    for (let i = 0; i < sideCount; i++) {
        const y = topY + i * (vH + GAP);
        addVisual('table-double', leftColX, y, 90);
    }

    // Place Right Side (Rot -90). Derived from the left column's actual
    // right edge (+ a gap) rather than independently from room width, so in
    // an extremely narrow room the two columns push apart instead of
    // crossing over each other.
    const rightColX = Math.max(roomWidth - PADDING - vW, leftColX + vW + GAP);
    for (let i = 0; i < sideCount; i++) {
        const y = topY + i * (vH + GAP);
        addVisual('table-double', rightColX, y, -90);
    }

    // Bottom Row - starts strictly after the side columns end (+ one more
    // gap), so it can never overlap them vertically no matter how tall the
    // side columns ended up being for a given room. Its Y range therefore
    // never overlaps the side columns' Y range, so - unlike the old version,
    // which squeezed it into the (often too-narrow) gap between the two
    // columns and could push it past the room's side walls - it's free to
    // use its own horizontal budget centered on the room, the same
    // fits-first/shrinks-if-it-must approach used for the vertical GAP above.
    const bottomY = topY + actualSideH + GAP;
    const bottomContentMinW = bottomCount * w;
    const bottomAvailableW = Math.max(bottomContentMinW, roomWidth - 2 * PADDING);
    const bottomSlack = bottomAvailableW - bottomContentMinW;
    const bottomGap = bottomCount > 1 ? Math.max(0, Math.min(MAX_GAP, bottomSlack / (bottomCount - 1))) : 0;
    const actualBottomW = bottomContentMinW + (bottomCount - 1) * bottomGap;
    const bottomStartActualX = (roomWidth - actualBottomW) / 2;

    for (let i = 0; i < bottomCount; i++) {
        const x = bottomStartActualX + i * (w + bottomGap);
        addVisual('table-double', x, bottomY, 0);
    }
  }

  // All templates above are built assuming the whiteboard sits at the top
  // (y=0) with the "front" row nearest it. Mirroring the whole arrangement
  // vertically moves the whiteboard to the bottom wall while keeping every
  // row's distance-from-the-board unchanged, so seating still faces the
  // board without each template needing its own bottom-up variant.
  return mirrorVertically(furniture, roomHeight);
}

function mirrorVertically(items: Furniture[], roomHeight: number): Furniture[] {
  // item.x/y always anchor the *unrotated* bounding box's top-left (rotation
  // happens in place around that box's own center - see addVisual above and
  // FurnitureItem's Group offsetX/offsetY in RoomCanvas.tsx), so mirroring
  // only needs the unrotated height here, regardless of the item's rotation.
  return items.map((item) => {
    const { height } = FURNITURE_DIMENSIONS[item.type];
    return {
      ...item,
      y: Math.round((roomHeight - item.y - height) * 100) / 100
    };
  });
}
