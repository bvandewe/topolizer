/**
 * Shape resizing functionality
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { MIN_SHAPE_SIZE } from '../config/constants.js';
import { updateResizeHandles } from './shapeSelection.js';
import { updateShapeConnections } from '../connections/connectionManager.js';
import { updateInteractionCirclePosition } from '../ui/shapeInteractionCircle.js';

/**
 * Start resizing a shape
 * @param {SVGElement} shape - The shape to resize
 * @param {string} handleType - The type of resize handle
 * @param {MouseEvent} e - The mouse event
 */
export function startResize(shape, handleType, e) {
    appState.isResizing = true;
    appState.resizeHandle = handleType;
    appState.selectShape(shape);

    // Prevent text selection during resize
    document.body.classList.add('no-select');

    const canvasRect = elements.topologyCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / appState.currentZoom;
    const mouseY = (e.clientY - canvasRect.top) / appState.currentZoom;

    // Store initial mouse position
    appState.dragOffsetX = mouseX;
    appState.dragOffsetY = mouseY;

    // Set global cursor during resize
    const cursorMap = {
        nw: 'nw-resize',
        ne: 'ne-resize',
        se: 'se-resize',
        sw: 'sw-resize',
        n: 'n-resize',
        e: 'e-resize',
        s: 's-resize',
        w: 'w-resize',
    };
    document.body.style.cursor = cursorMap[handleType] || 'default';
}

/**
 * Handle shape resize during mouse move
 * @param {SVGElement} shape - The shape being resized
 * @param {string} handleType - The type of resize handle
 * @param {number} mouseX - Current mouse X position
 * @param {number} mouseY - Current mouse Y position
 */
export function handleResize(shape, handleType, mouseX, mouseY) {
    const shapeType = shape.tagName;
    const deltaX = mouseX - appState.dragOffsetX;
    const deltaY = mouseY - appState.dragOffsetY;

    if (shapeType === 'circle') {
        handleCircleResize(shape, deltaX, deltaY);
    } else if (shapeType === 'ellipse') {
        handleEllipseResize(shape, handleType, deltaX, deltaY);
    } else if (shapeType === 'rect') {
        handleRectResize(shape, handleType, deltaX, deltaY);
    } else if (shapeType === 'g') {
        handleGroupResize(shape, handleType, deltaX, deltaY);
    }

    // Update drag offset for continuous resizing
    appState.dragOffsetX = mouseX;
    appState.dragOffsetY = mouseY;

    // Update resize handles
    updateResizeHandles(shape);

    // Update connections
    updateShapeConnections(shape);

    // Note: Circle update moved to mouseup for better performance
}

/**
 * Handle circle resize
 */
function handleCircleResize(shape, deltaX, deltaY) {
    const r = parseFloat(shape.getAttribute('r'));
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    const newR = Math.max(MIN_SHAPE_SIZE.CIRCLE_RADIUS, r + delta);
    shape.setAttribute('r', newR);
}

/**
 * Handle ellipse resize
 */
function handleEllipseResize(shape, handleType, deltaX, deltaY) {
    const rx = parseFloat(shape.getAttribute('rx'));
    const ry = parseFloat(shape.getAttribute('ry'));

    let newRx = rx;
    let newRy = ry;

    // Handle horizontal resize with proper direction
    if (['e', 'ne', 'se'].includes(handleType)) {
        newRx = Math.max(MIN_SHAPE_SIZE.ELLIPSE_RADIUS, rx + deltaX);
    } else if (['w', 'nw', 'sw'].includes(handleType)) {
        newRx = Math.max(MIN_SHAPE_SIZE.ELLIPSE_RADIUS, rx - deltaX);
    }

    // Handle vertical resize with proper direction
    if (['s', 'se', 'sw'].includes(handleType)) {
        newRy = Math.max(MIN_SHAPE_SIZE.ELLIPSE_RADIUS, ry + deltaY);
    } else if (['n', 'ne', 'nw'].includes(handleType)) {
        newRy = Math.max(MIN_SHAPE_SIZE.ELLIPSE_RADIUS, ry - deltaY);
    }

    shape.setAttribute('rx', newRx);
    shape.setAttribute('ry', newRy);
}

/**
 * Handle rectangle resize
 */
