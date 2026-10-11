from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Base Config
class SchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Auth & Users
class UserBase(SchemaBase):
    name: str
    email: str = Field(..., min_length=3)
    role: str = "farmer"  # admin, farmer, buyer, viewer
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginRequest(BaseModel):
    email: str
    password: str


# Farm
class FarmBase(SchemaBase):
    group_name: Optional[str] = None
    village: str = "Trawas"
    area_hectares: Decimal = Decimal("1.0")
    notes: Optional[str] = None


class FarmCreate(FarmBase):
    pass


class FarmResponse(FarmBase):
    id: str
    owner_user_id: str
    created_at: datetime
    updated_at: datetime


# Crop Plan
class CropPlanBase(SchemaBase):
    farm_id: str
    crop_name: str = "Singkong"
    variety: Optional[str] = "Gajah / Manggu"
    planting_date: Optional[date] = None
    expected_harvest_date: date
    area_hectares: Decimal = Decimal("0.5")
    expected_yield_kg: Optional[Decimal] = None
    status: str = "growing"  # planned, growing, ready_to_harvest, harvested, failed
    data_origin: str = "simulation"  # actual, manual_estimate, simulation
    notes: Optional[str] = None


class CropPlanCreate(CropPlanBase):
    pass


class CropPlanUpdate(SchemaBase):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    area_hectares: Optional[Decimal] = None
    expected_yield_kg: Optional[Decimal] = None
    status: Optional[str] = None
    data_origin: Optional[str] = None
    notes: Optional[str] = None


class CropPlanResponse(CropPlanBase):
    id: str
    created_at: datetime
    updated_at: datetime


# Harvest Record
class HarvestRecordBase(SchemaBase):
    farm_id: str
    crop_plan_id: Optional[str] = None
    harvest_date: date
    quantity_kg: Decimal = Field(..., ge=0)
    quality_grade: Optional[str] = "A"
    rejected_quantity_kg: Decimal = Field(default=Decimal("0.0"), ge=0)
    data_origin: str = "simulation"
    notes: Optional[str] = None


class HarvestRecordCreate(HarvestRecordBase):
    pass


class HarvestRecordResponse(HarvestRecordBase):
    id: str
    created_at: datetime
    updated_at: datetime


# Inventory Batch
class InventoryBatchBase(SchemaBase):
    farm_id: str
    harvest_record_id: Optional[str] = None
    batch_code: str
    harvest_date: date
    initial_quantity_kg: Decimal = Field(..., ge=0)
    available_quantity_kg: Decimal = Field(..., ge=0)
    reserved_quantity_kg: Decimal = Field(default=Decimal("0.0"), ge=0)
    quality_grade: Optional[str] = "A"
    condition_notes: Optional[str] = None
    status: str = "available"  # available, ordered, allocated, processing, sold, spoiled, discarded
    handling_deadline: Optional[date] = None
    data_origin: str = "simulation"


class InventoryBatchCreate(InventoryBatchBase):
    pass


class InventoryBatchUpdate(SchemaBase):
    available_quantity_kg: Optional[Decimal] = Field(default=None, ge=0)
    reserved_quantity_kg: Optional[Decimal] = Field(default=None, ge=0)
    condition_notes: Optional[str] = None
    status: Optional[str] = None
    handling_deadline: Optional[date] = None


class InventoryBatchResponse(InventoryBatchBase):
    id: str
    created_at: datetime
    updated_at: datetime


# Buyer & Buyer Needs
class BuyerBase(SchemaBase):
    business_name: str
    buyer_category: str = "umkm_chips"
    village_or_area: str = "Trawas"
    contact_phone: Optional[str] = None
    max_quantity_kg: Optional[Decimal] = None
    preferred_grade: Optional[str] = "A"
    lead_time_days: Optional[int] = 2
    is_verified: bool = True
    status: str = "active"


class BuyerCreate(BuyerBase):
    user_id: Optional[str] = None


class BuyerResponse(BuyerBase):
    id: str
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime


class BuyerNeedBase(SchemaBase):
    buyer_id: str
    needed_from: date
    needed_until: date
    quantity_kg: Decimal = Field(..., ge=0)
    minimum_grade: Optional[str] = "A"
    target_price_per_kg: Optional[Decimal] = None
    status: str = "planned"  # planned, confirmed, cancelled, fulfilled
    data_origin: str = "simulation"


