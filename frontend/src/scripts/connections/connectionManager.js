/**
 * Connection/Edge management
 * Handles creation and management of connections between shapes
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { getShapeBounds } from '../shapes/shapeFactory.js';
import { removeResizeHandles, updateResizeHandles } from '../shapes/shapeSelection.js';
import { saveAppState } from '../services/storage.js';
import { addLabelListeners } from './connectionInteractions.js';
import { showAlert } from '../utils/modal.js';

/**
 * Setup connection mode event listeners
 * Note: Connection creation is now handled via shape overlay panel
 */
export function setupConnectionMode() {
    // Keep this function for compatibility but connection mode
    // is now initiated through the shape overlay panel
    console.log('Connection manager initialized (overlay mode)');
}

/**
 * Start connection mode
 */
function startConnectionMode() {
    appState.startConnectionMode();

    // Update button state
    elements.addConnectionBtn.classList.add('active', 'btn-success');
    elements.addConnectionBtn.classList.remove('btn-outline-success');
    elements.addConnectionBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel Connection';

    // Change button handler to cancel
    elements.addConnectionBtn.onclick = cancelConnectionMode;

    // If a shape is already selected, use it as the source
    if (appState.selectedShape) {
        appState.setConnectionSource(appState.selectedShape);
        appState.selectedShape.classList.add('connection-source');

        // Show resize handles in different color
        changeResizeHandlesColor('#28a745'); // Green color for connection mode

        console.log(
            'Connection mode activated with pre-selected source:',
            appState.selectedShape.id
        );
    } else {
        console.log('Connection mode activated - select two shapes');
    }
}
/**
 * Cancel connection mode
 */
export function cancelConnectionMode() {
    appState.cancelConnectionMode();

    // Reset button state
    elements.addConnectionBtn.classList.remove('active', 'btn-success');
    elements.addConnectionBtn.classList.add('btn-outline-success');
    elements.addConnectionBtn.innerHTML = '<i class="bi bi-arrow-left-right"></i> Add Connection';

    // Reset button handler
    elements.addConnectionBtn.onclick = startConnectionMode;

    // Remove connection mode styling from any shapes
    document.querySelectorAll('.connection-source').forEach(el => {
        el.classList.remove('connection-source');
        removeResizeHandles();
    });

    console.log('Connection mode cancelled');
}

/**
 * Handle shape click in connection mode
 * @param {SVGElement} shape - The clicked shape
 */
export function handleConnectionShapeClick(shape) {
    if (!appState.isAddingConnection) return false;

    // First shape selection
    if (!appState.connectionSourceShape) {
        appState.setConnectionSource(shape);
        shape.classList.add('connection-source');

        // Show resize handles in different color
        updateResizeHandles(shape);
        changeResizeHandlesColor('#28a745'); // Green color for connection mode

        console.log('Source shape selected:', shape.id);
        return true;
    }

    // Second shape selection (can't be the same as first)
    if (!appState.connectionTargetShape && shape !== appState.connectionSourceShape) {
        appState.setConnectionTarget(shape);

        // Show the label modal
        showConnectionLabelModal();

        console.log('Target shape selected:', shape.id);
        return true;
    }

    return false;
}

/**
 * Handle mouse over shape in connection mode (for hover effect)
 * @param {SVGElement} shape - The shape being hovered
 */
export function handleConnectionShapeHover(shape) {
    if (!appState.isAddingConnection) return;
    if (!appState.connectionSourceShape) return; // Only after source is selected
    if (shape === appState.connectionSourceShape) return; // Can't hover source

    // Add hover effect
    const currentFill = shape.getAttribute('fill');
    shape.setAttribute('data-original-fill', currentFill);
    shape.setAttribute('fill', '#d4edda'); // Light green hover
}

/**
 * Handle mouse out from shape in connection mode
 * @param {SVGElement} shape - The shape being left
 */
export function handleConnectionShapeLeave(shape) {
    if (!appState.isAddingConnection) return;

    // Restore original fill
    const originalFill = shape.getAttribute('data-original-fill');
    if (originalFill) {
        shape.setAttribute('fill', originalFill);
        shape.removeAttribute('data-original-fill');
    }
}

/**
 * Change resize handles color for connection mode
 * @param {string} color - The color to apply
 */
function changeResizeHandlesColor(color) {
    appState.resizeHandles.forEach(handle => {
        handle.setAttribute('fill', color);
        handle.setAttribute('stroke', color);
    });
}

