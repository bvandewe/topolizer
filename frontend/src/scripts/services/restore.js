/**
 * State restoration functionality
 * Restores saved topology, zoom level, and scroll position from localStorage
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { createShape, getShapeBounds } from '../shapes/shapeFactory.js';
import { addShapeEventListeners } from '../shapes/shapeEvents.js';
import {
    loadTopology,
    loadZoom,
    loadScrollPosition,
    loadShapeCounter,
    loadConnectionCounter,
    hasSavedData,
} from './storage.js';
import { addLabelListeners } from '../connections/connectionInteractions.js';
import { CISCO_SHAPES } from '../config/constants.js';

/**
 * Restore the complete application state from localStorage
 * This includes topology (shapes), zoom level, scroll position, and shape counter
 */
export function restoreAppState() {
    // Check if there's saved data to restore
    if (!hasSavedData()) {
        console.log('No saved data to restore');
        return;
    }

    console.log('Restoring saved application state...');

    // Restore shape counter first (so new shapes get correct IDs)
    const savedCounter = loadShapeCounter();
    if (savedCounter !== null) {
        appState.shapeIdCounter = savedCounter;
        console.log(`Restored shape counter: ${savedCounter}`);
    }

    // Restore connection counter
    const savedConnectionCounter = loadConnectionCounter();
    if (savedConnectionCounter !== null) {
        appState.connectionIdCounter = savedConnectionCounter;
        console.log(`Restored connection counter: ${savedConnectionCounter}`);
    }

    // Restore topology (shapes and connections)
    const topology = loadTopology();
    if (topology && topology.shapes) {
        restoreShapes(topology.shapes);
        console.log(`Restored ${topology.shapes.length} shapes`);

        // Restore connections after shapes (so shapes exist)
        if (topology.connections && topology.connections.length > 0) {
            restoreConnections(topology.connections);
            console.log(`Restored ${topology.connections.length} connections`);
        }
    }

    // Restore zoom level
    const zoom = loadZoom();
    if (zoom !== null) {
        appState.currentZoom = zoom;
        elements.canvas.style.transform = `scale(${zoom})`;
        if (elements.zoomLevel) {
            elements.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
        }
        console.log(`Restored zoom level: ${Math.round(zoom * 100)}%`);
    }

    // Restore scroll position (must be done after a small delay to ensure DOM is ready)
    setTimeout(() => {
        const scrollPos = loadScrollPosition();
        if (scrollPos) {
            elements.canvasWrapper.scrollLeft = scrollPos.left;
            elements.canvasWrapper.scrollTop = scrollPos.top;
            console.log(`Restored scroll position: (${scrollPos.left}, ${scrollPos.top})`);
        }
    }, 100);
}

/**
 * Restore shapes to the canvas from saved data
 * @param {Array} shapesData - Array of shape data objects
 */
function restoreShapes(shapesData) {
    shapesData.forEach((shapeData, index) => {
        try {
            console.log(`Restoring shape ${index + 1}:`, shapeData);

            // Create the SVG element based on the saved data
            const shape = createShapeElement(shapeData);

            // Determine which layer to add the shape to
            const targetLayerId = shapeData.layer || 'shapesLayer';
            const targetLayer =
                document.getElementById(targetLayerId) ||
                document.getElementById('shapesLayer') ||
                elements.canvas;

            console.log(`Adding shape to layer: ${targetLayer.id}`);
            targetLayer.appendChild(shape);

            // Add event listeners to make it interactive
            addShapeEventListeners(shape);

            console.log(`Shape ${index + 1} restored successfully:`, shape);
        } catch (error) {
            console.error('Error restoring shape:', error, shapeData);
        }
    });
}
/**
 * Create an SVG shape element from saved data
 * @param {Object} shapeData - Shape data object
 * @returns {SVGElement} The created shape element
 */
function createShapeElement(shapeData) {
    const { tagName, id, attributes, style, innerHTML } = shapeData;

    // Create the SVG element using the correct tag name
    const shape = document.createElementNS('http://www.w3.org/2000/svg', tagName);

    // Set the ID
    if (id) {
        shape.id = id;
    }

    // Add the canvas-shape class
    shape.classList.add('canvas-shape');

    // Add cisco-shape class if it's a group element
    if (tagName === 'g' && attributes && attributes['data-cisco'] === 'true') {
        shape.classList.add('cisco-shape');
    }

    // Set attributes
    if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            shape.setAttribute(key, value);
        });
    }

    // Set inline styles
    if (style) {
        Object.entries(style).forEach(([key, value]) => {
            if (value) {
                shape.style[key] = value;
            }
        });
    }

    // For group elements (Cisco shapes), restore or recreate the innerHTML
    if (tagName === 'g') {
        if (innerHTML && innerHTML.trim() !== '') {
            // Restore from saved innerHTML
            shape.innerHTML = innerHTML;
        } else {
            // innerHTML is empty or missing - need to recreate the Cisco shape
            const shapeType = attributes['data-shape-type'];
            if (shapeType && CISCO_SHAPES[shapeType]) {
                recreateCiscoShapeContent(shape, CISCO_SHAPES[shapeType]);
            }
        }
    }

    return shape;
}

