/**
 * Application state management
 */

class AppState {
    constructor() {
        this.currentZoom = 1;
        this.shapeIdCounter = 0;
        this.connectionIdCounter = 0;
        this.selectedShape = null;
        this.isDraggingShape = false;
        this.isResizing = false;
        this.isPanningCanvas = false;
        this.isSelectionMode = false;
        this.selectionManager = null; // Reference to SelectionMode instance
        this.resizeHandle = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.panStartX = 0;
        this.panStartY = 0;
        this.resizeHandles = [];
        this.endpointHandles = [];
        this.isDraggingEndpoint = false;
        this.draggingEndpointType = null;
        // Connection mode state
        this.isAddingConnection = false;
        this.connectionSourceShape = null;
        this.connectionTargetShape = null;
        // Drag threshold - prevent accidental drags on click
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragThreshold = 3; // pixels to move before considering it a drag
        this.isMouseDown = false;
    }

    reset() {
        this.isDraggingShape = false;
        this.isResizing = false;
        this.isPanningCanvas = false;
        this.resizeHandle = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.panStartX = 0;
        this.panStartY = 0;
        this.isMouseDown = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.isDraggingEndpoint = false;
        this.draggingEndpointType = null;
    }

    getNextShapeId() {
        return `shape-${++this.shapeIdCounter}`;
    }

    getNextConnectionId() {
        return `connection-${++this.connectionIdCounter}`;
    }

    selectShape(shape) {
        this.selectedShape = shape;
    }

    deselectShape() {
        this.selectedShape = null;
    }

    clearResizeHandles() {
        this.resizeHandles.forEach(handle => handle.remove());
        this.resizeHandles = [];
    }

    addResizeHandle(handle) {
        this.resizeHandles.push(handle);
    }

    clearEndpointHandles() {
        this.endpointHandles.forEach(handle => handle.remove());
        this.endpointHandles = [];
    }

    addEndpointHandle(handle) {
        this.endpointHandles.push(handle);
    }

    startConnectionMode() {
        this.isAddingConnection = true;
        this.connectionSourceShape = null;
        this.connectionTargetShape = null;
    }

    cancelConnectionMode() {
        this.isAddingConnection = false;
        this.connectionSourceShape = null;
        this.connectionTargetShape = null;
    }

    setConnectionSource(shape) {
        this.connectionSourceShape = shape;
    }

    setConnectionTarget(shape) {
        this.connectionTargetShape = shape;
    }
}

export const appState = new AppState();