/**
 * Show the connection label modal
 */
function showConnectionLabelModal() {
    // Clear previous values
    elements.sourceLabel.value = '';
    elements.targetLabel.value = '';

    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(elements.connectionLabelModal);
    modal.show();
}

/**
 * Handle connection label form submission
 */
function handleConnectionLabelSubmit() {
    const sourceLabel = elements.sourceLabel.value.trim();
    const targetLabel = elements.targetLabel.value.trim();

    if (!sourceLabel || !targetLabel) {
        showAlert('Please enter labels for both connection ends', 'Missing Labels', 'warning');
        return;
    }

    // Create the connection
    createConnection(
        appState.connectionSourceShape,
        appState.connectionTargetShape,
        sourceLabel,
        targetLabel
    );

    // Hide modal
    const modal = bootstrap.Modal.getInstance(elements.connectionLabelModal);
    modal.hide();

    // Exit connection mode
    cancelConnectionMode();
}

/**
 * Create a connection between two shapes
 * @param {SVGElement} sourceShape - The source shape
 * @param {SVGElement} targetShape - The target shape
 * @param {string} sourceLabel - Label for source end
 * @param {string} targetLabel - Label for target end
 * @param {string} centerLabel - Label for center of connection (optional)
 * @param {number} strokeWidth - Width of the connection line (default: 3)
 * @param {string} strokeColor - Color of the connection line (default: '#6c757d')
 */
export function createConnection(
    sourceShape,
    targetShape,
    sourceLabel,
    targetLabel,
    centerLabel = '',
    strokeWidth = 3,
    strokeColor = '#6c757d'
) {
    const connectionId = appState.getNextConnectionId();

    // Get bounds of both shapes
    const sourceBounds = getShapeBounds(sourceShape);
    const targetBounds = getShapeBounds(targetShape);

    // Find closest points between the two shapes
    const { sourcePoint, targetPoint } = findClosestPoints(sourceBounds, targetBounds);

    // Calculate connection angle for label positioning
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;

    // Calculate center point for center label
    const centerPoint = {
        x: (sourcePoint.x + targetPoint.x) / 2,
        y: (sourcePoint.y + targetPoint.y) / 2,
    };

    // Create connection group
    const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionGroup.id = connectionId;
    connectionGroup.classList.add('connection');
    connectionGroup.setAttribute('data-source', sourceShape.id);
    connectionGroup.setAttribute('data-target', targetShape.id);

    // Create the line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', sourcePoint.x);
    line.setAttribute('y1', sourcePoint.y);
    line.setAttribute('x2', targetPoint.x);
    line.setAttribute('y2', targetPoint.y);
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', strokeWidth.toString());
    line.classList.add('connection-line');

    // Use inline styles to override CSS
    line.style.stroke = strokeColor;
    line.style.strokeWidth = strokeWidth + 'px';

    // Create invisible wider line for easier clicking (hit target)
    const hitTarget = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    hitTarget.setAttribute('x1', sourcePoint.x);
    hitTarget.setAttribute('y1', sourcePoint.y);
    hitTarget.setAttribute('x2', targetPoint.x);
    hitTarget.setAttribute('y2', targetPoint.y);
    hitTarget.setAttribute('stroke', 'transparent');
    hitTarget.setAttribute('stroke-width', '12'); // Wider hit area
    hitTarget.classList.add('connection-hit-target');
    hitTarget.style.cursor = 'pointer';
    hitTarget.style.strokeWidth = '12px';

    // Get shape centers for label positioning
    const sourceCenter = {
        x: sourceBounds.x + sourceBounds.width / 2,
        y: sourceBounds.y + sourceBounds.height / 2,
    };
    const targetCenter = {
        x: targetBounds.x + targetBounds.width / 2,
        y: targetBounds.y + targetBounds.height / 2,
    };

    // Create source label positioned on circle around source shape
    const sourceLabelEl = createConnectionLabel(
        connectionId,
        sourceLabel,
        sourcePoint.x,
        sourcePoint.y,
        'source',
        sourceShape,
        sourceCenter,
        targetCenter
    );

    // Create target label positioned on circle around target shape
    const targetLabelEl = createConnectionLabel(
        connectionId,
        targetLabel,
        targetPoint.x,
        targetPoint.y,
        'target',
        targetShape,
        targetCenter,
        sourceCenter
    );

    // Create center label (always empty initially)
    const centerLabelEl = createConnectionLabel(
        connectionId,
        centerLabel,
        centerPoint.x,
        centerPoint.y,
        'center'
    );

    // Add line to the group
    connectionGroup.appendChild(line); // Add visible line first
    connectionGroup.appendChild(hitTarget); // Add hit target last (on top for mouse events)

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
    labelTarget.appendChild(sourceLabelEl);
    labelTarget.appendChild(targetLabelEl);
    labelTarget.appendChild(centerLabelEl);

    // Add event listeners to labels for selection, editing, and dragging
    addLabelListeners(sourceLabelEl);
    addLabelListeners(targetLabelEl);
    addLabelListeners(centerLabelEl);

    // Set IDs on labels so we can find them
    sourceLabelEl.id = `label-${connectionId}-source`;
    targetLabelEl.id = `label-${connectionId}-target`;
    centerLabelEl.id = `label-${connectionId}-center`;

    // Store label references in connection group for updates
    connectionGroup.setAttribute('data-source-label-id', sourceLabelEl.id);
    connectionGroup.setAttribute('data-target-label-id', targetLabelEl.id);
    connectionGroup.setAttribute('data-center-label-id', centerLabelEl.id);

    // Store connection data on shapes for updates
    if (!sourceShape.dataset.connections) {
        sourceShape.dataset.connections = '';
    }
    sourceShape.dataset.connections += connectionId + ',';

    if (!targetShape.dataset.connections) {
        targetShape.dataset.connections = '';
    }
    targetShape.dataset.connections += connectionId + ',';

    // Save state
    saveAppState();

    // Return the connection group for further operations
    return connectionGroup;
}

