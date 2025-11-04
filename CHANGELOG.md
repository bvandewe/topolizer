# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-11-04

### Added

- Initial release of Topology Builder application
- **Frontend Architecture**
  - Modular Jinja2 template system with component partials
  - Parcel bundler for asset optimization
  - Backend serves frontend static files
  - Prepared foundation for OAuth authentication
  - Template-based rendering pipeline
- **Development Tools**
  - Pre-commit hooks for automatic code formatting and quality checks
  - VS Code workspace configuration with format-on-save
  - EditorConfig for consistent editor settings
  - Poetry for Python dependency management
  - Prettier for JavaScript/HTML/CSS formatting
  - Black for Python formatting
  - markdownlint for Markdown linting
  - Nunjucks for Jinja2 template processing
- **Documentation**
  - Comprehensive README with usage guide
  - Frontend architecture documentation
  - VS Code setup documentation
  - Pre-commit setup guide
  - MIT License
  - Changelog following Keep a Changelog format
- **Shape Management**
  - Support for basic shapes (circle, rectangle, ellipse)
  - Cisco network device shapes (L2 Switch, L3 Switch, Access Point, Firewall, Router, Workstation, Printer, Server)
  - Drag-and-drop shape creation from sidebar
  - Shape selection with visual feedback
  - Shape dragging and repositioning
  - Shape resizing with corner handles
  - Shape deletion (Delete/Backspace key support for macOS)
  - Interactive shape circle with quick actions (edit label, delete, add connection)
  - Dynamic shape interaction circle that scales with shape size
  - Shape duplication - Create copies of shapes with one click
  - Z-index control - Move shapes to front or back
  - Shape styling - Customize fill color, border color, and border width
- **Label System**
  - **NEW: Smart label positioning** - Labels for basic shapes added as sibling SVG elements
  - **NEW: Label persistence during drag** - Labels move with shapes automatically
  - **NEW: Multiple label positions** - Position labels above, below, left, right, or center of shapes
  - **NEW: Label customization** - Customize label text, color, and font size
  - **NEW: Label visibility** - Labels properly rendered and positioned for all shape types
- **Selection Mode**
  - Multi-select with rectangle drag - Select multiple shapes at once
  - **NEW: Visual selection feedback** - Selected shapes highlighted with blue glow
  - **NEW: Batch operations** - Delete multiple selected shapes
  - **NEW: Toggle button** - Selection mode button in canvas controls
  - **NEW: Keyboard shortcut** - Press 'V' to toggle selection mode
  - **NEW: Multi-shape alignment** - Align multiple shapes horizontally (left, center, right) or vertically (top, middle, bottom)
  - **NEW: Multi-shape distribution** - Distribute shapes evenly with horizontal or vertical spacing
  - **NEW: Floating alignment toolbar** - Shows when 2+ shapes are selected with quick access to alignment tools
- **Connection Management**
  - Visual connection creation between shapes
  - Connection lines with automatic routing to closest points between shapes
  - Connection labels (source, target, and center)
  - Draggable connection labels with circular constraint around shapes
  - Connection line style options (solid, dashed, dotted)
  - Connection details modal for editing labels and styles
  - Connection deletion
  - **NEW: Clickable connection hit targets** - Added 12px transparent hit areas around connection lines for easier clicking
- **Canvas Features**
  - Infinite canvas with grid background
  - Zoom in/out functionality (25% to 400%)
  - Pan/scroll navigation
  - Grid snapping for precise shape placement
- **Data Persistence**
  - Automatic save to browser localStorage
  - Topology state preservation (shapes, connections, labels)
  - Zoom level and scroll position persistence
  - Export topology to JSON file
  - Import topology from JSON file
  - Label positions and constraint metadata persistence
- **User Interface**
  - Clean, modern Bootstrap-based interface
  - Responsive sidebar with collapsible sections
  - Keyboard shortcuts (Enter, Escape) for modal interactions
  - Auto-focus on modal inputs for better UX
  - Visual feedback for all interactive elements
- **Deployment & CI/CD**
  - **NEW: Docker single-container deployment** - FastAPI serves both frontend and API on port 8000
  - **NEW: Docker Compose configuration** - Quick start with `docker-compose up`
  - **NEW: Helm chart for Kubernetes** - Full Kubernetes deployment with ingress, service, and deployment templates
  - **NEW: GitHub Actions workflow** - Automated Docker image building and publishing to GitHub Container Registry
  - **NEW: Multi-platform support** - Docker images for linux/amd64 and linux/arm64
  - **NEW: Comprehensive deployment documentation** - Complete guide for Docker and Kubernetes deployments
  - Organized deployment artifacts in `./deployment/` directory (docker/ and helm/ subdirectories)
  - Visual feedback for all interactive elements

### Fixed

- Shape bounds calculation for SVG group elements (Cisco shapes)
- Interaction circle positioning and dynamic scaling
- Connection label text selection during drag operations
- Connection center label persistence across sessions
- Connection line style (solid/dashed/dotted) persistence
- Label editing race condition that caused DOM errors
- Label constraint circle positioning after shape movement
- Label position persistence after dragging along constraint circle
- Label IDs not being set during restore, causing labels to disappear
- Constraint center metadata not being saved to localStorage
- Browser text selection highlighting during label drag
- **NEW: Duplicate interaction circles** - Fixed issue where interaction circle appeared 4 times
- **NEW: Event listener accumulation** - Implemented AbortController pattern to prevent duplicate event listeners
- **NEW: Shape selection timing** - Prevented duplicate selectShape calls from mousedown and click events
- **NEW: Label positioning** - Fixed label positioning for all shape types (basic shapes, Cisco shapes, groups)
- **NEW: macOS delete key** - Added support for Backspace key on macOS in addition to Delete key
- **NEW: Bootstrap tooltip initialization** - Fixed tooltip timing to ensure they appear on floating buttons
- **NEW: Delete key during text input** - Fixed keyboard shortcuts to not trigger when typing in input fields or textareas
- **NEW: Connection line selection** - Fixed click handlers for connection hit targets to properly select connections
- **NEW: Pointer events on hit targets** - Added explicit pointer-events:auto to connection hit targets for clickability

### Changed

- Optimized interaction circle updates to occur on mouseup instead of mousemove for better performance
- Updated favicon to match navigation brand icon (bi-diagram-3)
- Disabled inline label editing in favor of Connection Details modal
- Enhanced CSS selection prevention for draggable labels
- Improved label restoration logic to use saved constraint metadata
- **NEW: Label architecture** - Simplified label system for basic shapes using sibling elements instead of group conversion
- **NEW: Event listener management** - All shape event listeners now use AbortController for clean removal
- **NEW: Shape drag behavior** - Removed redundant selectShape call from click handler since mousedown already handles selection
- **NEW: Deployment architecture** - Simplified from nginx+supervisor to single FastAPI process serving both frontend and API
- **NEW: File organization** - Moved all deployment artifacts to organized `./deployment/` directory structure

### Technical

- Frontend: Vanilla JavaScript (ES6 modules)
- Styling: SCSS with Bootstrap 5.3
- Storage: Browser localStorage with JSON serialization
- Build: Live Server for development
- Architecture: Modular structure with separation of concerns (state, UI, services, shapes, connections)
