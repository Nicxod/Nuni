from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1 import api_router
from app.db.session import engine, Base, SessionLocal
from app.api.v1.reports import seed_system_data
from app.models.models import User


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    try:
        Base.metadata.create_all(bind=engine)
        # Check if database needs seeding
        with SessionLocal() as db:
            if db.query(User).count() == 0:
                print("Database kosong. Menjalankan auto-seeder data simulasi Trawas...")
                seed_system_data(db)
                print("Auto-seeder selesai.")
    except Exception as e:
        print(f"Warning on startup DB init: {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Sistem AI Peramalan Pasokan, Permintaan Pasar, dan Perencanaan Cerdas Stok Singkong Trawas",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local docker compose
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "data_notice": "Semua data berstatus SIMULASI untuk verifikasi percontohan Trawas",
    }


# Include API v1 Routes
app.include_router(api_router, prefix=settings.API_PREFIX)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Terjadi kesalahan internal pada server.", "error": str(exc)},
    )
