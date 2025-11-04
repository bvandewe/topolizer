/**
 * Shape Actions - Duplicate, Z-index, Styling
 */

import { appState } from '../state/appState.js';
import { saveAppState } from '../services/storage.js';
import { addShapeEventListeners } from './shapeEvents.js';

export function duplicateShape(shapeId) {
    const originalShape = document.getElementById(shapeId);
    if (!originalShape) return;

    // Clone the shape element
    const clonedShape = originalShape.cloneNode(true);

    // Generate new ID
    const newShapeId = appState.getNextShapeId();
    clonedShape.setAttribute('id', newShapeId);

    // Offset the position by 50 pixels
    const offset = 50;
    const shapeType = originalShape.getAttribute('data-shape-type');

    if (originalShape.tagName === 'g') {
        // Handle groups (Cisco shapes, arrows, lines, text)
        const transform = originalShape.getAttribute('transform');
        if (transform) {
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (match) {
                const x = parseFloat(match[1]) + offset;
                const y = parseFloat(match[2]) + offset;
                clonedShape.setAttribute('transform', `translate(${x}, ${y})`);
            }
        }
    } else if (originalShape.tagName === 'circle' || originalShape.tagName === 'ellipse') {
        const cx = parseFloat(originalShape.getAttribute('cx')) + offset;
        const cy = parseFloat(originalShape.getAttribute('cy')) + offset;
        clonedShape.setAttribute('cx', cx);
        clonedShape.setAttribute('cy', cy);
    } else if (originalShape.tagName === 'rect') {
        const x = parseFloat(originalShape.getAttribute('x')) + offset;
        const y = parseFloat(originalShape.getAttribute('y')) + offset;
        clonedShape.setAttribute('x', x);
        clonedShape.setAttribute('y', y);
    } else if (originalShape.tagName === 'line') {
        const x1 = parseFloat(originalShape.getAttribute('x1')) + offset;
        const y1 = parseFloat(originalShape.getAttribute('y1')) + offset;
        const x2 = parseFloat(originalShape.getAttribute('x2')) + offset;
        const y2 = parseFloat(originalShape.getAttribute('y2')) + offset;
        clonedShape.setAttribute('x1', x1);
        clonedShape.setAttribute('y1', y1);
        clonedShape.setAttribute('x2', x2);
        clonedShape.setAttribute('y2', y2);
    }

    // Update label if present (append " (copy)")
    const labelElement = clonedShape.querySelector('[data-label="true"]');
    if (labelElement && labelElement.textContent) {
        labelElement.textContent = `${labelElement.textContent} (copy)`;
    }

    // Add event listeners to the cloned shape
    addShapeEventListeners(clonedShape);

    // Add the duplicated shape to the shapes layer
    const shapesLayer = document.getElementById('shapesLayer');
    if (shapesLayer) {
        shapesLayer.appendChild(clonedShape);
    } else {
        // Fallback: add to canvas directly
        const canvas = document.getElementById('topologyCanvas');
        if (canvas) {
            canvas.appendChild(clonedShape);
        }
    }

    // Save state
    saveAppState();

    return clonedShape;
}

export function moveShapeToFront(shapeId) {
    const shapeGroup = document.getElementById(shapeId);
    if (!shapeGroup) return;

    const shapesLayer = document.getElementById('shapesLayer');
    const targetParent = shapesLayer || document.getElementById('topologyCanvas');

    targetParent.appendChild(shapeGroup);

    saveAppState();
    console.log(`Moved shape ${shapeId} to front`);
}

export function moveShapeToBack(shapeId) {
    const shapeGroup = document.getElementById(shapeId);
    if (!shapeGroup) return;

    // Move to backgroundShapesLayer (which is below connections)
    const backgroundShapesLayer = document.getElementById('backgroundShapesLayer');
    const targetParent = backgroundShapesLayer || document.getElementById('topologyCanvas');

    console.log('moveShapeToBack:', {
        shapeId,
        hasBackgroundLayer: !!backgroundShapesLayer,
        currentParent: shapeGroup.parentElement?.id,
        targetParent: targetParent.id,
    });

    // Move the shape to the background layer
    targetParent.appendChild(shapeGroup);

    saveAppState();
    console.log(`Moved shape ${shapeId} to background layer (behind connections)`);
}

