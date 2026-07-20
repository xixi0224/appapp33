from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router
from app.database import init_db

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

@app.get("/")
def root():
    return {"message": "ZhiNote Multi-Agent Learning System is running"}
