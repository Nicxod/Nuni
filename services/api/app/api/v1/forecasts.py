from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.forecasting.engine import SupplyForecaster, DemandForecaster
from app.recommendations.engine import GapAnalysisService
from app.models.models import ForecastRun
from app.schemas.schemas import (
    ForecastRunRequest,
    ForecastRunResponse,
    GapAnalysisResponse,
)

router = APIRouter(prefix="/forecasts", tags=["Forecasting and Gap Analysis"])


@router.post("/supply/run", response_model=ForecastRunResponse)
def run_supply_forecast(req: ForecastRunRequest, db: Session = Depends(get_db)):
    forecaster = SupplyForecaster(db)
    run = forecaster.run(
        granularity=req.granularity,
        method_name=req.method_name or "auto",
        horizon_periods=req.horizon_periods,
    )
    return run


@router.post("/demand/run", response_model=ForecastRunResponse)
def run_demand_forecast(req: ForecastRunRequest, db: Session = Depends(get_db)):
    forecaster = DemandForecaster(db)
    run = forecaster.run(
        granularity=req.granularity,
        method_name=req.method_name or "auto",
        horizon_periods=req.horizon_periods,
    )
    return run


@router.get("/{forecast_type}/latest", response_model=ForecastRunResponse)
def get_latest_forecast(forecast_type: str, db: Session = Depends(get_db)):
    if forecast_type not in ["supply", "demand"]:
        raise HTTPException(status_code=400, detail="Tipe forecast harus 'supply' atau 'demand'.")

    run = (
        db.query(ForecastRun)
        .filter(ForecastRun.forecast_type == forecast_type)
        .order_by(ForecastRun.generated_at.desc())
        .first()
    )

    if not run:
        # Auto-run initial forecast if not exists
        if forecast_type == "supply":
            run = SupplyForecaster(db).run()
        else:
            run = DemandForecaster(db).run()

    return run


@router.get("/{forecast_type}/history", response_model=List[ForecastRunResponse])
def get_forecast_history(forecast_type: str, db: Session = Depends(get_db)):
    runs = (
        db.query(ForecastRun)
        .filter(ForecastRun.forecast_type == forecast_type)
        .order_by(ForecastRun.generated_at.desc())
        .limit(10)
        .all()
    )
    return runs


@router.get("/gap", response_model=GapAnalysisResponse)
def get_supply_demand_gap(db: Session = Depends(get_db)):
    service = GapAnalysisService(db)
    return service.calculate_gap()
