from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Topology Builder API", version="1.0.0")

# CORS configuration - Allow frontend from any localhost port for development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Mount static files from frontend build
# Path to the frontend dist directory - works both locally and in Docker
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
static_dir = Path(__file__).parent / "static"  # Docker path

# Try Docker static directory first, fallback to local dev path
if static_dir.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(static_dir)),
        name="static",
    )
    frontend_dist = static_dir
elif frontend_dist.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(frontend_dist)),
        name="static",
    )


# Models
class HealthResponse(BaseModel):
    status: str
    message: str


class TopologyNode(BaseModel):
    id: str
    name: str
    type: str
    x: Optional[float] = 0
    y: Optional[float] = 0


# Routes
@app.get("/")
async def root():
    """Serve the main application HTML"""
    index_path = frontend_dist / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Welcome to Topology Builder API"}


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", message="API is running successfully!")


@app.get("/api/nodes")
async def get_nodes():
    # Example nodes - replace with actual data
    return {
        "nodes": [
            {
                "id": "1",
                "name": "Node 1",
                "type": "server",
                "x": 100,
                "y": 100,
            },
            {
                "id": "2",
                "name": "Node 2",
                "type": "router",
                "x": 300,
                "y": 200,
            },
        ]
    }


@app.post("/api/nodes", response_model=TopologyNode)
async def create_node(node: TopologyNode):
    # Add logic to save node
    return node


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
