/**
 * DOM element references
 */

export const elements = {
    // API elements
    testApiBtn: null,
    apiResponse: null,

    // Canvas elements
    topologyCanvas: null,
    canvasWrapper: null,
    zoomLevel: null,
    canvas: null,
    canvasInfo: null,
    pointerPosition: null,

    // Menu elements
    newTopologyBtn: null,
    exportBtn: null,
    exportPngBtn: null,
    importBtn: null,

    // Canvas controls (sidebar)
    zoomInBtn: null,
    zoomOutBtn: null,
    resetZoomBtn: null,
    clearCanvasBtn: null,

    // Canvas controls (floating)
    zoomInBtnFloating: null,
    zoomOutBtnFloating: null,
    resetZoomBtnFloating: null,

    // Connection elements
    addConnectionBtn: null,
    connectionLabelModal: null,
    sourceLabel: null,
    targetLabel: null,
    submitConnectionLabels: null,
    connectionLabelForm: null,

    // Shape overlay panel elements
    shapeOverlayPanel: null,
    closeOverlayPanel: null,
    shapeLabelText: null,
    shapeLabelPosition: null,
    shapeLabelColor: null,
    shapeLabelFontSize: null,
    shapeLabelBold: null,
    shapeLabelItalic: null,
    shapeLabelUnderline: null,
    startConnectionBtn: null,
    applyShapeChanges: null,

    // Connection overlay panel elements
    connectionOverlayPanel: null,
    closeConnectionPanel: null,
    connectionSourceLabel: null,
    connectionTargetLabel: null,
    connectionCenterLabel: null,
    connectionStrokeWidth: null,
    connectionStrokeColor: null,
    connectionStrokeStyle: null,
    connectionLabelColor: null,
    connectionLabelFontSize: null,
    applyConnectionChanges: null,
};

/**
 * Initialize all DOM element references
 */
export function initializeElements() {
    // API elements
    elements.testApiBtn = document.getElementById('testApiBtn');
    elements.apiResponse = document.getElementById('apiResponse');

    // Canvas elements
    elements.topologyCanvas = document.getElementById('topologyCanvas');
    elements.canvasWrapper = document.getElementById('canvasWrapper');
    elements.zoomLevel = document.getElementById('zoomLevel');
    elements.canvas = elements.topologyCanvas;
    elements.canvasInfo = document.getElementById('canvasInfo');
    elements.pointerPosition = document.getElementById('pointerPosition');

    // Menu elements
    elements.newTopologyBtn = document.getElementById('newTopologyBtn');
    elements.exportBtn = document.getElementById('exportBtn');
    elements.exportPngBtn = document.getElementById('exportPngBtn');
    elements.importBtn = document.getElementById('importBtn');

    // Canvas controls (sidebar)
    elements.zoomInBtn = document.getElementById('zoomInBtn');
    elements.zoomOutBtn = document.getElementById('zoomOutBtn');
    elements.resetZoomBtn = document.getElementById('resetZoomBtn');
    elements.clearCanvasBtn = document.getElementById('clearCanvasBtn');

    // Canvas controls (floating)
    elements.zoomInBtnFloating = document.getElementById('zoomInBtnFloating');
    elements.zoomOutBtnFloating = document.getElementById('zoomOutBtnFloating');
    elements.resetZoomBtnFloating = document.getElementById('resetZoomBtnFloating');

    // Connection elements
    elements.addConnectionBtn = document.getElementById('addConnectionBtn');
    elements.connectionLabelModal = document.getElementById('connectionLabelModal');
    elements.sourceLabel = document.getElementById('sourceLabel');
    elements.targetLabel = document.getElementById('targetLabel');
    elements.submitConnectionLabels = document.getElementById('submitConnectionLabels');
    elements.connectionLabelForm = document.getElementById('connectionLabelForm');

    // Shape overlay panel elements
    elements.shapeOverlayPanel = document.getElementById('shapeOverlayPanel');
    elements.closeOverlayPanel = document.getElementById('closeOverlayPanel');
    elements.shapeLabelText = document.getElementById('shapeLabelText');
    elements.shapeLabelPosition = document.getElementById('shapeLabelPosition');
    elements.shapeLabelColor = document.getElementById('shapeLabelColor');
    elements.shapeLabelFontSize = document.getElementById('shapeLabelFontSize');
    elements.shapeLabelBold = document.getElementById('shapeLabelBold');
    elements.shapeLabelItalic = document.getElementById('shapeLabelItalic');
    elements.shapeLabelUnderline = document.getElementById('shapeLabelUnderline');
    elements.startConnectionBtn = document.getElementById('startConnectionBtn');
    elements.applyShapeChanges = document.getElementById('applyShapeChanges');

    // Connection overlay panel elements
    elements.connectionOverlayPanel = document.getElementById('connectionOverlayPanel');
    elements.closeConnectionPanel = document.getElementById('closeConnectionPanel');
    elements.connectionSourceLabel = document.getElementById('connectionSourceLabel');
    elements.connectionTargetLabel = document.getElementById('connectionTargetLabel');
    elements.connectionCenterLabel = document.getElementById('connectionCenterLabel');
    elements.connectionStrokeWidth = document.getElementById('connectionStrokeWidth');
    elements.connectionStrokeColor = document.getElementById('connectionStrokeColor');
    elements.connectionStrokeStyle = document.getElementById('connectionStrokeStyle');
    elements.connectionLabelColor = document.getElementById('connectionLabelColor');
    elements.connectionLabelFontSize = document.getElementById('connectionLabelFontSize');
    elements.applyConnectionChanges = document.getElementById('applyConnectionChanges');
}
