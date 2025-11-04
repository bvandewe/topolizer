/**
 * Multi-shape alignment and distribution tools
 */

import { saveAppState } from '../services/storage.js';
import { updateShapeConnections } from '../connections/connectionManager.js';

/**
 * Get the bounding box for a shape
 * @param {SVGElement} shape - The shape element
 * @returns {Object} Bounding box with x, y, width, height, centerX, centerY
 */
function getShapeBounds(shape) {
    const bbox = shape.getBBox();
    let x = bbox.x;
    let y = bbox.y;

    // Handle transform for groups (Cisco shapes)
    const transform = shape.getAttribute('transform');
    if (transform) {
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
            x += parseFloat(match[1]);
            y += parseFloat(match[2]);
        }
    }

    // For basic shapes, get position from attributes
    if (shape.tagName === 'circle' || shape.tagName === 'ellipse') {
        x = parseFloat(shape.getAttribute('cx')) - bbox.width / 2;
        y = parseFloat(shape.getAttribute('cy')) - bbox.height / 2;
    } else if (shape.tagName === 'rect') {
        x = parseFloat(shape.getAttribute('x'));
        y = parseFloat(shape.getAttribute('y'));
    }

    return {
        x,
        y,
        width: bbox.width,
        height: bbox.height,
        centerX: x + bbox.width / 2,
        centerY: y + bbox.height / 2,
        right: x + bbox.width,
        bottom: y + bbox.height,
    };
}

/**
 * Move a shape to a specific position
 * @param {SVGElement} shape - The shape to move
 * @param {number} x - New x position
 * @param {number} y - New y position
 */
function moveShapeToPosition(shape, x, y) {
    const bounds = getShapeBounds(shape);
    const currentCenterX = bounds.centerX;
    const currentCenterY = bounds.centerY;

    if (shape.tagName === 'g') {
        // For groups, update transform
        shape.setAttribute('transform', `translate(${x}, ${y})`);
    } else if (shape.tagName === 'circle' || shape.tagName === 'ellipse') {
        // For circles/ellipses, update cx/cy
        const newCx = x + bounds.width / 2;
        const newCy = y + bounds.height / 2;
        shape.setAttribute('cx', newCx);
        shape.setAttribute('cy', newCy);
    } else if (shape.tagName === 'rect') {
        // For rectangles, update x/y
        shape.setAttribute('x', x);
        shape.setAttribute('y', y);
    }

    // Update sibling label position if exists
    updateSiblingLabel(shape);

    // Update connections
    updateShapeConnections(shape);
}

/**
 * Update sibling label position for basic shapes
 * @param {SVGElement} shape - The shape element
 */
function updateSiblingLabel(shape) {
    if (shape.tagName !== 'circle' && shape.tagName !== 'rect' && shape.tagName !== 'ellipse') {
        return;
    }

    const shapeId = shape.getAttribute('id');
    const labelEl = shape.parentNode?.querySelector(`text[data-shape-id="${shapeId}"]`);

    if (!labelEl) return;

    const position = labelEl.getAttribute('data-position') || 'below';
    const offset = 20;
    const bounds = getShapeBounds(shape);

    const isCircular = shape.tagName === 'circle' || shape.tagName === 'ellipse';
    let labelX, labelY;

    switch (position) {
        case 'above':
            labelX = isCircular ? bounds.centerX : bounds.x + bounds.width / 2;
            labelY = isCircular ? bounds.y - offset : bounds.y - offset;
            break;
        case 'below':
            labelX = isCircular ? bounds.centerX : bounds.x + bounds.width / 2;
            labelY = isCircular ? bounds.bottom + offset : bounds.bottom + offset;
            break;
        case 'left':
            labelX = isCircular ? bounds.x - offset : bounds.x - offset;
            labelY = isCircular ? bounds.centerY : bounds.y + bounds.height / 2;
            break;
        case 'right':
            labelX = isCircular ? bounds.right + offset : bounds.right + offset;
            labelY = isCircular ? bounds.centerY : bounds.y + bounds.height / 2;
            break;
        case 'center':
            labelX = isCircular ? bounds.centerX : bounds.x + bounds.width / 2;
            labelY = isCircular ? bounds.centerY + 5 : bounds.y + bounds.height / 2 + 5;
            break;
        default:
            labelX = isCircular ? bounds.centerX : bounds.x + bounds.width / 2;
            labelY = isCircular ? bounds.bottom + offset : bounds.bottom + offset;
    }

    labelEl.setAttribute('x', labelX);
    labelEl.setAttribute('y', labelY);
}

/**
 * Align shapes horizontally (left, center, right)
 * @param {Array<string>} shapeIds - Array of shape IDs
 * @param {string} alignment - 'left', 'center', or 'right'
 */