/**
 * Recreate the innerHTML content for a Cisco shape
 * @param {SVGElement} group - The group element
 * @param {Object} ciscoTemplate - The Cisco shape template
 */
function recreateCiscoShapeContent(group, ciscoTemplate) {
    // Parse viewBox to get original dimensions
    const viewBoxParts = ciscoTemplate.viewBox.split(' ').map(Number);
    const [vbX, vbY, vbWidth, vbHeight] = viewBoxParts;

    // Scale to fit within 60x60 while maintaining aspect ratio
    const targetSize = 60;
    const scale = Math.min(targetSize / vbWidth, targetSize / vbHeight);
    const scaledWidth = vbWidth * scale;
    const scaledHeight = vbHeight * scale;

    // Create an SVG element to properly handle viewBox
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', scaledWidth);
    svg.setAttribute('height', scaledHeight);
    svg.setAttribute('viewBox', ciscoTemplate.viewBox);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Add a white background rectangle for visibility
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', vbX);
    bgRect.setAttribute('y', vbY);
    bgRect.setAttribute('width', vbWidth);
    bgRect.setAttribute('height', vbHeight);
    bgRect.setAttribute('fill', '#ffffff');
    bgRect.setAttribute('rx', '3');
    svg.appendChild(bgRect);

    // Create the shape path with proper fill
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', ciscoTemplate.svgPath);
    path.setAttribute('fill', ciscoTemplate.attributes.fill);
    path.setAttribute('stroke', ciscoTemplate.attributes.stroke || 'none');
    svg.appendChild(path);

    group.appendChild(svg);

    // Add label text below the shape
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', scaledWidth / 2);
    text.setAttribute('y', scaledHeight + 12);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#333');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.textContent = ciscoTemplate.label;
    group.appendChild(text);
}

/**
 * Restore connections to the canvas from saved data
 * @param {Array} connectionsData - Array of connection data objects
 */
