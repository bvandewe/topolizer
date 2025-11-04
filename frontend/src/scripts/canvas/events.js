/**
 * Canvas event handlers
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { deselectShape, removeResizeHandles } from '../shapes/shapeSelection.js';
import { handleResize } from '../shapes/shapeResize.js';
import { updateResizeHandles } from '../shapes/shapeSelection.js';
import { startPanning, handlePanning, stopPanning } from './panning.js';
import { createShape } from '../shapes/shapeFactory.js';
import { saveAppState } from '../services/storage.js';
import { updateShapeConnections } from '../connections/connectionManager.js';
import { deselectAll } from '../connections/connectionInteractions.js';
import { handleEndpointDrag, stopEndpointDrag } from '../shapes/lineEndpointHandles.js';

/**
 * Setup all canvas event listeners
 */
export function setupCanvasEvents() {
    setupCanvasMouseEvents();
    setupCanvasDropZone();
}

/**
 * Setup mouse events for canvas (panning and deselection)
 */
function setupCanvasMouseEvents() {
    // Canvas mousedown for panning
    elements.topologyCanvas.addEventListener('mousedown', e => {
        // Don't start panning in selection mode
        if (appState.isSelectionMode) return;

        // Only start panning if clicking on canvas background (not on shapes or handles)
        if (
            e.target === elements.topologyCanvas ||
            (e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'url(#grid)')
        ) {
            startPanning(e);
        }
    });

    // Canvas click (deselect shapes)
    elements.topologyCanvas.addEventListener('click', e => {
        // Deselect if clicking on canvas background or grid (not on shapes or resize handles)
        if (
            appState.selectedShape ||
            document.querySelector('.connection.selected, .connection-label.selected')
        ) {
            const isCanvas = e.target === elements.topologyCanvas;
            const isGrid =
                e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'url(#grid)';
            const isResizeHandle =
                e.target.classList && e.target.classList.contains('resize-handle');
            const isShape =
                e.target.tagName === 'circle' ||
                e.target.tagName === 'ellipse' ||
                (e.target.tagName === 'rect' && !isGrid && !isResizeHandle);
            const isConnection =
                e.target.classList && e.target.classList.contains('connection-line');
            const isLabel = e.target.classList && e.target.classList.contains('connection-label');

            if (!isShape && !isResizeHandle && !isConnection && !isLabel) {
                deselectShape();
                deselectAll();
            }
        }
    });

    // Global mouse move handler
    document.addEventListener('mousemove', handleGlobalMouseMove);

    // Global mouse up handler
    document.addEventListener('mouseup', handleGlobalMouseUp);
}

/**
 * Handle global mouse move for dragging, resizing, and panning
 * @param {MouseEvent} e - The mouse event
 */
function handleGlobalMouseMove(e) {
    // Handle panning first
    if (handlePanning(e)) {
        return;
    }

    const canvasRect = elements.topologyCanvas.getBoundingClientRect();
    const mouseX = (e.clientX - canvasRect.left) / appState.currentZoom;
    const mouseY = (e.clientY - canvasRect.top) / appState.currentZoom;

    // Handle endpoint dragging
    if (appState.isDraggingEndpoint && appState.selectedShape && appState.draggingEndpointType) {
        handleEndpointDrag(appState.selectedShape, appState.draggingEndpointType, mouseX, mouseY);
        return;
    }

    // Handle resizing
    if (appState.isResizing && appState.selectedShape && appState.resizeHandle) {
        handleResize(appState.selectedShape, appState.resizeHandle, mouseX, mouseY);
        return;
    }

    // Check for drag threshold - only start dragging if mouse moved enough
    if (appState.isMouseDown && !appState.isDraggingShape && appState.selectedShape) {
        const deltaX = Math.abs(e.clientX - appState.dragStartX);
        const deltaY = Math.abs(e.clientY - appState.dragStartY);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > appState.dragThreshold) {
            // User has moved the mouse enough, start dragging
            appState.isDraggingShape = true;

            // Prevent text selection during drag
            document.body.classList.add('no-select');

            // Recalculate drag offsets based on CURRENT mouse position and shape position
            // This prevents the shape from jumping when dragging starts
            const shape = appState.selectedShape;
            if (shape.tagName === 'g') {
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
            } else if (shape.tagName === 'circle' || shape.tagName === 'ellipse') {
                appState.dragOffsetX = mouseX - parseFloat(shape.getAttribute('cx'));
                appState.dragOffsetY = mouseY - parseFloat(shape.getAttribute('cy'));
            } else if (shape.tagName === 'rect') {
                const x = parseFloat(shape.getAttribute('x'));
                const y = parseFloat(shape.getAttribute('y'));
                appState.dragOffsetX = mouseX - x;
                appState.dragOffsetY = mouseY - y;
            }
        }
    }

    // Handle shape dragging (only if we've passed the threshold)
    if (appState.isDraggingShape && appState.selectedShape) {
        handleShapeDragging(mouseX, mouseY);
    }
}