export function applyShapeFill(shapeId, fillColor) {
    const shape = document.getElementById(shapeId);
    if (!shape) return;

    // Check if this is a text shape
    const dataType = shape.getAttribute('data-shape-type');
    if (dataType === 'text') {
        // For text shapes, apply fill to the background rectangle
        const bgRect = shape.querySelector('.text-background');
        if (bgRect) {
            bgRect.setAttribute('fill', fillColor);
        }
        saveAppState();
        return;
    }

    // For basic shapes (circle, rect, ellipse) that are direct elements
    if (shape.tagName === 'circle' || shape.tagName === 'rect' || shape.tagName === 'ellipse') {
        shape.setAttribute('fill', fillColor);
        saveAppState();
        return;
    }

    // For groups (Cisco shapes, arrows, lines), find the visual elements inside
    if (shape.tagName === 'g') {
        // First try to find basic shapes inside the group
        const shapeElement = shape.querySelector('circle, rect, ellipse, path');
        if (shapeElement && shapeElement.tagName !== 'path') {
            // Basic shapes support fill
            shapeElement.setAttribute('fill', fillColor);
        } else if (shapeElement && shapeElement.tagName === 'path') {
            // SVG paths (Cisco shapes) - apply to all paths in the group
            const paths = shape.querySelectorAll('path');
            paths.forEach(path => {
                // Only change fill if it's not 'none'
                const currentFill = path.getAttribute('fill');
                if (currentFill && currentFill !== 'none') {
                    path.setAttribute('fill', fillColor);
                }
            });
        }
    }

    saveAppState();
}

export function applyShapeStroke(shapeId, strokeColor, strokeWidth = 2) {
    const shape = document.getElementById(shapeId);
    if (!shape) return;

    // Convert to number to handle string values from select
    const width = Number(strokeWidth);

    // Check if this is a text shape
    const dataType = shape.getAttribute('data-shape-type');
    if (dataType === 'text') {
        // For text shapes, apply stroke to the background rectangle
        const bgRect = shape.querySelector('.text-background');
        if (bgRect) {
            if (width === 0) {
                bgRect.setAttribute('stroke', 'none');
                bgRect.setAttribute('stroke-width', '0');
            } else {
                bgRect.setAttribute('stroke', strokeColor);
                bgRect.setAttribute('stroke-width', width);
            }
        }
        saveAppState();
        return;
    }

    // For basic shapes (circle, rect, ellipse) that are direct elements
    if (shape.tagName === 'circle' || shape.tagName === 'rect' || shape.tagName === 'ellipse') {
        if (width === 0) {
            shape.setAttribute('stroke', 'none');
            shape.setAttribute('stroke-width', '0');
        } else {
            shape.setAttribute('stroke', strokeColor);
            shape.setAttribute('stroke-width', width);
        }
        saveAppState();
        return;
    }

    // For groups (Cisco shapes, arrows, lines), find the visual elements inside
    if (shape.tagName === 'g') {
        // First try to find basic shapes inside the group
        const shapeElement = shape.querySelector('circle, rect, ellipse, path');
        if (shapeElement && shapeElement.tagName !== 'path') {
            // Basic shapes
            if (width === 0) {
                shapeElement.setAttribute('stroke', 'none');
                shapeElement.setAttribute('stroke-width', '0');
            } else {
                shapeElement.setAttribute('stroke', strokeColor);
                shapeElement.setAttribute('stroke-width', width);
            }
        } else if (shapeElement && shapeElement.tagName === 'path') {
            // SVG paths - apply to all paths
            const paths = shape.querySelectorAll('path');
            paths.forEach(path => {
                const currentStroke = path.getAttribute('stroke');
                if (currentStroke && currentStroke !== 'none') {
                    if (width === 0) {
                        path.setAttribute('stroke', 'none');
                        path.setAttribute('stroke-width', '0');
                    } else {
                        path.setAttribute('stroke', strokeColor);
                        path.setAttribute('stroke-width', width);
                    }
                }
            });
        }
    }

    saveAppState();
}

export function getShapeStyles(shapeId) {
    const shape = document.getElementById(shapeId);
    if (!shape) return null;

    // Check if this is a text shape
    const isTextShape = shape.getAttribute('data-shape-type') === 'text';

    let shapeElement;

    // For text shapes, read from .text-background
    if (isTextShape) {
        shapeElement = shape.querySelector('.text-background');
    }
    // For basic shapes (circle, rect, ellipse), the shape itself IS the element
    else if (
        shape.tagName === 'circle' ||
        shape.tagName === 'rect' ||
        shape.tagName === 'ellipse'
    ) {
        shapeElement = shape;
    }
    // For groups (Cisco shapes, arrows, lines), find the visual element inside
    else if (shape.tagName === 'g') {
        shapeElement = shape.querySelector('circle, rect, ellipse, path');
    }

    if (!shapeElement) return null;

    // Get styles from DOM attributes
    const fill = shapeElement.getAttribute('fill') || '#ffffff';
    const domStroke = shapeElement.getAttribute('stroke') || '#000000';
    const domStrokeWidth = shapeElement.getAttribute('stroke-width') || '2';

    // If stroke is 'none' or width is '0', treat as no border
    const finalStroke = domStroke === 'none' ? '#000000' : domStroke;
    const finalStrokeWidth = domStroke === 'none' || domStrokeWidth === '0' ? '0' : domStrokeWidth;

    return {
        fill: fill,
        stroke: finalStroke,
        strokeWidth: finalStrokeWidth,
    };
}