function restoreConnections(connectionsData) {
    connectionsData.forEach((connectionData, index) => {
        try {
            console.log(`Restoring connection ${index + 1}:`, connectionData);

            // Create connection group
            const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            connectionGroup.id = connectionData.id;
            connectionGroup.classList.add('connection');
            connectionGroup.setAttribute('data-source', connectionData.sourceId);
            connectionGroup.setAttribute('data-target', connectionData.targetId);

            // Create the line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', connectionData.line.x1);
            line.setAttribute('y1', connectionData.line.y1);
            line.setAttribute('x2', connectionData.line.x2);
            line.setAttribute('y2', connectionData.line.y2);
            line.setAttribute('stroke', connectionData.line.stroke || '#6c757d');
            line.setAttribute('stroke-width', connectionData.line.strokeWidth || '3');
            line.classList.add('connection-line');

            // Use inline styles to override CSS
            line.style.stroke = connectionData.line.stroke || '#6c757d';
            line.style.strokeWidth = (connectionData.line.strokeWidth || '3') + 'px';

            // Apply stroke-dasharray if present
            if (connectionData.line.strokeDasharray) {
                line.setAttribute('stroke-dasharray', connectionData.line.strokeDasharray);
                line.style.strokeDasharray = connectionData.line.strokeDasharray;
            }

            // Create invisible wider line for easier clicking (hit target)
            const hitTarget = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hitTarget.setAttribute('x1', connectionData.line.x1);
            hitTarget.setAttribute('y1', connectionData.line.y1);
            hitTarget.setAttribute('x2', connectionData.line.x2);
            hitTarget.setAttribute('y2', connectionData.line.y2);
            hitTarget.setAttribute('stroke', 'transparent');
            hitTarget.setAttribute('stroke-width', '12'); // Wider hit area
            hitTarget.classList.add('connection-hit-target');
            hitTarget.style.cursor = 'pointer';
            hitTarget.style.strokeWidth = '12px';

            // Create source label
            const sourceLabel = createConnectionLabelElement(
                connectionData.id,
                connectionData.sourceLabel,
                'source'
            );

            // Create target label
            const targetLabel = createConnectionLabelElement(
                connectionData.id,
                connectionData.targetLabel,
                'target'
            );

            // Create center label
            const centerLabel = createConnectionLabelElement(
                connectionData.id,
                connectionData.centerLabel,
                'center'
            );

            // Add line to connection group (only the line!)
            connectionGroup.appendChild(line); // Add visible line first
            connectionGroup.appendChild(hitTarget); // Add hit target last (on top for mouse events)

            // Store label IDs as data attributes
            connectionGroup.setAttribute('data-source-label-id', sourceLabel.id);
            connectionGroup.setAttribute('data-target-label-id', targetLabel.id);
            connectionGroup.setAttribute('data-center-label-id', centerLabel.id);

            // Add connection to the connections layer
            const connectionsLayer = document.getElementById('connectionsLayer');
            if (connectionsLayer) {
                connectionsLayer.appendChild(connectionGroup);
            } else {
                // Fallback: Insert connection group before shapes so lines appear behind them
                const gridRect = elements.canvas.querySelector('rect[fill="url(#grid)"]');
                if (gridRect && gridRect.nextSibling) {
                    elements.canvas.insertBefore(connectionGroup, gridRect.nextSibling);
                } else if (gridRect) {
                    elements.canvas.appendChild(connectionGroup);
                } else {
                    elements.canvas.appendChild(connectionGroup);
                }
            }

            // Add labels to the labels layer
            const labelsLayer = document.getElementById('labelsLayer');
            const labelTarget = labelsLayer || elements.canvas;
            labelTarget.appendChild(sourceLabel);
            labelTarget.appendChild(targetLabel);
            labelTarget.appendChild(centerLabel);

            // Add event listeners to labels for selection, editing, and dragging
            addLabelListeners(sourceLabel);
            addLabelListeners(targetLabel);
            addLabelListeners(centerLabel);

            // Update shape connections data
            const sourceShape = document.getElementById(connectionData.sourceId);
            const targetShape = document.getElementById(connectionData.targetId);

            if (sourceShape) {
                if (!sourceShape.dataset.connections) {
                    sourceShape.dataset.connections = '';
                }
                sourceShape.dataset.connections += connectionData.id + ',';

                // Restore constraint center from saved data if available, otherwise calculate from shape
                if (
                    connectionData.sourceLabel.constraintCenterX &&
                    connectionData.sourceLabel.constraintCenterY
                ) {
                    sourceLabel.setAttribute(
                        'data-constraint-center-x',
                        connectionData.sourceLabel.constraintCenterX
                    );
                    sourceLabel.setAttribute(
                        'data-constraint-center-y',
                        connectionData.sourceLabel.constraintCenterY
                    );
                } else {
                    // Fallback: Calculate from current shape position
                    const sourceBounds = getShapeBounds(sourceShape);
                    const sourceCenterX = sourceBounds.x + sourceBounds.width / 2;
                    const sourceCenterY = sourceBounds.y + sourceBounds.height / 2;
                    sourceLabel.setAttribute('data-constraint-center-x', sourceCenterX);
                    sourceLabel.setAttribute('data-constraint-center-y', sourceCenterY);
                }

                // Restore constraint radius
                if (connectionData.sourceLabel.constraintRadius) {
                    sourceLabel.setAttribute(
                        'data-constraint-radius',
                        connectionData.sourceLabel.constraintRadius
                    );
                }
            }

            if (targetShape) {
                if (!targetShape.dataset.connections) {
                    targetShape.dataset.connections = '';
                }
                targetShape.dataset.connections += connectionData.id + ',';

                // Restore constraint center from saved data if available, otherwise calculate from shape
                if (
                    connectionData.targetLabel.constraintCenterX &&
                    connectionData.targetLabel.constraintCenterY
                ) {
                    targetLabel.setAttribute(
                        'data-constraint-center-x',
                        connectionData.targetLabel.constraintCenterX
                    );
                    targetLabel.setAttribute(
                        'data-constraint-center-y',
                        connectionData.targetLabel.constraintCenterY
                    );
                } else {
                    // Fallback: Calculate from current shape position
                    const targetBounds = getShapeBounds(targetShape);
                    const targetCenterX = targetBounds.x + targetBounds.width / 2;
                    const targetCenterY = targetBounds.y + targetBounds.height / 2;
                    targetLabel.setAttribute('data-constraint-center-x', targetCenterX);
                    targetLabel.setAttribute('data-constraint-center-y', targetCenterY);
                }

                // Restore constraint radius
                if (connectionData.targetLabel.constraintRadius) {
                    targetLabel.setAttribute(
                        'data-constraint-radius',
                        connectionData.targetLabel.constraintRadius
                    );
                }
            }

            console.log(`Connection ${index + 1} restored successfully`);
        } catch (error) {
            console.error('Error restoring connection:', error, connectionData);
        }
    });
}