/**
 * Update sibling label position for basic shapes
 * @param {SVGElement} shape - The shape element
 */
function updateSiblingLabelPosition(shape) {
    // Only for basic shapes (circle, rect, ellipse)
    if (shape.tagName !== 'circle' && shape.tagName !== 'rect' && shape.tagName !== 'ellipse') {
        return;
    }

    // Find sibling label
    const shapeId = shape.getAttribute('id');
    const labelEl = shape.parentNode?.querySelector(`text[data-shape-id="${shapeId}"]`);

    if (!labelEl) return;

    // Get label position preference
    const position = labelEl.getAttribute('data-position') || 'below';
    const offset = 20;

    // Get shape dimensions and position
    let width, height, x, y;

    if (shape.tagName === 'circle') {
        const r = parseFloat(shape.getAttribute('r')) || 30;
        const cx = parseFloat(shape.getAttribute('cx')) || 0;
        const cy = parseFloat(shape.getAttribute('cy')) || 0;
        width = r * 2;
        height = r * 2;
        x = cx;
        y = cy;
    } else if (shape.tagName === 'ellipse') {
        const rx = parseFloat(shape.getAttribute('rx')) || 40;
        const ry = parseFloat(shape.getAttribute('ry')) || 30;
        const cx = parseFloat(shape.getAttribute('cx')) || 0;
        const cy = parseFloat(shape.getAttribute('cy')) || 0;
        width = rx * 2;
        height = ry * 2;
        x = cx;
        y = cy;
    } else if (shape.tagName === 'rect') {
        width = parseFloat(shape.getAttribute('width')) || 60;
        height = parseFloat(shape.getAttribute('height')) || 40;
        x = parseFloat(shape.getAttribute('x')) || 0;
        y = parseFloat(shape.getAttribute('y')) || 0;
    }

    // Calculate label position (circles/ellipses use center coords, rects use corner)
    const isCircular = shape.tagName === 'circle' || shape.tagName === 'ellipse';
    let labelX, labelY;

    switch (position) {
        case 'above':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y - height / 2 - offset : y - offset;
            break;
        case 'below':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + height / 2 + offset : y + height + offset;
            break;
        case 'left':
            labelX = isCircular ? x - width / 2 - offset : x - offset;
            labelY = isCircular ? y : y + height / 2;
            break;
        case 'right':
            labelX = isCircular ? x + width / 2 + offset : x + width + offset;
            labelY = isCircular ? y : y + height / 2;
            break;
        case 'center':
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + 5 : y + height / 2 + 5;
            break;
        default:
            labelX = isCircular ? x : x + width / 2;
            labelY = isCircular ? y + height / 2 + offset : y + height + offset;
    }

    labelEl.setAttribute('x', labelX);
    labelEl.setAttribute('y', labelY);
}

/**
 * Handle shape dragging
 */
