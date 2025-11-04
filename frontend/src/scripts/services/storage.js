/**
 * Storage service for persisting application state
 */

import { appState } from '../state/appState.js';
import { elements } from '../utils/dom.js';

const STORAGE_KEYS = {
    TOPOLOGY: 'topologyBuilder_topology',
    ZOOM: 'topologyBuilder_zoom',
    SCROLL: 'topologyBuilder_scroll',
    SHAPE_COUNTER: 'topologyBuilder_shapeCounter',
    CONNECTION_COUNTER: 'topologyBuilder_connectionCounter',
};

/**
 * Save the current topology to localStorage
 */
export function saveTopology() {
    try {
        const shapes = Array.from(elements.topologyCanvas.querySelectorAll('.canvas-shape'));
        const connections = Array.from(elements.topologyCanvas.querySelectorAll('.connection'));

        const topology = {
            version: '1.0',
            saved: new Date().toISOString(),
            shapes: shapes.map(shape => {
                const shapeData = {
                    id: shape.id,
                    tagName: shape.tagName.toLowerCase(), // SVG element type (circle, ellipse, rect, g)
                    shapeType: shape.getAttribute('data-shape-type'), // Shape type (circle, oval, rectangle, square, or cisco shape)
                    layer: shape.parentElement?.id || 'shapesLayer', // Save which layer the shape is in
                    attributes: Array.from(shape.attributes).reduce((acc, attr) => {
                        // Skip internal attributes
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

                const sourceLabel = document.getElementById(sourceLabelId);
                const targetLabel = document.getElementById(targetLabelId);
                const centerLabel = document.getElementById(centerLabelId);

                const line = connection.querySelector('.connection-line');
                return {
                    id: connection.id,
                    sourceId: connection.getAttribute('data-source'),
                    targetId: connection.getAttribute('data-target'),
                    line: {
                        x1: line.getAttribute('x1'),
                        y1: line.getAttribute('y1'),
                        x2: line.getAttribute('x2'),
                        y2: line.getAttribute('y2'),
                        stroke: line.getAttribute('stroke') || '#6c757d',
                        strokeWidth: line.getAttribute('stroke-width') || '3',
                        strokeDasharray: line.getAttribute('stroke-dasharray') || '',
                    },
                    sourceLabel: sourceLabel
                        ? {
                              text: sourceLabel.textContent || '',
                              x: sourceLabel.getAttribute('x') || '0',
                              y: sourceLabel.getAttribute('y') || '0',
                              dx: sourceLabel.getAttribute('dx') || '0',
                              dy: sourceLabel.getAttribute('dy') || '0',
                              textAnchor: sourceLabel.getAttribute('text-anchor') || 'start',
                              constraintCenterX:
                                  sourceLabel.getAttribute('data-constraint-center-x') || null,
                              constraintCenterY:
                                  sourceLabel.getAttribute('data-constraint-center-y') || null,
                              constraintRadius:
                                  sourceLabel.getAttribute('data-constraint-radius') || '60',
                          }
                        : {
                              text: '',
                              x: '0',
                              y: '0',
                              dx: '-5',
                              dy: '-10',
                              textAnchor: 'end',
                          },
                    targetLabel: targetLabel
                        ? {
                              text: targetLabel.textContent || '',
                              x: targetLabel.getAttribute('x') || '0',
                              y: targetLabel.getAttribute('y') || '0',
                              dx: targetLabel.getAttribute('dx') || '0',
                              dy: targetLabel.getAttribute('dy') || '0',
                              textAnchor: targetLabel.getAttribute('text-anchor') || 'start',
                              constraintCenterX:
                                  targetLabel.getAttribute('data-constraint-center-x') || null,
                              constraintCenterY:
                                  targetLabel.getAttribute('data-constraint-center-y') || null,
                              constraintRadius:
                                  targetLabel.getAttribute('data-constraint-radius') || '60',
                          }
                        : {
                              text: '',
                              x: '0',
                              y: '0',
                              dx: '5',
                              dy: '-10',
                              textAnchor: 'start',
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

        localStorage.setItem(STORAGE_KEYS.TOPOLOGY, JSON.stringify(topology));
        return true;
    } catch (error) {
        console.error('Error saving topology:', error);
        return false;
    }
}

/**
 * Load topology from localStorage
 * @returns {Object|null} The saved topology or null
 */
export function loadTopology() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.TOPOLOGY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading topology:', error);
        return null;
    }
}

/**
 * Save current zoom level
 */
export function saveZoom() {
    try {
        localStorage.setItem(STORAGE_KEYS.ZOOM, appState.currentZoom.toString());
        return true;
    } catch (error) {
        console.error('Error saving zoom:', error);
        return false;
    }
}

/**
 * Load saved zoom level
 * @returns {number|null} The saved zoom level or null
 */
export function loadZoom() {
    try {
        const zoom = localStorage.getItem(STORAGE_KEYS.ZOOM);
        return zoom ? parseFloat(zoom) : null;
    } catch (error) {
        console.error('Error loading zoom:', error);
        return null;
    }
}

/**
 * Save current scroll position
 */
export function saveScrollPosition() {
    try {
        const scroll = {
            left: elements.canvasWrapper.scrollLeft,
            top: elements.canvasWrapper.scrollTop,
        };
        localStorage.setItem(STORAGE_KEYS.SCROLL, JSON.stringify(scroll));
        return true;
    } catch (error) {
        console.error('Error saving scroll position:', error);
        return false;
    }
}

/**
 * Load saved scroll position
 * @returns {Object|null} The saved scroll position or null
 */
export function loadScrollPosition() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.SCROLL);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading scroll position:', error);
        return null;
    }
}

/**
 * Save the shape ID counter
 */
export function saveShapeCounter() {
    try {
        localStorage.setItem(STORAGE_KEYS.SHAPE_COUNTER, appState.shapeIdCounter.toString());
        return true;
    } catch (error) {
        console.error('Error saving shape counter:', error);
        return false;
    }
}

/**
 * Load the shape ID counter
 * @returns {number|null} The saved counter or null
 */
export function loadShapeCounter() {
    try {
        const counter = localStorage.getItem(STORAGE_KEYS.SHAPE_COUNTER);
        return counter ? parseInt(counter, 10) : null;
    } catch (error) {
        console.error('Error loading shape counter:', error);
        return null;
    }
}

/**
 * Save the connection ID counter
 */
export function saveConnectionCounter() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.CONNECTION_COUNTER,
            appState.connectionIdCounter.toString()
        );
        return true;
    } catch (error) {
        console.error('Error saving connection counter:', error);
        return false;
    }
}

/**
 * Load the connection ID counter
 * @returns {number|null} The saved counter or null
 */
export function loadConnectionCounter() {
    try {
        const counter = localStorage.getItem(STORAGE_KEYS.CONNECTION_COUNTER);
        return counter ? parseInt(counter, 10) : null;
    } catch (error) {
        console.error('Error loading connection counter:', error);
        return null;
    }
}

/**
 * Save complete application state
 */
export function saveAppState() {
    saveTopology();
    saveZoom();
    saveScrollPosition();
    saveShapeCounter();
    saveConnectionCounter();
}

/**
 * Clear all saved data
 */
export function clearStorage() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
}

/**
 * Check if there is saved data
 * @returns {boolean} True if there is saved data
 */
export function hasSavedData() {
    return localStorage.getItem(STORAGE_KEYS.TOPOLOGY) !== null;
}