export function alignHorizontal(shapeIds, alignment) {
    if (shapeIds.length < 2) return;

    const shapes = shapeIds.map(id => document.getElementById(id)).filter(Boolean);
    if (shapes.length < 2) return;

    const bounds = shapes.map(getShapeBounds);

    // Calculate reference position
    let referenceX;
    if (alignment === 'left') {
        referenceX = Math.min(...bounds.map(b => b.x));
    } else if (alignment === 'right') {
        referenceX = Math.max(...bounds.map(b => b.right));
    } else {
        // center
        const minX = Math.min(...bounds.map(b => b.x));
        const maxRight = Math.max(...bounds.map(b => b.right));
        referenceX = (minX + maxRight) / 2;
    }

    // Align each shape
    shapes.forEach((shape, index) => {
        const bound = bounds[index];
        let newX;

        if (alignment === 'left') {
            newX = referenceX;
        } else if (alignment === 'right') {
            newX = referenceX - bound.width;
        } else {
            // center
            newX = referenceX - bound.width / 2;
        }

        moveShapeToPosition(shape, newX, bound.y);
    });

    saveAppState();
}

/**
 * Align shapes vertically (top, middle, bottom)
 * @param {Array<string>} shapeIds - Array of shape IDs
 * @param {string} alignment - 'top', 'middle', or 'bottom'
 */
export function alignVertical(shapeIds, alignment) {
    if (shapeIds.length < 2) return;

    const shapes = shapeIds.map(id => document.getElementById(id)).filter(Boolean);
    if (shapes.length < 2) return;

    const bounds = shapes.map(getShapeBounds);

    // Calculate reference position
    let referenceY;
    if (alignment === 'top') {
        referenceY = Math.min(...bounds.map(b => b.y));
    } else if (alignment === 'bottom') {
        referenceY = Math.max(...bounds.map(b => b.bottom));
    } else {
        // middle
        const minY = Math.min(...bounds.map(b => b.y));
        const maxBottom = Math.max(...bounds.map(b => b.bottom));
        referenceY = (minY + maxBottom) / 2;
    }

    // Align each shape
    shapes.forEach((shape, index) => {
        const bound = bounds[index];
        let newY;

        if (alignment === 'top') {
            newY = referenceY;
        } else if (alignment === 'bottom') {
            newY = referenceY - bound.height;
        } else {
            // middle
            newY = referenceY - bound.height / 2;
        }

        moveShapeToPosition(shape, bound.x, newY);
    });

    saveAppState();
}

/**
 * Distribute shapes horizontally with equal spacing
 * @param {Array<string>} shapeIds - Array of shape IDs
 */
export function distributeHorizontal(shapeIds) {
    if (shapeIds.length < 3) return;

    const shapes = shapeIds.map(id => document.getElementById(id)).filter(Boolean);
    if (shapes.length < 3) return;

    const bounds = shapes.map((shape, index) => ({
        shape,
        ...getShapeBounds(shape),
    }));

    // Sort by current X position
    bounds.sort((a, b) => a.x - b.x);

    // Calculate total span and spacing
    const leftmostX = bounds[0].x;
    const rightmostX = bounds[bounds.length - 1].right;
    const totalWidth = bounds.reduce((sum, b) => sum + b.width, 0);
    const totalGap = rightmostX - leftmostX - totalWidth;
    const spacing = totalGap / (bounds.length - 1);

    // Distribute shapes
    let currentX = leftmostX;
    bounds.forEach(bound => {
        moveShapeToPosition(bound.shape, currentX, bound.y);
        currentX += bound.width + spacing;
    });

    saveAppState();
}

/**
 * Distribute shapes vertically with equal spacing
 * @param {Array<string>} shapeIds - Array of shape IDs
 */
export function distributeVertical(shapeIds) {
    if (shapeIds.length < 3) return;

    const shapes = shapeIds.map(id => document.getElementById(id)).filter(Boolean);
    if (shapes.length < 3) return;

    const bounds = shapes.map((shape, index) => ({
        shape,
        ...getShapeBounds(shape),
    }));

    // Sort by current Y position
    bounds.sort((a, b) => a.y - b.y);

    // Calculate total span and spacing
    const topmostY = bounds[0].y;
    const bottommostY = bounds[bounds.length - 1].bottom;
    const totalHeight = bounds.reduce((sum, b) => sum + b.height, 0);
    const totalGap = bottommostY - topmostY - totalHeight;
    const spacing = totalGap / (bounds.length - 1);

    // Distribute shapes
    let currentY = topmostY;
    bounds.forEach(bound => {
        moveShapeToPosition(bound.shape, bound.x, currentY);
        currentY += bound.height + spacing;
    });

    saveAppState();
}