function handleShapeDragging(mouseX, mouseY) {
    const shape = appState.selectedShape;
    const newX = mouseX - appState.dragOffsetX;
    const newY = mouseY - appState.dragOffsetY;
    const dataType = shape.getAttribute('data-shape-type');

    // Update shape position based on type
    if (shape.tagName === 'g') {
        // Handle group elements (Cisco shapes and arrows)
        if (dataType === 'arrow') {
            // For arrows, move all components together
            const line = shape.querySelector('.arrow-line');
            const arrowhead = shape.querySelector('.arrow-head');
            const startCircle = shape.querySelector('.arrow-start');

            if (line) {
                const oldX1 = parseFloat(line.getAttribute('x1'));
                const oldY1 = parseFloat(line.getAttribute('y1'));
                const oldX2 = parseFloat(line.getAttribute('x2'));
                const oldY2 = parseFloat(line.getAttribute('y2'));
                const oldCenterX = (oldX1 + oldX2) / 2;
                const oldCenterY = (oldY1 + oldY2) / 2;

                const deltaX = newX - oldCenterX;
                const deltaY = newY - oldCenterY;

                // Update line
                line.setAttribute('x1', oldX1 + deltaX);
                line.setAttribute('y1', oldY1 + deltaY);
                line.setAttribute('x2', oldX2 + deltaX);
                line.setAttribute('y2', oldY2 + deltaY);

                // Update arrowhead
                if (arrowhead) {
                    const points = arrowhead.getAttribute('points').split(' ');
                    const newPoints = points
                        .map(point => {
                            const [x, y] = point.split(',').map(Number);
                            return `${x + deltaX},${y + deltaY}`;
                        })
                        .join(' ');
                    arrowhead.setAttribute('points', newPoints);
                }

                // Update start circle
                if (startCircle) {
                    const cx = parseFloat(startCircle.getAttribute('cx'));
                    const cy = parseFloat(startCircle.getAttribute('cy'));
                    startCircle.setAttribute('cx', cx + deltaX);
                    startCircle.setAttribute('cy', cy + deltaY);
                }
            }
        } else {
            // Cisco shapes with transform
            shape.setAttribute('transform', `translate(${newX}, ${newY})`);
        }
    } else if (shape.tagName === 'line') {
        // For lines, move both endpoints
        const oldX1 = parseFloat(shape.getAttribute('x1'));
        const oldY1 = parseFloat(shape.getAttribute('y1'));
        const oldX2 = parseFloat(shape.getAttribute('x2'));
        const oldY2 = parseFloat(shape.getAttribute('y2'));
        const oldCenterX = (oldX1 + oldX2) / 2;
        const oldCenterY = (oldY1 + oldY2) / 2;

        const deltaX = newX - oldCenterX;
        const deltaY = newY - oldCenterY;

        shape.setAttribute('x1', oldX1 + deltaX);
        shape.setAttribute('y1', oldY1 + deltaY);
        shape.setAttribute('x2', oldX2 + deltaX);
        shape.setAttribute('y2', oldY2 + deltaY);
    } else if (shape.tagName === 'circle') {
        shape.setAttribute('cx', newX);
        shape.setAttribute('cy', newY);
    } else if (shape.tagName === 'ellipse') {
        shape.setAttribute('cx', newX);
        shape.setAttribute('cy', newY);
    } else if (shape.tagName === 'rect') {
        shape.setAttribute('x', newX);
        shape.setAttribute('y', newY);
    }

    // Update sibling label position if shape has one
    updateSiblingLabelPosition(shape);

    // Update resize handles
    updateResizeHandles(shape);

    // Update any connections to this shape
    updateShapeConnections(shape);
}

/**
 * Handle global mouse up event
 */
function handleGlobalMouseUp() {
    const wasInteracting =
        appState.isDraggingShape || appState.isResizing || appState.isDraggingEndpoint;
    const wasResizing = appState.isResizing;
    const wasDragging = appState.isDraggingShape;
    const wasDraggingEndpoint = appState.isDraggingEndpoint;
    const interactedShape = appState.selectedShape;

    // Re-enable text selection
    document.body.classList.remove('no-select');

    // Stop endpoint dragging if active
    if (wasDraggingEndpoint) {
        stopEndpointDrag();
    }

    appState.reset();
    stopPanning();

    // Reset cursor
    document.body.style.cursor = 'default';
    elements.topologyCanvas.style.cursor = 'grab';

    // Update interaction circle after resize or drag is complete
    if ((wasResizing || wasDragging || wasDraggingEndpoint) && interactedShape) {
        const { updateInteractionCirclePosition } = require('../ui/shapeInteractionCircle.js');
        updateInteractionCirclePosition(interactedShape);
    }

    // Save state if user was interacting with shapes
    if (wasInteracting) {
        saveAppState();
    }
}

/**
 * Setup drop zone for shapes from toolbar
 */
function setupCanvasDropZone() {
    elements.topologyCanvas.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        elements.topologyCanvas.classList.add('dragging-over');
    });

    elements.topologyCanvas.addEventListener('dragleave', e => {
        e.preventDefault();
        elements.topologyCanvas.classList.remove('dragging-over');
    });

    elements.topologyCanvas.addEventListener('drop', e => {
        e.preventDefault();
        elements.topologyCanvas.classList.remove('dragging-over');

        const shapeType = e.dataTransfer.getData('text/plain');
        const isCisco = e.dataTransfer.getData('cisco') === 'true';
        const canvasRect = elements.topologyCanvas.getBoundingClientRect();

        const x = (e.clientX - canvasRect.left) / appState.currentZoom;
        const y = (e.clientY - canvasRect.top) / appState.currentZoom;

        const shape = createShape(shapeType, x, y, isCisco);
        if (shape) {
            const shapesLayer = document.getElementById('shapesLayer') || elements.topologyCanvas;
            shapesLayer.appendChild(shape);
            saveAppState();
        }
    });
}