class BuyerNeedCreate(BuyerNeedBase):
    pass


class BuyerNeedResponse(BuyerNeedBase):
    id: str
    created_at: datetime
    updated_at: datetime
    buyer_name: Optional[str] = None


# Transactions
class TransactionBase(SchemaBase):
    buyer_id: str
    farmer_id: Optional[str] = None
    transaction_date: date
    order_date: date
    fulfilled_date: Optional[date] = None
    quantity_ordered_kg: Decimal = Field(..., ge=0)
    quantity_fulfilled_kg: Decimal = Field(default=Decimal("0.0"), ge=0)
    unit_price: Decimal = Field(default=Decimal("2500.0"), ge=0)
    delivery_cost: Optional[Decimal] = Decimal("0.0")
    status: str = "confirmed"  # draft, confirmed, fulfilled, cancelled, rejected
    data_origin: str = "simulation"
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(SchemaBase):
    status: Optional[str] = None
    fulfilled_date: Optional[date] = None
    quantity_fulfilled_kg: Optional[Decimal] = Field(default=None, ge=0)
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: str
    total_amount: Decimal = Decimal("0.0")
    created_at: datetime
    updated_at: datetime
    buyer_name: Optional[str] = None


# Allocations
class TransactionAllocationBase(SchemaBase):
    transaction_id: str
    inventory_batch_id: str
    allocated_quantity_kg: Decimal = Field(..., ge=0)


class TransactionAllocationCreate(TransactionAllocationBase):
    pass


class TransactionAllocationResponse(TransactionAllocationBase):
    id: str
    created_at: datetime
    updated_at: datetime


# Forecasts
class ForecastRunRequest(BaseModel):
    granularity: str = "weekly"  # weekly, monthly
    method_name: Optional[str] = "auto"  # auto, naive, moving_average, seasonal_naive, linear_trend_crop_calendar
    horizon_periods: int = 8  # 8 periods ahead


class ForecastPointResponse(SchemaBase):
    id: str
    period_start: date
    period_end: date
    predicted_quantity_kg: Decimal
    lower_bound_kg: Optional[Decimal] = None
    upper_bound_kg: Optional[Decimal] = None
    actual_quantity_kg: Optional[Decimal] = None
    baseline_quantity_kg: Optional[Decimal] = None


class ForecastRunResponse(SchemaBase):
    id: str
    forecast_type: str
    period_start: date
    period_end: date
    granularity: str
    method_name: str
    model_version: str
    generated_at: datetime
    observations_count: int
    metrics_json: Optional[Dict[str, Any]] = None
    quality_status: str  # reliable, low_confidence, insufficient_data
    notes: Optional[str] = None
    points: List[ForecastPointResponse] = []


# Supply-Demand Gap
class GapPeriodPoint(BaseModel):
    period_start: date
    period_end: date
    period_label: str
    usable_stock_kg: Decimal
    forecast_harvest_kg: Decimal
    confirmed_orders_kg: Decimal
    forecast_demand_kg: Decimal
    projected_available_supply_kg: Decimal
    projected_gap_kg: Decimal
    gap_status: str  # surplus, deficit, balanced, insufficient_data
    notes: str


class GapAnalysisResponse(BaseModel):
    total_usable_stock_kg: Decimal
    total_forecast_harvest_kg: Decimal
    total_confirmed_orders_kg: Decimal
    total_forecast_demand_kg: Decimal
    overall_net_gap_kg: Decimal
    periods: List[GapPeriodPoint]
    surplus_periods_count: int
    deficit_periods_count: int
    data_origin: str = "simulation"
    generated_at: datetime


# Processing Options & Calculator
class ProcessingOptionBase(SchemaBase):
    name: str
    description: Optional[str] = None
    input_unit: str = "kg"
    output_unit: str = "kg"
    yield_ratio: Decimal = Decimal("0.35")
    capacity_kg_per_day: Decimal = Decimal("500.0")
    labor_cost: Decimal = Decimal("500.0")
    energy_cost: Decimal = Decimal("300.0")
    packaging_cost: Decimal = Decimal("400.0")
    distribution_cost: Decimal = Decimal("200.0")
    other_cost: Decimal = Decimal("100.0")
    expected_selling_price_per_unit: Decimal = Decimal("18000.0")
    food_safety_sop_reference: Optional[str] = "SOP-TRAWAS-OLAH-01"
    is_active: bool = True


