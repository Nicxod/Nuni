from decimal import Decimal
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.api.v1.reports import seed_system_data

# Use SQLite in-memory with StaticPool for fast standalone pytest runs
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    with TestingSessionLocal() as db:
        seed_system_data(db)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "SIMULASI" in data["data_notice"]


def test_auth_login_farmer():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "petani@cassavaflow.local", "password": "petanipassword123"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "farmer"


def test_get_crop_plans():
    res = client.get("/api/v1/crop-plans")
    assert res.status_code == 200
    plans = res.json()
    assert len(plans) > 0
    assert plans[0]["data_origin"] == "simulation"


def test_get_inventory_batches():
    res = client.get("/api/v1/inventory-batches")
    assert res.status_code == 200
    batches = res.json()
    assert len(batches) > 0
    assert batches[0]["data_origin"] == "simulation"


def test_forecast_supply_run():
    res = client.post("/api/v1/forecasts/supply/run", json={"granularity": "weekly", "horizon_periods": 6})
    assert res.status_code == 200
    data = res.json()
    assert data["forecast_type"] == "supply"
    assert len(data["points"]) == 6
    assert data["points"][0]["predicted_quantity_kg"] is not None


def test_forecast_demand_run():
    res = client.post("/api/v1/forecasts/demand/run", json={"granularity": "weekly", "horizon_periods": 6})
    assert res.status_code == 200
    data = res.json()
    assert data["forecast_type"] == "demand"
    assert len(data["points"]) == 6


def test_gap_analysis():
    res = client.get("/api/v1/forecasts/gap")
    assert res.status_code == 200
    data = res.json()
    assert "periods" in data
    assert len(data["periods"]) > 0
    assert data["data_origin"] == "simulation"
    assert data["periods"][0]["gap_status"] in ["surplus", "deficit", "balanced", "insufficient_data"]


def test_buyer_matching():
    res = client.get("/api/v1/buyer-matches")
    assert res.status_code == 200
    data = res.json()
    assert len(data["matches"]) > 0
    assert data["matches"][0]["score"] >= 0


def test_stock_recommendation_lifecycle():
    # 1. Get recommendations
    res = client.get("/api/v1/stock-recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) > 0
    pending_rec = next((r for r in recs if r["status"] == "pending"), None)
    assert pending_rec is not None

    # 2. Approve recommendation
    rec_id = pending_rec["id"]
    approve_res = client.post(
        f"/api/v1/stock-recommendations/{rec_id}/approve",
        json={"status": "approved", "review_notes": "Disetujui untuk tes integrasi"}
    )
    assert approve_res.status_code == 200
    approved_data = approve_res.json()
    assert approved_data["status"] == "approved"
