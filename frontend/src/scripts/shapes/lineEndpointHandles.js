/**
 * Line and Arrow endpoint handle functionality
 * Allows users to drag endpoints to reposition them
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { updateShapeConnections } from '../connections/connectionManager.js';

/**
 * Create endpoint handles for line or arrow shapes
 * @param {SVGElement} shape - The line or arrow shape
 */
export function createEndpointHandles(shape) {
    removeEndpointHandles();

    const dataType = shape.getAttribute('data-shape-type');

    if (dataType === 'line') {
        createLineEndpointHandles(shape);
    } else if (dataType === 'arrow') {
        createArrowEndpointHandles(shape);
    }
}

/**
 * Create endpoint handles for a line shape
 * @param {SVGElement} line - The line element
 */
function createLineEndpointHandles(line) {
    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));

    // Create start point handle
    const startHandle = createEndpointHandle(x1, y1, 'start', line);
    elements.topologyCanvas.appendChild(startHandle);
    appState.addEndpointHandle(startHandle);

    // Create end point handle
    const endHandle = createEndpointHandle(x2, y2, 'end', line);
    elements.topologyCanvas.appendChild(endHandle);
    appState.addEndpointHandle(endHandle);
}

/**
 * Create endpoint handles for an arrow shape
 * @param {SVGElement} arrowGroup - The arrow group element
 */
function createArrowEndpointHandles(arrowGroup) {
    const line = arrowGroup.querySelector('.arrow-line');
    if (!line) return;

    const x1 = parseFloat(line.getAttribute('x1'));
    const y1 = parseFloat(line.getAttribute('y1'));
    const x2 = parseFloat(line.getAttribute('x2'));
    const y2 = parseFloat(line.getAttribute('y2'));

    // Create start point handle
    const startHandle = createEndpointHandle(x1, y1, 'start', arrowGroup);
    elements.topologyCanvas.appendChild(startHandle);
    appState.addEndpointHandle(startHandle);

    // Create end point handle
    const endHandle = createEndpointHandle(x2, y2, 'end', arrowGroup);
    elements.topologyCanvas.appendChild(endHandle);
    appState.addEndpointHandle(endHandle);
}

/**
 * Create a single endpoint handle
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} endpointType - 'start' or 'end'
 * @param {SVGElement} shape - The parent shape
 * @returns {SVGElement} The handle element
 */
function createEndpointHandle(x, y, endpointType, shape) {
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handle.setAttribute('class', 'endpoint-handle');
    handle.setAttribute('cx', x);
    handle.setAttribute('cy', y);
    handle.setAttribute('r', 6);
    handle.setAttribute('fill', '#FF9800');
    handle.setAttribute('stroke', '#ffffff');
    handle.setAttribute('stroke-width', 2);
    handle.style.cursor = 'move';
    handle.setAttribute('data-endpoint-type', endpointType);

    // Add drag event listeners
    handle.addEventListener('mousedown', e => {
        e.stopPropagation();
        startEndpointDrag(shape, endpointType, e);
    });

    return handle;
}

/**
 * Start dragging an endpoint
 * @param {SVGElement} shape - The shape being modified
 * @param {string} endpointType - 'start' or 'end'
 * @param {MouseEvent} e - The mouse event
 */
function startEndpointDrag(shape, endpointType, e) {
    appState.isDraggingEndpoint = true;
    appState.draggingEndpointType = endpointType;
    appState.selectShape(shape);

    // Prevent text selection during endpoint drag
    document.body.classList.add('no-select');

    document.body.style.cursor = 'move';
}

/**
 * Handle endpoint dragging during mouse move
 * @param {SVGElement} shape - The shape being modified
 * @param {string} endpointType - 'start' or 'end'
 * @param {number} mouseX - Current mouse X position
 * @param {number} mouseY - Current mouse Y position
 */
export function handleEndpointDrag(shape, endpointType, mouseX, mouseY) {
    const dataType = shape.getAttribute('data-shape-type');

    if (dataType === 'line') {
        // Update line endpoints
        if (endpointType === 'start') {
            shape.setAttribute('x1', mouseX);
            shape.setAttribute('y1', mouseY);
        } else {
            shape.setAttribute('x2', mouseX);
            shape.setAttribute('y2', mouseY);
        }
    } else if (dataType === 'arrow') {
        // Update arrow components
        const line = shape.querySelector('.arrow-line');
        const arrowhead = shape.querySelector('.arrow-head');
        const startCircle = shape.querySelector('.arrow-start');

        if (!line) return;

        if (endpointType === 'start') {
            // Update line start
            line.setAttribute('x1', mouseX);
            line.setAttribute('y1', mouseY);

            // Update start circle
            if (startCircle) {
                startCircle.setAttribute('cx', mouseX);
                startCircle.setAttribute('cy', mouseY);
            }
        } else {
            // Update line end
            line.setAttribute('x2', mouseX);
            line.setAttribute('y2', mouseY);

            // Update arrowhead position and orientation
            if (arrowhead) {
                const x1 = parseFloat(line.getAttribute('x1'));
                const y1 = parseFloat(line.getAttribute('y1'));
                const angle = Math.atan2(mouseY - y1, mouseX - x1);

                const headSize = 10;
                const arrowX = mouseX;
                const arrowY = mouseY;

                // Calculate arrowhead points based on angle
                const point1X = arrowX;
                const point1Y = arrowY;
                const point2X = arrowX - headSize * Math.cos(angle - Math.PI / 6);
                const point2Y = arrowY - headSize * Math.sin(angle - Math.PI / 6);
                const point3X = arrowX - headSize * Math.cos(angle + Math.PI / 6);
                const point3Y = arrowY - headSize * Math.sin(angle + Math.PI / 6);

                arrowhead.setAttribute(
                    'points',
                    `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`
                );
            }
        }
    }

    // Update endpoint handles
    updateEndpointHandles(shape);

    // Update connections
    updateShapeConnections(shape);
}

/**
 * Update endpoint handle positions
 * @param {SVGElement} shape - The shape whose handles to update
 */
export function updateEndpointHandles(shape) {
    if (appState.endpointHandles.length === 0) return;

    const dataType = shape.getAttribute('data-shape-type');
    let x1, y1, x2, y2;

    if (dataType === 'line') {
        x1 = parseFloat(shape.getAttribute('x1'));
        y1 = parseFloat(shape.getAttribute('y1'));
        x2 = parseFloat(shape.getAttribute('x2'));
        y2 = parseFloat(shape.getAttribute('y2'));
    } else if (dataType === 'arrow') {
        const line = shape.querySelector('.arrow-line');
        if (!line) return;

        x1 = parseFloat(line.getAttribute('x1'));
        y1 = parseFloat(line.getAttribute('y1'));
        x2 = parseFloat(line.getAttribute('x2'));
        y2 = parseFloat(line.getAttribute('y2'));
    } else {
        return;
    }

    // Update handle positions
    if (appState.endpointHandles[0]) {
        appState.endpointHandles[0].setAttribute('cx', x1);
        appState.endpointHandles[0].setAttribute('cy', y1);
    }
    if (appState.endpointHandles[1]) {
        appState.endpointHandles[1].setAttribute('cx', x2);
        appState.endpointHandles[1].setAttribute('cy', y2);
    }
}

/**
 * Remove all endpoint handles
 */
export function removeEndpointHandles() {
    appState.clearEndpointHandles();
}

/**
 * Stop endpoint dragging
 */
export function stopEndpointDrag() {
    appState.isDraggingEndpoint = false;
    appState.draggingEndpointType = null;
    document.body.style.cursor = 'default';
}
