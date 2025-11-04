# Multi-Shape Alignment and Distribution Tools

## Overview

Added alignment and distribution tools that appear when multiple shapes are selected in Selection Mode.

## Features

### Alignment Tools

When 2 or more shapes are selected:

#### Horizontal Alignment

- **Align Left** - Aligns all selected shapes to the leftmost edge
- **Align Center (H)** - Centers all shapes horizontally within the selection bounds
- **Align Right** - Aligns all selected shapes to the rightmost edge

#### Vertical Alignment

- **Align Top** - Aligns all selected shapes to the topmost edge
- **Align Middle (V)** - Centers all shapes vertically within the selection bounds
- **Align Bottom** - Aligns all selected shapes to the bottommost edge

### Distribution Tools

When 3 or more shapes are selected:

- **Distribute Horizontally** - Evenly spaces shapes horizontally between the leftmost and rightmost shapes
- **Distribute Vertically** - Evenly spaces shapes vertically between the topmost and bottommost shapes

## Usage

1. Enable **Selection Mode** by clicking the selection mode button in the toolbar
2. Select multiple shapes by:
   - Dragging a rectangle around the shapes, OR
   - Clicking on individual shapes
3. The alignment toolbar will appear at the bottom center of the screen
4. Click any alignment or distribution button to apply the transformation
5. Changes are automatically saved to local storage

## Technical Implementation

### Files Created

1. **frontend/src/scripts/shapes/multiShapeAlignment.js**
   - Core alignment and distribution logic
   - Handles different shape types (groups, circles, ellipses, rectangles)
   - Functions: `alignHorizontal()`, `alignVertical()`, `distributeHorizontal()`, `distributeVertical()`

2. **frontend/src/scripts/ui/alignmentToolbar.js**
   - Toolbar UI management
   - Shows/hides based on selection count
   - Event handlers for alignment buttons

3. **frontend/src/styles/_alignment.scss**
   - Floating toolbar styling
   - Animation effects
   - Responsive button groups

### Files Modified

1. **frontend/src/scripts/canvas/selectionMode.js**
   - Added toolbar visibility updates on selection changes
   - Integrated `updateAlignmentToolbarVisibility()` calls

2. **frontend/src/scripts/app.js**
   - Added `initAlignmentToolbar()` to initialization
   - Stored `selectionManager` reference in `appState`

3. **frontend/src/scripts/state/appState.js**
   - Added `selectionManager` property to store SelectionMode instance

4. **frontend/src/styles/main.scss**
   - Imported alignment styles

## Key Functions

### `getShapeBounds(shape)`

Returns normalized bounding box for any shape type:

- Handles `transform` attributes for groups
- Handles `cx/cy` for circles/ellipses
- Handles `x/y` for rectangles
- Returns: `{x, y, width, height, centerX, centerY, right, bottom}`

### `moveShapeToPosition(shape, x, y)`

Moves a shape to absolute position:

- Updates appropriate attributes based on shape type
- Updates sibling labels
- Updates connections
- Saves state

### Alignment Functions

- Calculate reference position (min, max, or center)
- Move each shape to align with reference
- Automatically save state

### Distribution Functions

- Sort shapes by position
- Calculate equal spacing
- Reposition shapes with even gaps
- Automatically save state

## UI Design

The alignment toolbar:

- Appears as a floating bar at bottom center
- Only visible when 2+ shapes are selected
- Organized into 3 button groups:
  - Horizontal alignment (3 buttons)
  - Vertical alignment (3 buttons)
  - Distribution (2 buttons)
- Uses Bootstrap icons
- Smooth slide-up animation
- Tooltips on all buttons

## Bootstrap Icons Used

- `bi-align-start` - Align left/top
- `bi-align-center` - Center horizontally
- `bi-align-end` - Align right/bottom
- `bi-align-top` - Align top
- `bi-align-middle` - Center vertically
- `bi-align-bottom` - Align bottom
- `bi-distribute-horizontal` - Distribute horizontally
- `bi-distribute-vertical` - Distribute vertically

## Smart Features

1. **Mixed Shape Support** - Works with any combination of:
   - Cisco icon groups (transform-based positioning)
   - Basic circles/ellipses (cx/cy-based positioning)
   - Basic rectangles (x/y-based positioning)

2. **Label Preservation** - Sibling labels automatically update position when shapes are aligned

3. **Connection Updates** - All connections automatically update endpoints after alignment

4. **Automatic Saving** - State persists to local storage after every alignment operation

5. **Graceful Degradation** - Distribution requires 3+ shapes, alignment requires 2+

## Testing

To test the feature:

1. Start the application
2. Add multiple shapes to the canvas (mix of Cisco and basic shapes)
3. Enable Selection Mode
4. Select 2+ shapes
5. Verify toolbar appears
6. Test each alignment button
7. Select 3+ shapes
8. Test distribution buttons
9. Verify labels and connections update correctly
10. Refresh page to verify persistence

## Future Enhancements

Potential improvements:

- Align to canvas center
- Align to specific shape (make one shape the anchor)
- Match size (make all shapes same width/height)
- Distribute with specific spacing value
- Keyboard shortcuts for common alignments
- Undo/redo support
- Visual preview before applying alignment
