/**
 * Selection Mode - Multi-select shapes with rectangle drag
 */

import { appState } from '../state/appState.js';
import { updateAlignmentToolbarVisibility } from '../ui/alignmentToolbar.js';

export class SelectionMode {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
        this.isSelecting = false;
        this.isDraggingGroup = false;
        this.startPoint = null;
        this.dragStartPoint = null;
        this.initialShapePositions = new Map();
        this.selectionRect = document.getElementById('selectionRect');
        this.selectedShapes = new Set();

        this.initEventListeners();
    }

    toggle() {
        this.isActive = !this.isActive;
        appState.isSelectionMode = this.isActive;

        if (this.isActive) {
            this.canvas.classList.add('selection-mode');
            this.canvas.style.cursor = 'crosshair';
            document.getElementById('toggleSelectionMode')?.classList.add('active');
        } else {
            this.canvas.classList.remove('selection-mode');
            this.canvas.style.cursor = 'grab';
            document.getElementById('toggleSelectionMode')?.classList.remove('active');
            this.clearSelection();
        }

        return this.isActive;
    }

    initEventListeners() {
        // Mouse down on canvas
        this.canvas.addEventListener('mousedown', e => {
            if (!this.isActive) return;

            const clickedShape = e.target.closest('.canvas-shape');

            // Check if clicked on a selected shape
            if (clickedShape && this.selectedShapes.has(clickedShape.id)) {
                // Start dragging the group
                this.startGroupDrag(e);
                e.stopPropagation();
                return;
            }

            // Check if clicked on an unselected shape
            if (clickedShape) {
                // Replace selection with just this shape
                this.clearSelection();
                this.selectedShapes.add(clickedShape.id);
                clickedShape.classList.add('shape-selected');
                updateAlignmentToolbarVisibility(1);
                this.startGroupDrag(e);
                e.stopPropagation();
                return;
            }

            // Clicked on background - start new selection rectangle
            const isBackgroundClick =
                e.target === this.canvas ||
                e.target.id === 'grid' ||
                (e.target.tagName === 'rect' &&
                    e.target.getAttribute('fill')?.includes('url(#grid)')) ||
                e.target.closest('g')?.id === 'backgroundShapesLayer';

            if (isBackgroundClick) {
                this.startSelection(e);
            }
        });

        // Mouse move updates selection rectangle or drags group
        this.canvas.addEventListener('mousemove', e => {
            if (!this.isActive) return;

            if (this.isDraggingGroup) {
                this.updateGroupDrag(e);
            } else if (this.isSelecting) {
                this.updateSelection(e);
            }
        });

        // Mouse up completes selection or group drag
        this.canvas.addEventListener('mouseup', e => {
            if (!this.isActive) return;

            if (this.isDraggingGroup) {
                this.endGroupDrag(e);
            } else if (this.isSelecting) {
                this.endSelection(e);
            }
        });

        // Global mouse up to handle dragging outside canvas
        document.addEventListener('mouseup', e => {
            if (this.isDraggingGroup) {
                this.endGroupDrag(e);
            }
        });

        // Keyboard: Delete selected shapes
        document.addEventListener('keydown', e => {
            if (!this.isActive || this.selectedShapes.size === 0) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Don't delete if typing in input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                this.deleteSelectedShapes();
            }
        });

        // Keyboard: V key toggles selection mode
        document.addEventListener('keydown', e => {
            if (e.key === 'v' || e.key === 'V') {
                // Don't toggle if typing in input
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                e.preventDefault();
                this.toggle();
            }
        });
    }

    startSelection(e) {
        const canvasWrapper = document.getElementById('canvasWrapper');
        const wrapperRect = canvasWrapper.getBoundingClientRect();

        // Convert viewport coordinates to SVG coordinates
        // Account for wrapper position and scroll
        const x = e.clientX - wrapperRect.left + canvasWrapper.scrollLeft;
        const y = e.clientY - wrapperRect.top + canvasWrapper.scrollTop;

        this.startPoint = { x, y };

        this.isSelecting = true;
        this.selectionRect.style.display = 'block';
        this.selectionRect.setAttribute('x', x);
        this.selectionRect.setAttribute('y', y);
        this.selectionRect.setAttribute('width', 0);
        this.selectionRect.setAttribute('height', 0);

        // Clear previous selection
        this.clearSelection();
    }

    updateSelection(e) {
        const canvasWrapper = document.getElementById('canvasWrapper');
        const wrapperRect = canvasWrapper.getBoundingClientRect();

        // Convert viewport coordinates to SVG coordinates
        const currentPoint = {
            x: e.clientX - wrapperRect.left + canvasWrapper.scrollLeft,
            y: e.clientY - wrapperRect.top + canvasWrapper.scrollTop,
        };

        const x = Math.min(this.startPoint.x, currentPoint.x);
        const y = Math.min(this.startPoint.y, currentPoint.y);
        const width = Math.abs(currentPoint.x - this.startPoint.x);
        const height = Math.abs(currentPoint.y - this.startPoint.y);

        this.selectionRect.setAttribute('x', x);
        this.selectionRect.setAttribute('y', y);
        this.selectionRect.setAttribute('width', width);
        this.selectionRect.setAttribute('height', height);

        // Highlight shapes that intersect with selection rectangle
        this.highlightIntersectingShapes(x, y, width, height);
    }
    endSelection(e) {
        this.isSelecting = false;
        this.selectionRect.style.display = 'none';
        updateAlignmentToolbarVisibility(this.selectedShapes.size);
    }

    highlightIntersectingShapes(selX, selY, selWidth, selHeight) {
        // Clear previous highlights
        this.clearSelection();

        // Get all shape groups from the canvas
        const shapes = this.canvas.querySelectorAll('.canvas-shape');

        shapes.forEach(shapeGroup => {
            try {
                // Get the bounding box of the shape in SVG coordinates
                const bbox = shapeGroup.getBBox();

                // Get transform if any
                const transform = shapeGroup.getAttribute('transform');
                let x = bbox.x;
                let y = bbox.y;

                // Parse translate transform if present
                if (transform) {
                    const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
                    if (translateMatch) {
                        x = parseFloat(translateMatch[1]);
                        y = parseFloat(translateMatch[2]);
                    }
                }

                const width = bbox.width;
                const height = bbox.height;

                // Check if selection rectangle intersects with shape
                if (
                    this.rectanglesIntersect(selX, selY, selWidth, selHeight, x, y, width, height)
                ) {
                    this.selectedShapes.add(shapeGroup.id);
                    shapeGroup.classList.add('shape-selected');
                }
            } catch (e) {
                // getBBox might fail for some elements, skip them silently
            }
        });
    }

    rectanglesIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
    }

    clearSelection() {
        this.selectedShapes.forEach(shapeId => {
            const shapeGroup = document.getElementById(shapeId);
            if (shapeGroup) {
                shapeGroup.classList.remove('shape-selected');
            }
        });
        this.selectedShapes.clear();
        updateAlignmentToolbarVisibility(0);
    }

    startGroupDrag(e) {
        const canvasWrapper = document.getElementById('canvasWrapper');
        const wrapperRect = canvasWrapper.getBoundingClientRect();

        this.isDraggingGroup = true;
        this.dragStartPoint = {
            x: e.clientX - wrapperRect.left + canvasWrapper.scrollLeft,
            y: e.clientY - wrapperRect.top + canvasWrapper.scrollTop,
        };

        // Prevent text selection during drag
        document.body.classList.add('no-select');

        // Store initial positions of all selected shapes
        this.initialShapePositions.clear();
        this.selectedShapes.forEach(shapeId => {
            const shape = document.getElementById(shapeId);
            if (shape) {
                const pos = this.getShapePosition(shape);
                this.initialShapePositions.set(shapeId, pos);
            }
        });

        this.canvas.style.cursor = 'move';
    }

    updateGroupDrag(e) {
        if (!this.isDraggingGroup) return;

        const canvasWrapper = document.getElementById('canvasWrapper');
        const wrapperRect = canvasWrapper.getBoundingClientRect();

        const currentPoint = {
            x: e.clientX - wrapperRect.left + canvasWrapper.scrollLeft,
            y: e.clientY - wrapperRect.top + canvasWrapper.scrollTop,
        };

        const dx = currentPoint.x - this.dragStartPoint.x;
        const dy = currentPoint.y - this.dragStartPoint.y;

        // Move all selected shapes
        this.selectedShapes.forEach(shapeId => {
            const shape = document.getElementById(shapeId);
            const initialPos = this.initialShapePositions.get(shapeId);

            if (shape && initialPos) {
                this.setShapePosition(shape, initialPos.x + dx, initialPos.y + dy);

                // Update connections for this shape
                import('../connections/connectionManager.js').then(({ updateShapeConnections }) => {
                    updateShapeConnections(shape);
                });
            }
        });
    }

    endGroupDrag(e) {
        if (!this.isDraggingGroup) return;

        this.isDraggingGroup = false;
        this.dragStartPoint = null;
        this.initialShapePositions.clear();
        this.canvas.style.cursor = 'crosshair';

        // Re-enable text selection
        document.body.classList.remove('no-select');

        // Save state after moving
        import('../services/storage.js').then(({ saveAppState }) => {
            saveAppState();
        });
    }

    getShapePosition(shape) {
        // Check if shape has transform attribute (for groups)
        const transform = shape.getAttribute('transform');
        if (transform) {
            const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (match) {
                return {
                    x: parseFloat(match[1]),
                    y: parseFloat(match[2]),
                };
            }
        }

        // For basic shapes (circle, ellipse, rect)
        const tagName = shape.tagName.toLowerCase();
        if (tagName === 'circle' || tagName === 'ellipse') {
            return {
                x: parseFloat(shape.getAttribute('cx') || 0),
                y: parseFloat(shape.getAttribute('cy') || 0),
            };
        } else if (tagName === 'rect') {
            return {
                x: parseFloat(shape.getAttribute('x') || 0),
                y: parseFloat(shape.getAttribute('y') || 0),
            };
        } else if (tagName === 'g') {
            // Group without transform
            return { x: 0, y: 0 };
        }

        return { x: 0, y: 0 };
    }

    setShapePosition(shape, x, y) {
        // Check if shape has transform attribute (for groups)
        const transform = shape.getAttribute('transform');
        if (transform || shape.tagName.toLowerCase() === 'g') {
            shape.setAttribute('transform', `translate(${x}, ${y})`);
            return;
        }

        // For basic shapes
        const tagName = shape.tagName.toLowerCase();
        if (tagName === 'circle' || tagName === 'ellipse') {
            shape.setAttribute('cx', x);
            shape.setAttribute('cy', y);
        } else if (tagName === 'rect') {
            shape.setAttribute('x', x);
            shape.setAttribute('y', y);
        }
    }

    deleteSelectedShapes() {
        if (this.selectedShapes.size === 0) return;

        // Get references to modal elements
        const deleteModal = document.getElementById('deleteShapesModal');
        const deleteMessage = document.getElementById('deleteShapesMessage');
        const confirmButton = document.getElementById('confirmDeleteShapes');

        if (!deleteModal || !deleteMessage || !confirmButton) {
            console.error('Delete modal elements not found');
            return;
        }

        // Update modal message with count
        const count = this.selectedShapes.size;
        deleteMessage.textContent = `Are you sure you want to delete ${count} selected shape${
            count > 1 ? 's' : ''
        }?`;

        // Create Bootstrap modal instance
        const modalInstance = new bootstrap.Modal(deleteModal);

        // Handle confirm button - use a named function so we can remove the listener
        const handleConfirm = () => {
            // Import dependencies
            import('../connections/connectionManager.js').then(({ deleteShapeConnections }) => {
                import('../services/storage.js').then(({ saveAppState }) => {
                    // Convert Set to array to avoid issues with modifying during iteration
                    const shapesToDelete = Array.from(this.selectedShapes);

                    shapesToDelete.forEach(shapeId => {
                        const shapeGroup = document.getElementById(shapeId);
                        if (shapeGroup) {
                            // Delete connections first
                            deleteShapeConnections(shapeGroup);

                            // Remove from DOM
                            shapeGroup.remove();
                        }
                    });

                    // Clear selection and save state
                    this.clearSelection();
                    saveAppState();

                    // Hide modal and remove listener
                    modalInstance.hide();
                    confirmButton.removeEventListener('click', handleConfirm);
                });
            });
        };

        // Attach event listener
        confirmButton.addEventListener('click', handleConfirm);

        // Clean up listener when modal is hidden via cancel or close button
        deleteModal.addEventListener(
            'hidden.bs.modal',
            () => {
                confirmButton.removeEventListener('click', handleConfirm);
            },
            { once: true }
        );

        // Show the modal
        modalInstance.show();
    }

    moveSelectedShapes(dx, dy) {
        this.selectedShapes.forEach(shapeId => {
            const shape = appState.shapes.get(shapeId);
            if (shape) {
                shape.x = parseFloat(shape.x) + dx;
                shape.y = parseFloat(shape.y) + dy;

                const shapeGroup = document.getElementById(shapeId);
                if (shapeGroup) {
                    shapeGroup.setAttribute('transform', `translate(${shape.x}, ${shape.y})`);
                }
            }
        });
    }

    getSelectedShapes() {
        return Array.from(this.selectedShapes);
    }
}
