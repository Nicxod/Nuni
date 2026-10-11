import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Date,
    Numeric,
    Integer,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="farmer")  # admin, farmer, buyer, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farms = relationship("Farm", back_populates="owner")
    buyers = relationship("Buyer", back_populates="user")


class Farm(Base):
    __tablename__ = "farms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    group_name = Column(String(255), nullable=True)  # e.g., Kelompok Tani Makmur Trawas
    village = Column(String(100), nullable=False, default="Trawas")
    area_hectares = Column(Numeric(10, 2), nullable=False, default=1.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    owner = relationship("User", back_populates="farms")
    crop_plans = relationship("CropPlan", back_populates="farm")
    harvest_records = relationship("HarvestRecord", back_populates="farm")
    inventory_batches = relationship("InventoryBatch", back_populates="farm")


class CropPlan(Base):
    __tablename__ = "crop_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    crop_name = Column(String(100), nullable=False, default="Singkong")
    variety = Column(String(100), nullable=True, default="Gajah / Manggu")
    planting_date = Column(Date, nullable=True)
    expected_harvest_date = Column(Date, nullable=False)
    area_hectares = Column(Numeric(10, 2), nullable=False, default=0.5)
    expected_yield_kg = Column(Numeric(12, 2), nullable=True)
    status = Column(String(50), nullable=False, default="growing")  # planned, growing, ready_to_harvest, harvested, failed
    data_origin = Column(String(50), nullable=False, default="simulation")  # actual, manual_estimate, simulation
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="crop_plans")
    harvest_records = relationship("HarvestRecord", back_populates="crop_plan")


class HarvestRecord(Base):
    __tablename__ = "harvest_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    crop_plan_id = Column(String(36), ForeignKey("crop_plans.id"), nullable=True)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    harvest_date = Column(Date, nullable=False)
    quantity_kg = Column(Numeric(12, 2), nullable=False)
    quality_grade = Column(String(20), nullable=True, default="A")  # Super, A, B, C
    rejected_quantity_kg = Column(Numeric(12, 2), nullable=False, default=Decimal("0.0"))
    data_origin = Column(String(50), nullable=False, default="simulation")  # actual, manual_estimate, simulation
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="harvest_records")
    crop_plan = relationship("CropPlan", back_populates="harvest_records")
    inventory_batches = relationship("InventoryBatch", back_populates="harvest_record")


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    farm_id = Column(String(36), ForeignKey("farms.id"), nullable=False)
    harvest_record_id = Column(String(36), ForeignKey("harvest_records.id"), nullable=True)
    batch_code = Column(String(100), unique=True, index=True, nullable=False)
    harvest_date = Column(Date, nullable=False)
    initial_quantity_kg = Column(Numeric(12, 2), nullable=False)
    available_quantity_kg = Column(Numeric(12, 2), nullable=False)
    reserved_quantity_kg = Column(Numeric(12, 2), nullable=False, default=Decimal("0.0"))
    quality_grade = Column(String(20), nullable=True, default="A")
    condition_notes = Column(String(255), nullable=True)  # Segar baru panen, kulit bersih, dsb.
    status = Column(String(50), nullable=False, default="available")  # available, ordered, allocated, processing, sold, spoiled, discarded
    handling_deadline = Column(Date, nullable=True)  # Derived from local SOP (e.g. 3-4 days after harvest for fresh cassava)
    data_origin = Column(String(50), nullable=False, default="simulation")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="inventory_batches")
    harvest_record = relationship("HarvestRecord", back_populates="inventory_batches")
    allocations = relationship("TransactionAllocation", back_populates="batch")
    recommendations = relationship("StockRecommendation", back_populates="batch")


class Buyer(Base):
    __tablename__ = "buyers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    business_name = Column(String(255), nullable=False)
    buyer_category = Column(String(100), nullable=False, default="umkm_chips")  # umkm_chips, tapioca_factory, fresh_market, animal_feed, other
    village_or_area = Column(String(100), nullable=False, default="Trawas")
    contact_phone = Column(String(50), nullable=True)
    max_quantity_kg = Column(Numeric(12, 2), nullable=True)
    preferred_grade = Column(String(20), nullable=True, default="A")
    lead_time_days = Column(Integer, nullable=True, default=2)
    is_verified = Column(Boolean, default=True, nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="buyers")
    needs = relationship("BuyerNeed", back_populates="buyer")
    transactions = relationship("Transaction", back_populates="buyer")


