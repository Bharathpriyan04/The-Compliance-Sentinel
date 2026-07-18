from backend.config.Apps import MainApp
from backend.apps.health.health import health
from backend.apps.analyze.analyze import analyze
from swarm_debug import debug
from fastapi.middleware.cors import CORSMiddleware

main_app = MainApp([health, analyze])
app = main_app.app

# Add CORS middleware - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import os
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=int(os.environ.get("BACKEND_PORT", 8324)), reload=True)