/**
 * Create a connection label
 * @param {string} connectionId - The connection ID
 * @param {string} text - Label text
 * @param {number} x - Connection point X (intersection with shape)
 * @param {number} y - Connection point Y (intersection with shape)
 * @param {string} type - 'source', 'target', or 'center'
 * @param {SVGElement} shape - The shape element (for source/target)
 * @param {Object} shapeCenter - Center of the shape {x, y}
 * @param {Object} otherCenter - Center of the other shape {x, y}
 * @returns {SVGTextElement} The label element
 */
function createConnectionLabel(
    connectionId,
    text,
    x,
    y,
    type,
    shape = null,
    shapeCenter = null,
    otherCenter = null
) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    // Define constraint circle radius (distance from shape center)
    const CONSTRAINT_RADIUS = 60; // pixels from shape center

    let labelX = x;
    let labelY = y;

    // For source/target labels, position on the constraint circle
    if ((type === 'source' || type === 'target') && shapeCenter && otherCenter) {
        // Calculate angle from shape center to other shape center (connection direction)
        const dx = otherCenter.x - shapeCenter.x;
        const dy = otherCenter.y - shapeCenter.y;
        const angle = Math.atan2(dy, dx);

        // Position label on the constraint circle at this angle
        labelX = shapeCenter.x + Math.cos(angle) * CONSTRAINT_RADIUS;
        labelY = shapeCenter.y + Math.sin(angle) * CONSTRAINT_RADIUS;

        // Store the shape center and radius as data attributes for dragging
        label.setAttribute('data-constraint-center-x', shapeCenter.x);
        label.setAttribute('data-constraint-center-y', shapeCenter.y);
        label.setAttribute('data-constraint-radius', CONSTRAINT_RADIUS);
    }

    label.setAttribute('x', labelX);
    label.setAttribute('y', labelY);
    label.setAttribute('fill', '#495057');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-family', 'Arial, sans-serif');
    label.setAttribute('font-weight', 'bold');
    label.classList.add('connection-label', `connection-label-${type}`);
    label.setAttribute('data-connection-id', connectionId);
    label.setAttribute('data-label-type', type);

    // Set text anchor based on position relative to shape center
    if (type === 'source' || type === 'target') {
        const dx = labelX - shapeCenter.x;
        const dy = labelY - shapeCenter.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            // More horizontal
            label.setAttribute('text-anchor', dx > 0 ? 'start' : 'end');
        } else {
            // More vertical
            label.setAttribute('text-anchor', 'middle');
        }

        // Vertical alignment offset
        label.setAttribute('dy', '0.35em'); // Center vertically
    } else if (type === 'center') {
        // Center label is positioned horizontally centered
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dy', '-5');
        label.setAttribute('fill', '#212529'); // Darker for center label
    }

    label.textContent = text;

    // Make label draggable
    makeLabelDraggable(label);

    return label;
}