class BuyerNeed(Base):
    __tablename__ = "buyer_needs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    buyer_id = Column(String(36), ForeignKey("buyers.id"), nullable=False)
    needed_from = Column(Date, nullable=False)
    needed_until = Column(Date, nullable=False)
    quantity_kg = Column(Numeric(12, 2), nullable=False)
    minimum_grade = Column(String(20), nullable=True, default="A")
    target_price_per_kg = Column(Numeric(12, 2), nullable=True)
    status = Column(String(50), nullable=False, default="planned")  # planned, confirmed, cancelled, fulfilled
    data_origin = Column(String(50), nullable=False, default="simulation")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    buyer = relationship("Buyer", back_populates="needs")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    buyer_id = Column(String(36), ForeignKey("buyers.id"), nullable=False)
    farmer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    transaction_date = Column(Date, nullable=False)
    order_date = Column(Date, nullable=False)
    fulfilled_date = Column(Date, nullable=True)
    quantity_ordered_kg = Column(Numeric(12, 2), nullable=False)
    quantity_fulfilled_kg = Column(Numeric(12, 2), nullable=False, default=Decimal("0.0"))
    unit_price = Column(Numeric(12, 2), nullable=False, default=Decimal("2500.0"))  # IDR per kg
    delivery_cost = Column(Numeric(12, 2), nullable=True, default=Decimal("0.0"))
    status = Column(String(50), nullable=False, default="confirmed")  # draft, confirmed, fulfilled, cancelled, rejected
    data_origin = Column(String(50), nullable=False, default="simulation")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    buyer = relationship("Buyer", back_populates="transactions")
    allocations = relationship("TransactionAllocation", back_populates="transaction")


class TransactionAllocation(Base):
    __tablename__ = "transaction_allocations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    inventory_batch_id = Column(String(36), ForeignKey("inventory_batches.id"), nullable=False)
    allocated_quantity_kg = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    transaction = relationship("Transaction", back_populates="allocations")
    batch = relationship("InventoryBatch", back_populates="allocations")


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    location_label = Column(String(100), nullable=False, default="Trawas")
    observation_date = Column(Date, nullable=False)
    rainfall_mm = Column(Numeric(8, 2), nullable=True)
    source_name = Column(String(100), nullable=False, default="BMKG Simulasi")
    source_updated_at = Column(DateTime(timezone=True), nullable=True)
    data_origin = Column(String(50), nullable=False, default="simulation")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_type = Column(String(50), nullable=False)  # supply, demand
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    granularity = Column(String(50), nullable=False, default="weekly")  # weekly, monthly
    method_name = Column(String(100), nullable=False)  # naive, moving_average, seasonal_naive, linear_trend_crop_calendar
    model_version = Column(String(50), nullable=False, default="1.0.0")
    generated_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    observations_count = Column(Integer, nullable=False, default=0)
    metrics_json = Column(JSON, nullable=True)  # {"mae": 150.5, "rmse": 210.2, "wape": 0.08}
    quality_status = Column(String(50), nullable=False, default="reliable")  # reliable, low_confidence, insufficient_data
    input_snapshot_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)

    points = relationship("ForecastPoint", back_populates="forecast_run", cascade="all, delete-orphan")


class ForecastPoint(Base):
    __tablename__ = "forecast_points"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    forecast_run_id = Column(String(36), ForeignKey("forecast_runs.id"), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    predicted_quantity_kg = Column(Numeric(12, 2), nullable=False)
    lower_bound_kg = Column(Numeric(12, 2), nullable=True)
    upper_bound_kg = Column(Numeric(12, 2), nullable=True)
    actual_quantity_kg = Column(Numeric(12, 2), nullable=True)
    baseline_quantity_kg = Column(Numeric(12, 2), nullable=True)

    forecast_run = relationship("ForecastRun", back_populates="points")


class ProcessingOption(Base):
    __tablename__ = "processing_options"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    input_unit = Column(String(50), nullable=False, default="kg")
    output_unit = Column(String(50), nullable=False, default="kg")
    yield_ratio = Column(Numeric(6, 4), nullable=True, default=Decimal("0.35"))  # rendemen e.g. 0.35 = 35%
    capacity_kg_per_day = Column(Numeric(12, 2), nullable=True, default=Decimal("500.0"))
    labor_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("500.0"))  # per kg raw material
    energy_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("300.0"))
    packaging_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("400.0"))
    distribution_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("200.0"))
    other_cost = Column(Numeric(12, 2), nullable=False, default=Decimal("100.0"))
    expected_selling_price_per_unit = Column(Numeric(12, 2), nullable=False, default=Decimal("18000.0"))
    food_safety_sop_reference = Column(String(255), nullable=True, default="SOP-TRAWAS-OLAH-01")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class StockRecommendation(Base):
    __tablename__ = "stock_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recommendation_type = Column(String(50), nullable=False)  # sell, allocate, process, preserve, find_buyer, procure
    batch_id = Column(String(36), ForeignKey("inventory_batches.id"), nullable=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    quantity_kg = Column(Numeric(12, 2), nullable=True)
    reason = Column(Text, nullable=False)
    assumptions_json = Column(JSON, nullable=True)
    estimated_cost = Column(Numeric(12, 2), nullable=True)
    estimated_value = Column(Numeric(12, 2), nullable=True)
    status = Column(String(50), nullable=False, default="pending")  # pending, approved, rejected, completed, expired
    created_by_system_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    reviewed_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    batch = relationship("InventoryBatch", back_populates="recommendations")
    reviewer = relationship("User", foreign_keys=[reviewed_by_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    before_json = Column(JSON, nullable=True)
    after_json = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