class ProcessingOptionCreate(ProcessingOptionBase):
    pass


class ProcessingOptionResponse(ProcessingOptionBase):
    id: str
    created_at: datetime
    updated_at: datetime


class ProcessingCalculationRequest(BaseModel):
    processing_option_id: Optional[str] = None
    input_raw_cassava_kg: Decimal = Field(..., gt=0)
    raw_cassava_price_per_kg: Decimal = Field(default=Decimal("2500.0"), ge=0)
    yield_ratio: Optional[Decimal] = None
    expected_selling_price_per_unit: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    energy_cost: Optional[Decimal] = None
    packaging_cost: Optional[Decimal] = None
    distribution_cost: Optional[Decimal] = None
    other_cost: Optional[Decimal] = None


class ProcessingCalculationResponse(BaseModel):
    input_raw_cassava_kg: Decimal
    raw_material_cost: Decimal
    yield_ratio: Decimal
    output_finished_quantity: Decimal
    output_unit: str
    
    total_processing_cost: Decimal
    labor_cost_total: Decimal
    energy_cost_total: Decimal
    packaging_cost_total: Decimal
    distribution_cost_total: Decimal
    other_cost_total: Decimal
    
    total_combined_cost: Decimal  # raw material + processing costs
    unit_cost_per_finished_unit: Decimal
    
    expected_selling_price_per_unit: Decimal
    gross_revenue: Decimal
    estimated_contribution_margin: Decimal
    margin_percentage: Decimal
    
    raw_sale_revenue_comparison: Decimal  # if sold raw
    raw_sale_margin_advantage: Decimal  # difference
    break_even_volume_kg: Optional[Decimal] = None
    disclaimer: str


# Stock Recommendations
class StockRecommendationBase(SchemaBase):
    recommendation_type: str  # sell, allocate, process, preserve, find_buyer, procure
    batch_id: Optional[str] = None
    period_start: date
    period_end: date
    quantity_kg: Optional[Decimal] = None
    reason: str
    assumptions_json: Optional[Dict[str, Any]] = None
    estimated_cost: Optional[Decimal] = None
    estimated_value: Optional[Decimal] = None
    status: str = "pending"  # pending, approved, rejected, completed, expired


class StockRecommendationResponse(StockRecommendationBase):
    id: str
    batch_code: Optional[str] = None
    created_by_system_at: datetime
    reviewed_by_user_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class StockRecommendationReview(BaseModel):
    status: str  # approved, rejected, completed
    review_notes: Optional[str] = None
    approved_quantity_kg: Optional[Decimal] = None


# Buyer Matching (P1)
class BuyerMatchItem(BaseModel):
    buyer_id: str
    business_name: str
    buyer_category: str
    village_or_area: str
    score: int  # 0 to 100
    matched_reasons: List[str]
    volume_match_pct: float
    target_price_per_kg: Optional[Decimal] = None
    contact_phone: Optional[str] = None


class BuyerMatchingResponse(BaseModel):
    batch_id: Optional[str]
    available_kg: Decimal
    quality_grade: Optional[str]
    matches: List[BuyerMatchItem]


# CSV Import
class CSVImportResult(BaseModel):
    total_rows: int
    successful_rows: int
    failed_rows: int
    errors: List[str] = []
    message: str


# Summary Reports
class SummaryReportResponse(BaseModel):
    total_farms: int
    total_crop_plans_active: int
    total_inventory_available_kg: Decimal
    total_urgent_batches_kg: Decimal
    total_confirmed_orders_kg: Decimal
    total_demand_forecast_kg: Decimal
    projected_gap_kg: Decimal
    active_recommendations_count: int
    registered_buyers_count: int
    data_origin_notice: str = "Semua data bertanda SIMULASI untuk verifikasi percontohan Trawas"
    generated_at: datetime
