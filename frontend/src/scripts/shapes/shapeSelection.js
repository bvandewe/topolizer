/**
 * Shape selection and resize handle management
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { getShapeBounds } from './shapeFactory.js';
import { startResize } from './shapeResize.js';
import { showOverlayPanel, hideOverlayPanel } from '../ui/shapeOverlay.js';
import {
    showInteractionCircle,
    hideInteractionCircle,
    updateInteractionCirclePosition,
} from '../ui/shapeInteractionCircle.js';
import { createEndpointHandles, removeEndpointHandles } from './lineEndpointHandles.js';

/**
 * Select a shape and show resize handles
 * @param {SVGElement} shape - The shape to select
 */
export function selectShape(shape) {
    // Deselect previous shape
    if (appState.selectedShape) {
        appState.selectedShape.classList.remove('selected');
        removeResizeHandles();
        removeEndpointHandles();
        hideInteractionCircle();
    }

    // Select new shape
    appState.selectShape(shape);
    shape.classList.add('selected');

    // Create appropriate handles based on shape type
    const dataType = shape.getAttribute('data-shape-type');
    if (dataType === 'line' || dataType === 'arrow') {
        createEndpointHandles(shape);
    } else {
        createResizeHandles(shape);
    }

    // Show interaction circle instead of overlay panel immediately
    showInteractionCircle(shape);

    // Note: No need to call updateInteractionCirclePosition here,
    // showInteractionCircle already positions it correctly
}

/**
 * Deselect the currently selected shape
 */
export function deselectShape() {
    if (appState.selectedShape) {
        appState.selectedShape.classList.remove('selected');
        appState.deselectShape();
        removeResizeHandles();
        removeEndpointHandles();
        hideOverlayPanel();
        hideInteractionCircle();
    }
}

/**
 * Create resize handles around a selected shape
 * @param {SVGElement} shape - The selected shape
 */
function createResizeHandles(shape) {
    removeResizeHandles();

    const bounds = getShapeBounds(shape);
    if (!bounds) return;

    // Define handle positions
    const handlePositions = [
        { x: bounds.left, y: bounds.top, cursor: 'nw-resize', type: 'nw' },
        { x: bounds.right, y: bounds.top, cursor: 'ne-resize', type: 'ne' },
        { x: bounds.right, y: bounds.bottom, cursor: 'se-resize', type: 'se' },
        { x: bounds.left, y: bounds.bottom, cursor: 'sw-resize', type: 'sw' },
        { x: bounds.centerX, y: bounds.top, cursor: 'n-resize', type: 'n' },
        { x: bounds.right, y: bounds.centerY, cursor: 'e-resize', type: 'e' },
        { x: bounds.centerX, y: bounds.bottom, cursor: 's-resize', type: 's' },
        { x: bounds.left, y: bounds.centerY, cursor: 'w-resize', type: 'w' },
    ];

    handlePositions.forEach(pos => {
        const handle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        handle.setAttribute('class', 'resize-handle');
        handle.setAttribute('x', pos.x - 4);
        handle.setAttribute('y', pos.y - 4);
        handle.setAttribute('width', 8);
        handle.setAttribute('height', 8);
        handle.setAttribute('fill', '#2196F3');
        handle.setAttribute('stroke', '#ffffff');
        handle.setAttribute('stroke-width', 1);
        handle.style.cursor = pos.cursor;
        handle.setAttribute('data-handle-type', pos.type);

        // Add resize event listeners
        handle.addEventListener('mousedown', e => {
            e.stopPropagation();
            startResize(shape, pos.type, e);
        });

        // Ensure cursor stays consistent
        handle.addEventListener('mouseenter', () => {
            handle.style.cursor = pos.cursor;
        });

        elements.topologyCanvas.appendChild(handle);
        appState.addResizeHandle(handle);
    });
}

/**
 * Remove all resize handles
 */
export function removeResizeHandles() {
    appState.clearResizeHandles();
}

/**
 * Update resize handle positions
 * @param {SVGElement} shape - The shape whose handles to update
 */
export function updateResizeHandles(shape) {
    if (appState.resizeHandles.length === 0) return;

    const bounds = getShapeBounds(shape);
    if (!bounds) return;

    const positions = [
        { x: bounds.left, y: bounds.top }, // nw
        { x: bounds.right, y: bounds.top }, // ne
        { x: bounds.right, y: bounds.bottom }, // se
        { x: bounds.left, y: bounds.bottom }, // sw
        { x: bounds.centerX, y: bounds.top }, // n
        { x: bounds.right, y: bounds.centerY }, // e
        { x: bounds.centerX, y: bounds.bottom }, // s
        { x: bounds.left, y: bounds.centerY }, // w
    ];

    positions.forEach((pos, index) => {
        if (appState.resizeHandles[index]) {
            appState.resizeHandles[index].setAttribute('x', pos.x - 4);
            appState.resizeHandles[index].setAttribute('y', pos.y - 4);
        }
    });

    // Note: Interaction circle update moved to mouseup for better performance
}