/**
 * Create a connection label element from saved data
 * @param {string} connectionId - The connection ID
 * @param {Object} labelData - Label data object
 * @param {string} type - 'source' or 'target'
 * @returns {SVGTextElement} The label element
 */
function createConnectionLabelElement(connectionId, labelData, type) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    // Set label ID
    label.id = `label-${connectionId}-${type}`;

    // Handle null or missing labelData
    if (!labelData || !labelData.x) {
        labelData = {
            x: 0,
            y: 0,
            dx: type === 'source' ? '-5' : '5',
            dy: '-10',
            textAnchor: type === 'source' ? 'end' : 'start',
            text: '',
        };
    }

    label.setAttribute('x', labelData.x || 0);
    label.setAttribute('y', labelData.y || 0);
    label.setAttribute('dx', labelData.dx || '0');
    label.setAttribute('dy', labelData.dy || '0');
    label.setAttribute('text-anchor', labelData.textAnchor || 'start');
    label.setAttribute('fill', labelData.fill || '#495057');
    label.setAttribute('font-size', labelData.fontSize || '12');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-weight', 'bold');
    label.classList.add('connection-label', `connection-label-${type}`);
    label.setAttribute('data-connection-id', connectionId);
    label.setAttribute('data-label-type', type);
    label.style.cursor = 'pointer';
    label.textContent = labelData.text || '';

    // Calculate and store constraint circle data for dragging
    // This will be set properly after the connection is restored and we know the shapes
    // For now, set a default radius
    label.setAttribute('data-constraint-radius', '60');

    // Make label draggable (need to import and call makeLabelDraggable from connectionManager)
    // For now, we'll add basic dragging inline
    makeLabelDraggableInline(label);

    return label;
}

/**
 * Make a label draggable with circular constraint (inline version for restore)
 * @param {SVGTextElement} label - The label element
 */
function makeLabelDraggableInline(label) {
    let isDragging = false;
    let shapeCenter = null;
    let constraintRadius = 0;

    label.addEventListener('mousedown', e => {
        if (appState.isAddingConnection) return;

        e.stopPropagation();
        e.preventDefault(); // Prevent text selection during drag
        isDragging = true;

        // Get the connection and determine which shape this label is attached to
        const connectionId = label.getAttribute('data-connection-id');
        const labelType = label.getAttribute('data-label-type');
        const connection = document.getElementById(connectionId);

        if (connection) {
            const sourceId = connection.getAttribute('data-source');
            const targetId = connection.getAttribute('data-target');
            const shapeId = labelType === 'source' ? sourceId : targetId;
            const shape = document.getElementById(shapeId);

            if (shape) {
                // Get shape center
                const shapeRect = shape.getBoundingClientRect();
                const canvasRect = elements.canvas.getBoundingClientRect();
                shapeCenter = {
                    x:
                        (shapeRect.left + shapeRect.width / 2 - canvasRect.left) /
                        appState.currentZoom,
                    y:
                        (shapeRect.top + shapeRect.height / 2 - canvasRect.top) /
                        appState.currentZoom,
                };

                // Calculate constraint radius
                const currentX = parseFloat(label.getAttribute('x'));
                const currentY = parseFloat(label.getAttribute('y'));
                const dx = currentX - shapeCenter.x;
                const dy = currentY - shapeCenter.y;
                constraintRadius = Math.sqrt(dx * dx + dy * dy);

                // Ensure minimum radius
                if (constraintRadius < 50) {
                    constraintRadius = 50;
                }
            }
        }

        label.style.cursor = 'grabbing';
    });

    const handleMouseMove = e => {
        if (!isDragging || !shapeCenter) return;

        const canvasRect = elements.canvas.getBoundingClientRect();
        const mouseX = (e.clientX - canvasRect.left) / appState.currentZoom;
        const mouseY = (e.clientY - canvasRect.top) / appState.currentZoom;

        // Calculate angle from shape center to mouse position
        const dx = mouseX - shapeCenter.x;
        const dy = mouseY - shapeCenter.y;
        const angle = Math.atan2(dy, dx);

        // Position label on the circle at this angle
        const newX = shapeCenter.x + Math.cos(angle) * constraintRadius;
        const newY = shapeCenter.y + Math.sin(angle) * constraintRadius;

        label.setAttribute('x', newX);
        label.setAttribute('y', newY);
    };

    const handleMouseUp = () => {
        if (isDragging) {
            isDragging = false;
            shapeCenter = null;
            label.style.cursor = 'move';

            // Save the updated label position to localStorage
            const { saveAppState } = require('./storage.js');
            saveAppState();
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}
