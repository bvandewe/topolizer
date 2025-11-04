/**
 * Shape event handlers (selection and dragging)
 */

import { appState } from '../state/appState.js';
import { selectShape } from './shapeSelection.js';
import { elements } from '../utils/dom.js';
import {
    handleConnectionShapeClick,
    handleConnectionShapeHover,
    handleConnectionShapeLeave,
} from '../connections/connectionManager.js';
import { isInConnectionMode, handleTargetShapeClick } from '../ui/shapeOverlay.js';

/**
 * Remove event listeners from a shape
 * @param {SVGElement} shape - The shape element
 */
export function removeShapeEventListeners(shape) {
    // If the shape has an AbortController, abort it to remove all listeners
    if (shape._listenerController) {
        shape._listenerController.abort();
        delete shape._listenerController;
    }
}

/**
 * Add event listeners to a shape for selection and dragging
 * @param {SVGElement} shape - The shape element
 */
export function addShapeEventListeners(shape) {
    // Remove any existing listeners first
    removeShapeEventListeners(shape);

    // Create a new AbortController for this shape's listeners
    const controller = new AbortController();
    shape._listenerController = controller;
    const signal = controller.signal;

    // Selection
    shape.addEventListener(
        'click',
        e => {
            e.stopPropagation();

            // Check if we're in overlay connection mode - PRIORITY CHECK
            if (isInConnectionMode()) {
                // Handle target selection, don't select the shape normally
                handleTargetShapeClick(shape);
                return; // Exit early, don't call selectShape
            }

            // Check if we're in connection mode (old style)
            if (handleConnectionShapeClick(shape)) {
                return; // Connection mode handled the click
            }

            // Normal shape selection - only if not already selected
            // (mousedown already called selectShape via startDragging)
            if (appState.selectedShape !== shape) {
                selectShape(shape);
            }
        },
        { signal }
    );

    // Dragging
    shape.addEventListener(
        'mousedown',
        e => {
            // Don't stop propagation in selection mode - let it bubble to canvas
            if (appState.isSelectionMode) {
                return;
            }

            e.stopPropagation();

            // Don't allow dragging in connection mode
            if (appState.isAddingConnection) {
                return;
            }

            // Don't start dragging if we're clicking on a resize handle
            if (!e.target.classList.contains('resize-handle')) {
                startDragging(shape, e);
            }
        },
        { signal }
    );

    // Hover effects for connection mode
    shape.addEventListener(
        'mouseenter',
        () => {
            handleConnectionShapeHover(shape);
        },
        { signal }
    );

    shape.addEventListener(
        'mouseleave',
        () => {
            handleConnectionShapeLeave(shape);
        },
        { signal }
    );
}

/**
 * Start dragging a shape
 * @param {SVGElement} shape - The shape to drag
 * @param {MouseEvent} e - The mouse event
 */
function startDragging(shape, e) {
    // Mark that mouse is down, but don't start dragging yet
    appState.isMouseDown = true;
    selectShape(shape);

    const canvasRect = elements.topologyCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / appState.currentZoom;
    const mouseY = (e.clientY - canvasRect.top) / appState.currentZoom;

    // Store the initial mouse position for drag threshold
    appState.dragStartX = e.clientX;
    appState.dragStartY = e.clientY;

    // Calculate offset based on shape type (for when dragging actually starts)
    const dataType = shape.getAttribute('data-shape-type');

    if (shape.tagName === 'g') {
        // Handle group elements (Cisco shapes and arrows)
        if (dataType === 'arrow') {
            // For arrows, store offset relative to line center
            const line = shape.querySelector('.arrow-line');
            if (line) {
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                appState.dragOffsetX = mouseX - centerX;
                appState.dragOffsetY = mouseY - centerY;
            }
        } else {
            // Cisco shapes with transform
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
            appState.dragOffsetX = mouseX - tx;
            appState.dragOffsetY = mouseY - ty;
        }
    } else if (shape.tagName === 'line') {
        // For lines, store offset relative to line center
        const x1 = parseFloat(shape.getAttribute('x1'));
        const y1 = parseFloat(shape.getAttribute('y1'));
        const x2 = parseFloat(shape.getAttribute('x2'));
        const y2 = parseFloat(shape.getAttribute('y2'));
        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;
        appState.dragOffsetX = mouseX - centerX;
        appState.dragOffsetY = mouseY - centerY;
    } else if (shape.tagName === 'circle') {
        appState.dragOffsetX = mouseX - parseFloat(shape.getAttribute('cx'));
        appState.dragOffsetY = mouseY - parseFloat(shape.getAttribute('cy'));
    } else if (shape.tagName === 'ellipse') {
        appState.dragOffsetX = mouseX - parseFloat(shape.getAttribute('cx'));
        appState.dragOffsetY = mouseY - parseFloat(shape.getAttribute('cy'));
    } else if (shape.tagName === 'rect') {
        const x = parseFloat(shape.getAttribute('x'));
        const y = parseFloat(shape.getAttribute('y'));
        appState.dragOffsetX = mouseX - x;
        appState.dragOffsetY = mouseY - y;
    }
}
