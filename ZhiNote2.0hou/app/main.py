from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router
from app.database import init_db
=======
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router
from app.database import init_db
import os
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57

init_db()

app = FastAPI(title="ZhiNote Multi-Agent Learning System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(agent_router, prefix="/api")
<<<<<<< HEAD

@app.get("/")
def root():
    return {"message": "ZhiNote Multi-Agent Learning System is running"}
=======

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def root():
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    return {"message": "ZhiNote Multi-Agent Learning System is running"}

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("static/"):
        raise HTTPException(status_code=404, detail="Not found")
    if os.path.exists("index.html"):
        return FileResponse("index.html")
    raise HTTPException(status_code=404, detail="Not found")
>>>>>>> 4f174552fdd0bf3d635780d8f0719457d5ed4a57