function handleRectResize(shape, handleType, deltaX, deltaY) {
    const x = parseFloat(shape.getAttribute('x'));
    const y = parseFloat(shape.getAttribute('y'));
    const width = parseFloat(shape.getAttribute('width'));
    const height = parseFloat(shape.getAttribute('height'));

    let newX = x;
    let newY = y;
    let newWidth = width;
    let newHeight = height;

    switch (handleType) {
        case 'nw':
            newX = x + deltaX;
            newY = y + deltaY;
            newWidth = width - deltaX;
            newHeight = height - deltaY;
            break;
        case 'ne':
            newY = y + deltaY;
            newWidth = width + deltaX;
            newHeight = height - deltaY;
            break;
        case 'se':
            newWidth = width + deltaX;
            newHeight = height + deltaY;
            break;
        case 'sw':
            newX = x + deltaX;
            newWidth = width - deltaX;
            newHeight = height + deltaY;
            break;
        case 'n':
            newY = y + deltaY;
            newHeight = height - deltaY;
            break;
        case 'e':
            newWidth = width + deltaX;
            break;
        case 's':
            newHeight = height + deltaY;
            break;
        case 'w':
            newX = x + deltaX;
            newWidth = width - deltaX;
            break;
    }

    // Ensure minimum size
    newWidth = Math.max(MIN_SHAPE_SIZE.RECT_WIDTH, newWidth);
    newHeight = Math.max(MIN_SHAPE_SIZE.RECT_HEIGHT, newHeight);

    // Adjust position if width/height changed due to minimum constraints
    if (newWidth === MIN_SHAPE_SIZE.RECT_WIDTH && handleType.includes('w')) {
        newX = x + width - MIN_SHAPE_SIZE.RECT_WIDTH;
    }
    if (newHeight === MIN_SHAPE_SIZE.RECT_HEIGHT && handleType.includes('n')) {
        newY = y + height - MIN_SHAPE_SIZE.RECT_HEIGHT;
    }

    shape.setAttribute('x', newX);
    shape.setAttribute('y', newY);
    shape.setAttribute('width', newWidth);
    shape.setAttribute('height', newHeight);
}

/**
 * Handle group (Cisco shape) resize
 */
function handleGroupResize(shape, handleType, deltaX, deltaY) {
    // Get the current transform
    const transform = shape.getAttribute('transform');
    let tx = 0,
        ty = 0;

    if (transform) {
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        if (match) {
            tx = parseFloat(match[1]);
            ty = parseFloat(match[2]);
        }
    }

    // Get the SVG element inside the group
    const svg = shape.querySelector('svg');
    if (!svg) return;

    const currentWidth = parseFloat(svg.getAttribute('width'));
    const currentHeight = parseFloat(svg.getAttribute('height'));

    let newX = tx;
    let newY = ty;
    let newWidth = currentWidth;
    let newHeight = currentHeight;

    // Calculate new dimensions based on handle type
    switch (handleType) {
        case 'nw':
            newX = tx + deltaX;
            newY = ty + deltaY;
            newWidth = currentWidth - deltaX;
            newHeight = currentHeight - deltaY;
            break;
        case 'ne':
            newY = ty + deltaY;
            newWidth = currentWidth + deltaX;
            newHeight = currentHeight - deltaY;
            break;
        case 'se':
            newWidth = currentWidth + deltaX;
            newHeight = currentHeight + deltaY;
            break;
        case 'sw':
            newX = tx + deltaX;
            newWidth = currentWidth - deltaX;
            newHeight = currentHeight + deltaY;
            break;
        case 'n':
            newY = ty + deltaY;
            newHeight = currentHeight - deltaY;
            break;
        case 'e':
            newWidth = currentWidth + deltaX;
            break;
        case 's':
            newHeight = currentHeight + deltaY;
            break;
        case 'w':
            newX = tx + deltaX;
            newWidth = currentWidth - deltaX;
            break;
    }

    // Ensure minimum size
    const minSize = 20;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    // Adjust position if size changed due to minimum constraints
    if (newWidth === minSize && handleType.includes('w')) {
        newX = tx + currentWidth - minSize;
    }
    if (newHeight === minSize && handleType.includes('n')) {
        newY = ty + currentHeight - minSize;
    }

    // Update the group transform
    shape.setAttribute('transform', `translate(${newX}, ${newY})`);

    // Update the SVG dimensions
    svg.setAttribute('width', newWidth);
    svg.setAttribute('height', newHeight);

    // Update the label position if it exists
    const label = shape.querySelector('text');
    if (label) {
        label.setAttribute('x', newWidth / 2);
        label.setAttribute('y', newHeight + 12);
    }
}
