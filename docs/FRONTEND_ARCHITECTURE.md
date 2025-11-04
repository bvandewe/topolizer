# Frontend Architecture

## Overview

The Topology Builder frontend has been modularized using Jinja2 templates and Parcel bundler. This architecture provides better maintainability, prepares for server-side rendering, and sets the foundation for OAuth integration.

## Architecture Components

### Template Structure

```
frontend/src/templates/
├── index.jinja                 # Main template (entry point)
└── partials/
    ├── head.jinja              # HTML head with meta tags and imports
    ├── navbar.jinja            # Navigation bar
    ├── sidebar.jinja           # Shape tools sidebar
    ├── canvas.jinja            # Topology canvas and controls
    ├── footer.jinja            # Status bar footer
    ├── panels.jinja            # Shape and connection overlay panels
    └── modals.jinja            # Modal dialogs
```

### Build Process

1. **Template Rendering** (`build-template.js`)
   - Nunjucks processes Jinja2 templates
   - Includes partials into base template
   - Outputs to `src/index.html`

2. **Parcel Bundling**
   - Processes HTML, SCSS, and JavaScript
   - Bundles dependencies
   - Optimizes and minifies assets
   - Outputs to `dist/` with `/static/` public URL

3. **Backend Serving**
   - FastAPI serves static files from `dist/`
   - Root route (`/`) serves `index.html`
   - Static assets served at `/static/*`

## NPM Scripts

### Development

```bash
npm run render      # Render templates only
npm run dev         # Render + dev server (frontend only)
npm run watch       # Render + watch mode (for backend integration)
```

### Production

```bash
npm run build       # Full production build
```

The `prebuild` and `predev` hooks automatically render templates before building.

## Backend Integration

### Static Files

The backend (`backend/main.py`) is configured to:

1. Mount static files at `/static/`
2. Serve `index.html` at root (`/`)
3. Provide API endpoints at `/api/*`

### Starting the Application

**Option 1: Integrated Server (Recommended)**

```bash
# From project root
./start-server.sh
```

This builds the frontend and starts the backend server.

**Option 2: Separate Processes (Development)**

Terminal 1 - Frontend build watch:

```bash
cd frontend
npm run watch
```

Terminal 2 - Backend server:

```bash
cd backend
poetry run python main.py
```

Then access the application at: `http://localhost:8000`

**Option 3: Frontend Only**

```bash
cd frontend
npm run dev
```

This starts Parcel's dev server (useful for frontend-only development).

## File Locations

- **Source Templates**: `frontend/src/templates/`
- **Generated HTML**: `frontend/src/index.html` (temporary, for Parcel)
- **Build Output**: `frontend/dist/` (served by backend)
- **Backend**: `backend/main.py`

## Template Syntax

Templates use Jinja2/Nunjucks syntax:

```jinja
{# Comments #}
{{ variable }}                  <!-- Output variable -->
{% include 'partial.jinja' %}   <!-- Include partial -->
{{ var | default('value') }}    <!-- Filter with default -->
```

## Adding New Templates

1. Create new template in `frontend/src/templates/partials/`
2. Include it in `index.jinja`:

   ```jinja
   {% include 'partials/your-template.jinja' %}
   ```

3. Run `npm run render` to regenerate HTML
4. Build: `npm run build`

## OAuth Preparation

The modular template structure is prepared for OAuth:

1. **Authentication UI**: Add `auth.jinja` partial with login/logout UI
2. **Protected Routes**: Backend can check authentication before serving pages
3. **User Context**: Pass user data to templates during render
4. **Session Management**: Backend handles OAuth flow and session cookies

Example for OAuth integration:

```python
# backend/main.py
@app.get("/")
async def root(request: Request):
    user = get_current_user(request)  # Check authentication
    if not user:
        return RedirectResponse("/login")
    return templates.TemplateResponse("index.jinja", {
        "request": request,
        "user": user
    })
```

## Advantages

1. **Modularity**: Separate concerns into reusable components
2. **Maintainability**: Smaller, focused template files
3. **Server-Side Rendering**: Backend can inject data during render
4. **OAuth Ready**: Authentication state can be server-rendered
5. **SEO Friendly**: Fully rendered HTML for search engines
6. **Build Optimization**: Parcel handles asset bundling and optimization

## Development Tips

- Keep templates in `templates/partials/` for organization
- Run `npm run render` after template changes
- Use `npm run watch` during backend development
- Check `dist/index.html` to verify build output
- Backend must be restarted to pick up new frontend builds
