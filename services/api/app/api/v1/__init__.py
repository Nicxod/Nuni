from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.farms import router as farms_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.buyers import router as buyers_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.forecasts import router as forecasts_router
from app.api.v1.recommendations import router as recommendations_router
from app.api.v1.reports import router as reports_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(farms_router)
api_router.include_router(inventory_router)
api_router.include_router(buyers_router)
api_router.include_router(transactions_router)
api_router.include_router(forecasts_router)
api_router.include_router(recommendations_router)
api_router.include_router(reports_router)
