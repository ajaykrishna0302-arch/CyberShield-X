
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import Base, engine
from app import models

from app.routes.auth import router as auth_router, require_roles
from app.routes.vulnerabilities import router as vulnerabilities_router
from app.routes.scanner import router as scanner_router
from app.routes.assets import router as assets_router
from app.routes.web_security import router as web_security_router
from app.routes.ai_assistant import router as ai_assistant_router
from app.routes.dashboard import router as dashboard_router
from app.routes.support import router as support_router
from app.routes.encryption_lab import router as encryption_lab_router
from app.routes.academy import router as academy_router

from os_scanner import router as os_security_router


app = FastAPI(
    title="CyberShield X API",
    description="Ethical Hacking and Security Assessment Platform",
    version="1.0.0"
)

# CORS configuration

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://cybershield-x-three.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Public authentication
app.include_router(auth_router)
app.include_router(support_router)
app.include_router(encryption_lab_router)
app.include_router(academy_router)

# Admin and Learner access
app.include_router(
    scanner_router,
    dependencies=[Depends(require_roles("Admin", "Learner"))]
)

app.include_router(
    os_security_router,
    dependencies=[Depends(require_roles("Admin", "Learner"))]
)

app.include_router(
    ai_assistant_router,
    dependencies=[Depends(require_roles("Admin", "Learner"))]
)

# Admin-only access
app.include_router(
    vulnerabilities_router,
    dependencies=[Depends(require_roles("Admin"))]
)

app.include_router(
    dashboard_router,
    dependencies=[Depends(require_roles("Admin"))]
)

app.include_router(
    assets_router,
    dependencies=[Depends(require_roles("Admin"))]
)

app.include_router(
    web_security_router,
    dependencies=[Depends(require_roles("Admin"))]
)

# Create database tables
Base.metadata.create_all(bind=engine)
if "users" in inspect(engine).get_table_names():
    user_columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "academy_xp" not in user_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN academy_xp INTEGER NOT NULL DEFAULT 0"))
if "support_requests" in inspect(engine).get_table_names():
    columns = {column["name"] for column in inspect(engine).get_columns("support_requests")}
    if "is_read" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE support_requests ADD COLUMN is_read INTEGER NOT NULL DEFAULT 0"))


@app.get("/")
def home():
    return {
        "message": "Welcome to CyberShield X",
        "status": "Backend is running"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "application": "CyberShield X"
    }
