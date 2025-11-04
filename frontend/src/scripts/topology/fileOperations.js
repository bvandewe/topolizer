/**
 * Topology file operations (export, import, clear)
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';
import { SHAPE_TEMPLATES } from '../config/constants.js';
import { addShapeEventListeners } from '../shapes/shapeEvents.js';
import { removeResizeHandles } from '../shapes/shapeSelection.js';
import { saveAppState, clearStorage } from '../services/storage.js';
import { showAlert } from '../utils/modal.js';

/**
 * Create a new topology (clear canvas)
 */
export function newTopology() {
    // Show confirmation modal
    const modal = document.getElementById('newTopologyModal');
    const bsModal = new bootstrap.Modal(modal);

    // Set up one-time event listener for confirmation
    const confirmBtn = document.getElementById('confirmNewTopology');
    const handleConfirm = () => {
        clearCanvas();
        clearStorage();
        bsModal.hide();
        confirmBtn.removeEventListener('click', handleConfirm);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    bsModal.show();
}

/**
 * Export topology to JSON file
 */
export function exportTopology() {
    const shapes = Array.from(elements.topologyCanvas.querySelectorAll('.canvas-shape'));
    const connections = Array.from(elements.topologyCanvas.querySelectorAll('.connection'));

    const topology = {
        version: '1.0',
        created: new Date().toISOString(),
        shapes: shapes.map(shape => {
            const shapeData = {
                id: shape.id,
                tagName: shape.tagName.toLowerCase(),
                shapeType: shape.getAttribute('data-shape-type'),
                attributes: Array.from(shape.attributes).reduce((acc, attr) => {
                    if (attr.name !== 'class' && attr.name !== 'id') {
                        acc[attr.name] = attr.value;
                    }
                    return acc;
                }, {}),
                style: {
                    cursor: shape.style.cursor || '',
                },
            };

            // For group elements (Cisco shapes), save the innerHTML
            if (shape.tagName.toLowerCase() === 'g') {
                shapeData.innerHTML = shape.innerHTML;
            }

            return shapeData;
        }),
        connections: connections.map(connection => {
            const sourceLabelId = connection.getAttribute('data-source-label-id');
            const targetLabelId = connection.getAttribute('data-target-label-id');
            const centerLabelId = connection.getAttribute('data-center-label-id');
            const sourceLabel = sourceLabelId ? document.getElementById(sourceLabelId) : null;
            const targetLabel = targetLabelId ? document.getElementById(targetLabelId) : null;
            const centerLabel = centerLabelId ? document.getElementById(centerLabelId) : null;
            const line = connection.querySelector('.connection-line');

            return {
                id: connection.id,
                sourceId: connection.getAttribute('data-source'),
                targetId: connection.getAttribute('data-target'),
                line: line
                    ? {
                          x1: line.getAttribute('x1'),
                          y1: line.getAttribute('y1'),
                          x2: line.getAttribute('x2'),
                          y2: line.getAttribute('y2'),
                          stroke: line.getAttribute('stroke') || '#6c757d',
                          strokeWidth: line.getAttribute('stroke-width') || '3',
                          strokeDasharray: line.getAttribute('stroke-dasharray') || '',
                      }
                    : {
                          x1: 0,
                          y1: 0,
                          x2: 0,
                          y2: 0,
                          stroke: '#6c757d',
                          strokeWidth: '3',
                          strokeDasharray: '',
                      },
                sourceLabel: sourceLabel
                    ? {
                          text: sourceLabel.textContent || '',
                          x: sourceLabel.getAttribute('x') || '0',
                          y: sourceLabel.getAttribute('y') || '0',
                          dx: sourceLabel.getAttribute('dx') || '0',
                          dy: sourceLabel.getAttribute('dy') || '0',
                          textAnchor: sourceLabel.getAttribute('text-anchor') || 'start',
                          fill: sourceLabel.getAttribute('fill') || '#333333',
                          fontSize: sourceLabel.getAttribute('font-size') || '12',
                      }
                    : {
                          text: '',
                          x: '0',
                          y: '0',
                          dx: '-5',
                          dy: '-10',
                          textAnchor: 'end',
                          fill: '#333333',
                          fontSize: '12',
                      },
                targetLabel: targetLabel
                    ? {
                          text: targetLabel.textContent || '',
                          x: targetLabel.getAttribute('x') || '0',
                          y: targetLabel.getAttribute('y') || '0',
                          dx: targetLabel.getAttribute('dx') || '0',
                          dy: targetLabel.getAttribute('dy') || '0',
                          textAnchor: targetLabel.getAttribute('text-anchor') || 'start',
                          fill: targetLabel.getAttribute('fill') || '#333333',
                          fontSize: targetLabel.getAttribute('font-size') || '12',
                      }
                    : {
                          text: '',
                          x: '0',
                          y: '0',
                          dx: '5',
                          dy: '-10',
                          textAnchor: 'start',
                          fill: '#333333',
                          fontSize: '12',
                      },
                centerLabel: centerLabel
                    ? {
                          text: centerLabel.textContent || '',
                          x: centerLabel.getAttribute('x') || '0',
                          y: centerLabel.getAttribute('y') || '0',
                          dx: centerLabel.getAttribute('dx') || '0',
                          dy: centerLabel.getAttribute('dy') || '0',
                          textAnchor: centerLabel.getAttribute('text-anchor') || 'middle',
                          fill: centerLabel.getAttribute('fill') || '#212529',
                          fontSize: centerLabel.getAttribute('font-size') || '12',
                      }
                    : {
                          text: '',
                          x: '0',
                          y: '0',
                          dx: '0',
                          dy: '-5',
                          textAnchor: 'middle',
                          fill: '#212529',
                          fontSize: '12',
                      },
            };
        }),
    };

    const dataStr = JSON.stringify(topology, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `topology-${Date.now()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

/**
 * Import topology from JSON file
 */
export function importTopology() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const topology = JSON.parse(e.target.result);
                loadTopology(topology);
            } catch (error) {
                showAlert('Error loading topology file: ' + error.message, 'Import Error', 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

/**
 * Load topology from data object
 * @param {Object} topology - The topology data
 */
function loadTopology(topology) {
    clearCanvas();

    if (!topology.shapes) return;

    // Restore shapes first
    topology.shapes.forEach(shapeData => {
        const shape = document.createElementNS(
            'http://www.w3.org/2000/svg',
            shapeData.tagName || 'rect'
        );

        // Set ID first
        shape.id = shapeData.id;

        // Restore attributes
        Object.entries(shapeData.attributes || {}).forEach(([attr, value]) => {
            if (attr !== 'class') {
                shape.setAttribute(attr, value);
            }
        });

        // Restore style
        if (shapeData.style && shapeData.style.cursor) {
            shape.style.cursor = shapeData.style.cursor;
        }

        shape.setAttribute('class', 'canvas-shape');
        addShapeEventListeners(shape);
        const shapesLayer = document.getElementById('shapesLayer') || elements.topologyCanvas;
        shapesLayer.appendChild(shape);
    });

    // Restore connections after shapes
    if (topology.connections && topology.connections.length > 0) {
        topology.connections.forEach(connectionData => {
            try {
                // Create connection group
                const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                connectionGroup.id = connectionData.id;
                connectionGroup.classList.add('connection');
                connectionGroup.setAttribute('data-source', connectionData.sourceId);
                connectionGroup.setAttribute('data-target', connectionData.targetId);

                // Create the line
                if (connectionData.line) {
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', connectionData.line.x1 || 0);
                    line.setAttribute('y1', connectionData.line.y1 || 0);
                    line.setAttribute('x2', connectionData.line.x2 || 0);
                    line.setAttribute('y2', connectionData.line.y2 || 0);
                    line.setAttribute('stroke', connectionData.line.stroke || '#6c757d');
                    line.setAttribute('stroke-width', connectionData.line.strokeWidth || '3');
                    line.classList.add('connection-line');

                    // Use inline styles to override CSS
                    line.style.stroke = connectionData.line.stroke || '#6c757d';
                    line.style.strokeWidth = (connectionData.line.strokeWidth || '3') + 'px';

                    connectionGroup.appendChild(line);
                }

                // Add connection to the connections layer
                const connectionsLayer = document.getElementById('connectionsLayer');
                if (connectionsLayer) {
                    connectionsLayer.appendChild(connectionGroup);
                } else {
                    // Fallback: Insert connection before shapes
                    const firstShape = elements.topologyCanvas.querySelector('.canvas-shape');
                    if (firstShape) {
                        elements.topologyCanvas.insertBefore(connectionGroup, firstShape);
                    } else {
                        elements.topologyCanvas.appendChild(connectionGroup);
                    }
                }

                // Create and append labels to the labels layer
                const labelsLayer = document.getElementById('labelsLayer');
                const labelTarget = labelsLayer || elements.topologyCanvas;

                if (connectionData.sourceLabel) {
                    const sourceLabel = createLabelElement(
                        connectionData.id,
                        connectionData.sourceLabel,
                        'source'
                    );
                    connectionGroup.setAttribute('data-source-label-id', sourceLabel.id);
                    labelTarget.appendChild(sourceLabel);
                }

                if (connectionData.targetLabel) {
                    const targetLabel = createLabelElement(
                        connectionData.id,
                        connectionData.targetLabel,
                        'target'
                    );
                    connectionGroup.setAttribute('data-target-label-id', targetLabel.id);
                    labelTarget.appendChild(targetLabel);
                }

                if (connectionData.centerLabel) {
                    const centerLabel = createLabelElement(
                        connectionData.id,
                        connectionData.centerLabel,
                        'center'
                    );
                    connectionGroup.setAttribute('data-center-label-id', centerLabel.id);
                    labelTarget.appendChild(centerLabel);
                }

                // Update shape connections data
                const sourceShape = document.getElementById(connectionData.sourceId);
                const targetShape = document.getElementById(connectionData.targetId);

                if (sourceShape) {
                    if (!sourceShape.dataset.connections) {
                        sourceShape.dataset.connections = '';
                    }
                    sourceShape.dataset.connections += connectionData.id + ',';
                }

                if (targetShape) {
                    if (!targetShape.dataset.connections) {
                        targetShape.dataset.connections = '';
                    }
                    targetShape.dataset.connections += connectionData.id + ',';
                }
            } catch (error) {
                console.error('Error restoring connection:', error, connectionData);
            }
        });
    }

    // Update the shape counter if needed
    const maxShapeId = topology.shapes.reduce((max, shape) => {
        const match = shape.id.match(/shape-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);

    if (maxShapeId > 0 && maxShapeId >= appState.shapeIdCounter) {
        appState.shapeIdCounter = maxShapeId + 1;
    }

    // Update connection counter if needed
    if (topology.connections) {
        const maxConnectionId = topology.connections.reduce((max, conn) => {
            const match = conn.id.match(/connection-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);

        if (maxConnectionId > 0 && maxConnectionId >= appState.connectionIdCounter) {
            appState.connectionIdCounter = maxConnectionId + 1;
        }
    }

    saveAppState();
}

/**
 * Create a label element for imported topology
 * @param {string} connectionId - The connection ID
 * @param {Object} labelData - Label data object
 * @param {string} type - 'source' or 'target'
 * @returns {SVGTextElement} The label element
 */
function createLabelElement(connectionId, labelData, type) {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.id = `label-${connectionId}-${type}`;
    label.setAttribute('x', labelData.x || 0);
    label.setAttribute('y', labelData.y || 0);
    label.setAttribute('dx', labelData.dx || '5');
    label.setAttribute('dy', labelData.dy || '-5');
    label.setAttribute('text-anchor', labelData.textAnchor || 'start');
    label.setAttribute('fill', labelData.fill || '#495057');
    label.setAttribute('font-size', labelData.fontSize || '12');
    label.classList.add('connection-label');
    label.classList.add(`connection-label-${type}`);
    label.setAttribute('data-connection-id', connectionId);
    label.setAttribute('data-label-type', type);
    label.textContent = labelData.text || '';
    label.style.cursor = 'move';
    label.style.userSelect = 'none';

    return label;
}

/**
 * Clear all shapes, connections, and labels from canvas
 */
export function clearCanvas() {
    // Remove all shapes
    const shapes = elements.topologyCanvas.querySelectorAll('.canvas-shape');
    shapes.forEach(shape => shape.remove());

    // Remove all connections
    const connections = elements.topologyCanvas.querySelectorAll('.connection');
    connections.forEach(connection => connection.remove());

    // Remove all connection labels
    const labels = elements.topologyCanvas.querySelectorAll('.connection-label');
    labels.forEach(label => label.remove());

    // Deselect any selected elements
    appState.deselectShape();
    removeResizeHandles();

    // Reset connection counter
    appState.connectionIdCounter = 1;

    saveAppState();
}

export { loadTopology };