/**
 * Make a label draggable with circular constraint around its shape
 * @param {SVGTextElement} label - The label element
 */
function makeLabelDraggable(label) {
    let isDragging = false;
    let shapeCenter = null;
    let constraintRadius = 0;

    label.style.cursor = 'pointer';
    label._isDragging = false;

    label.addEventListener('mousedown', e => {
        if (appState.isAddingConnection) return; // Don't drag during connection mode

        e.stopPropagation();
        e.preventDefault(); // Prevent text selection during drag
        isDragging = true;
        label._isDragging = false; // Reset at start

        // Try to get constraint data from label attributes first
        const centerX = label.getAttribute('data-constraint-center-x');
        const centerY = label.getAttribute('data-constraint-center-y');
        const radius = label.getAttribute('data-constraint-radius');

        if (centerX && centerY && radius) {
            // Use stored constraint data
            shapeCenter = {
                x: parseFloat(centerX),
                y: parseFloat(centerY),
            };
            constraintRadius = parseFloat(radius);
        } else {
            // Fallback: calculate from shape bounds
            const connectionId = label.getAttribute('data-connection-id');
            const labelType = label.getAttribute('data-label-type');
            const connection = document.getElementById(connectionId);

            if (connection) {
                const sourceId = connection.getAttribute('data-source');
                const targetId = connection.getAttribute('data-target');
                const shapeId = labelType === 'source' ? sourceId : targetId;
                const shape = document.getElementById(shapeId);

                if (shape) {
                    const shapeBounds = getShapeBounds(shape);
                    shapeCenter = {
                        x: shapeBounds.x + shapeBounds.width / 2,
                        y: shapeBounds.y + shapeBounds.height / 2,
                    };

                    // Calculate current distance as radius
                    const currentX = parseFloat(label.getAttribute('x'));
                    const currentY = parseFloat(label.getAttribute('y'));
                    const dx = currentX - shapeCenter.x;
                    const dy = currentY - shapeCenter.y;
                    constraintRadius = Math.sqrt(dx * dx + dy * dy);

                    // Ensure minimum radius
                    if (constraintRadius < 50) {
                        constraintRadius = 50;
                    }

                    // Store for future use
                    label.setAttribute('data-constraint-center-x', shapeCenter.x);
                    label.setAttribute('data-constraint-center-y', shapeCenter.y);
                    label.setAttribute('data-constraint-radius', constraintRadius);
                }
            }
        }

        label.style.cursor = 'grabbing';
    });

    const handleMouseMove = e => {
        if (!isDragging || !shapeCenter) return;

        // Set flag that we're actually dragging
        label._isDragging = true;

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
            label.style.cursor = 'pointer';
            saveAppState();

            // Reset drag flag after a short delay
            setTimeout(() => {
                label._isDragging = false;
            }, 100);
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

/**
 * Find closest points on the boundaries of two shapes for connection
 * @param {Object} sourceBounds - Bounds of source shape {x, y, width, height}
 * @param {Object} targetBounds - Bounds of target shape
 * @returns {Object} {sourcePoint: {x, y}, targetPoint: {x, y}}
 */
function findClosestPoints(sourceBounds, targetBounds) {
    // Calculate centers
    const sourceCenter = {
        x: sourceBounds.x + sourceBounds.width / 2,
        y: sourceBounds.y + sourceBounds.height / 2,
    };

    const targetCenter = {
        x: targetBounds.x + targetBounds.width / 2,
        y: targetBounds.y + targetBounds.height / 2,
    };

    // Calculate the direction from source to target
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;

    // Find intersection points on the boundaries
    const sourcePoint = findBoundaryIntersection(sourceBounds, sourceCenter, dx, dy);
    const targetPoint = findBoundaryIntersection(targetBounds, targetCenter, -dx, -dy);

    return {
        sourcePoint,
        targetPoint,
    };
}

/**
 * Find the intersection point on a shape's boundary
 * @param {Object} bounds - Shape bounds {x, y, width, height}
 * @param {Object} center - Shape center {x, y}
 * @param {number} dx - Direction x component
 * @param {number} dy - Direction y component
 * @returns {Object} {x, y} intersection point
 */
function findBoundaryIntersection(bounds, center, dx, dy) {
    const halfWidth = bounds.width / 2;
    const halfHeight = bounds.height / 2;

    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
        return { x: center.x, y: center.y };
    }

    const normalizedDx = dx / length;
    const normalizedDy = dy / length;

    // Calculate which edge the line intersects
    // Check horizontal edges (top/bottom)
    const tHorizontal = halfHeight / Math.abs(normalizedDy);
    // Check vertical edges (left/right)
    const tVertical = halfWidth / Math.abs(normalizedDx);

    // Use the smaller t value (first intersection)
    const t = Math.min(tHorizontal, tVertical);

    return {
        x: center.x + normalizedDx * t,
        y: center.y + normalizedDy * t,
    };
}

/**
 * Update connections when a shape is moved
 * @param {SVGElement} shape - The shape that was moved
 */
export function updateShapeConnections(shape) {
    const connectionIds = shape.dataset.connections;
    if (!connectionIds) return;

    // Get all connection IDs for this shape
    const ids = connectionIds.split(',').filter(id => id);

    ids.forEach(connectionId => {
        const connection = document.getElementById(connectionId);
        if (!connection) return;

        const sourceId = connection.getAttribute('data-source');
        const targetId = connection.getAttribute('data-target');

        const sourceShape = document.getElementById(sourceId);
        const targetShape = document.getElementById(targetId);

        if (!sourceShape || !targetShape) return;

        // Recalculate connection points
        const sourceBounds = getShapeBounds(sourceShape);
        const targetBounds = getShapeBounds(targetShape);
        const { sourcePoint, targetPoint } = findClosestPoints(sourceBounds, targetBounds);

        // Calculate shape centers for label constraint circles
        const sourceCenter = {
            x: sourceBounds.x + sourceBounds.width / 2,
            y: sourceBounds.y + sourceBounds.height / 2,
        };
        const targetCenter = {
            x: targetBounds.x + targetBounds.width / 2,
            y: targetBounds.y + targetBounds.height / 2,
        };

        // Calculate center point
        const centerPoint = {
            x: (sourcePoint.x + targetPoint.x) / 2,
            y: (sourcePoint.y + targetPoint.y) / 2,
        };

        // Update line
        const line = connection.querySelector('.connection-line');
        if (line) {
            line.setAttribute('x1', sourcePoint.x);
            line.setAttribute('y1', sourcePoint.y);
            line.setAttribute('x2', targetPoint.x);
            line.setAttribute('y2', targetPoint.y);
        }

        // Update hit target
        const hitTarget = connection.querySelector('.connection-hit-target');
        if (hitTarget) {
            hitTarget.setAttribute('x1', sourcePoint.x);
            hitTarget.setAttribute('y1', sourcePoint.y);
            hitTarget.setAttribute('x2', targetPoint.x);
            hitTarget.setAttribute('y2', targetPoint.y);
        }

        // Update labels with constraint circle repositioning
        const sourceLabelId = connection.getAttribute('data-source-label-id');
        const targetLabelId = connection.getAttribute('data-target-label-id');
        const centerLabelId = connection.getAttribute('data-center-label-id');

        if (sourceLabelId) {
            const sourceLabel = document.getElementById(sourceLabelId);
            if (sourceLabel) {
                // Update constraint center
                const oldCenterX = parseFloat(sourceLabel.getAttribute('data-constraint-center-x'));
                const oldCenterY = parseFloat(sourceLabel.getAttribute('data-constraint-center-y'));

                sourceLabel.setAttribute('data-constraint-center-x', sourceCenter.x);
                sourceLabel.setAttribute('data-constraint-center-y', sourceCenter.y);

                // Get constraint radius and current label position
                const radius = parseFloat(sourceLabel.getAttribute('data-constraint-radius')) || 60;
                const currentX = parseFloat(sourceLabel.getAttribute('x'));
                const currentY = parseFloat(sourceLabel.getAttribute('y'));

                // Calculate current angle relative to OLD center
                let angle;
                if (!isNaN(oldCenterX) && !isNaN(oldCenterY)) {
                    const dx = currentX - oldCenterX;
                    const dy = currentY - oldCenterY;
                    angle = Math.atan2(dy, dx);
                } else {
                    // Fallback: use connection direction
                    const dx = targetCenter.x - sourceCenter.x;
                    const dy = targetCenter.y - sourceCenter.y;
                    angle = Math.atan2(dy, dx);
                }

                // Position label on constraint circle at the SAME angle relative to NEW center
                const labelX = sourceCenter.x + Math.cos(angle) * radius;
                const labelY = sourceCenter.y + Math.sin(angle) * radius;

                sourceLabel.setAttribute('x', labelX);
                sourceLabel.setAttribute('y', labelY);
            }
        }

        if (targetLabelId) {
            const targetLabel = document.getElementById(targetLabelId);
            if (targetLabel) {
                // Update constraint center
                const oldCenterX = parseFloat(targetLabel.getAttribute('data-constraint-center-x'));
                const oldCenterY = parseFloat(targetLabel.getAttribute('data-constraint-center-y'));

                targetLabel.setAttribute('data-constraint-center-x', targetCenter.x);
                targetLabel.setAttribute('data-constraint-center-y', targetCenter.y);

                // Get constraint radius and current label position
                const radius = parseFloat(targetLabel.getAttribute('data-constraint-radius')) || 60;
                const currentX = parseFloat(targetLabel.getAttribute('x'));
                const currentY = parseFloat(targetLabel.getAttribute('y'));

                // Calculate current angle relative to OLD center
                let angle;
                if (!isNaN(oldCenterX) && !isNaN(oldCenterY)) {
                    const dx = currentX - oldCenterX;
                    const dy = currentY - oldCenterY;
                    angle = Math.atan2(dy, dx);
                } else {
                    // Fallback: use connection direction
                    const dx = sourceCenter.x - targetCenter.x;
                    const dy = sourceCenter.y - targetCenter.y;
                    angle = Math.atan2(dy, dx);
                }

                // Position label on constraint circle at the SAME angle relative to NEW center
                const labelX = targetCenter.x + Math.cos(angle) * radius;
                const labelY = targetCenter.y + Math.sin(angle) * radius;

                targetLabel.setAttribute('x', labelX);
                targetLabel.setAttribute('y', labelY);
            }
        }
        if (centerLabelId) {
            const centerLabel = document.getElementById(centerLabelId);
            if (centerLabel) {
                centerLabel.setAttribute('x', centerPoint.x);
                centerLabel.setAttribute('y', centerPoint.y);
            }
        }
    });
}

/**
 * Delete connections associated with a shape
 * @param {SVGElement} shape - The shape being deleted
 */
export function deleteShapeConnections(shape) {
    const connectionIds = shape.dataset.connections;
    if (!connectionIds) return;

    const ids = connectionIds.split(',').filter(id => id);

    ids.forEach(connectionId => {
        const connection = document.getElementById(connectionId);
        if (connection) {
            // Get label IDs before removing the connection
            const sourceLabelId = connection.getAttribute('data-source-label-id');
            const targetLabelId = connection.getAttribute('data-target-label-id');
            const centerLabelId = connection.getAttribute('data-center-label-id');

            // Remove the connection line
            connection.remove();

            // Remove the separate label elements
            if (sourceLabelId) {
                const sourceLabel = document.getElementById(sourceLabelId);
                if (sourceLabel) sourceLabel.remove();
            }
            if (targetLabelId) {
                const targetLabel = document.getElementById(targetLabelId);
                if (targetLabel) targetLabel.remove();
            }
            if (centerLabelId) {
                const centerLabel = document.getElementById(centerLabelId);
                if (centerLabel) centerLabel.remove();
            }
        }
    });
}

/**
 * Migrate existing connections to have label ID attributes
 * This fixes connections created before the label ID feature was implemented
 */
export function migrateExistingConnections() {
    console.log('Migrating existing connections...');

    const connections = document.querySelectorAll('.connection');
    let migratedCount = 0;

    connections.forEach(connection => {
        const connectionId = connection.id;

        // Check if connection already has label IDs
        const hasSourceId = connection.getAttribute('data-source-label-id');
        const hasTargetId = connection.getAttribute('data-target-label-id');

        if (hasSourceId && hasTargetId) {
            // Already migrated
            return;
        }

        // Find the labels by their expected IDs based on connection ID
        const sourceLabel = document.getElementById(`label-${connectionId}-source`);
        const targetLabel = document.getElementById(`label-${connectionId}-target`);
        const centerLabel = document.getElementById(`label-${connectionId}-center`);

        // Set the data attributes if labels exist
        if (sourceLabel) {
            connection.setAttribute('data-source-label-id', sourceLabel.id);
            migratedCount++;
        }
        if (targetLabel) {
            connection.setAttribute('data-target-label-id', targetLabel.id);
        }
        if (centerLabel) {
            connection.setAttribute('data-center-label-id', centerLabel.id);
        }
    });

    if (migratedCount > 0) {
        console.log(`Migrated ${migratedCount} connections`);
        // Save the updated state
        saveAppState();
    } else {
        console.log('No connections needed migration');
    }
}
