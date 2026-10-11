from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user_optional
from app.models.models import Farm, CropPlan, HarvestRecord, InventoryBatch, User
from app.schemas.schemas import (
    FarmCreate,
    FarmResponse,
    CropPlanCreate,
    CropPlanUpdate,
    CropPlanResponse,
    HarvestRecordCreate,
    HarvestRecordResponse,
)

router = APIRouter(tags=["Harvest and Crop Plans"])


# Farms
@router.get("/farms", response_model=List[FarmResponse])
def get_farms(db: Session = Depends(get_db)):
    farms = db.query(Farm).all()
    return farms


@router.post("/farms", response_model=FarmResponse)
def create_farm(farm_in: FarmCreate, db: Session = Depends(get_db)):
    # Fallback to first user or admin if unauthenticated
    first_user = db.query(User).first()
    owner_id = first_user.id if first_user else "farmer-demo-id"
    farm = Farm(
        owner_user_id=owner_id,
        group_name=farm_in.group_name,
        village=farm_in.village,
        area_hectares=farm_in.area_hectares,
        notes=farm_in.notes,
    )
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm


# Crop Plans
@router.get("/crop-plans", response_model=List[CropPlanResponse])
def get_crop_plans(
    status_filter: Optional[str] = None,
    farm_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(CropPlan)
    if status_filter:
        query = query.filter(CropPlan.status == status_filter)
    if farm_id:
        query = query.filter(CropPlan.farm_id == farm_id)
    return query.order_by(CropPlan.expected_harvest_date.asc()).all()


@router.post("/crop-plans", response_model=CropPlanResponse)
def create_crop_plan(plan_in: CropPlanCreate, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == plan_in.farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Lahan (farm) tidak ditemukan.")

    plan = CropPlan(**plan_in.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/crop-plans/{id}", response_model=CropPlanResponse)
def get_crop_plan(id: str, db: Session = Depends(get_db)):
    plan = db.query(CropPlan).filter(CropPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Rencana panen tidak ditemukan.")
    return plan


@router.patch("/crop-plans/{id}", response_model=CropPlanResponse)
def update_crop_plan(id: str, plan_update: CropPlanUpdate, db: Session = Depends(get_db)):
    plan = db.query(CropPlan).filter(CropPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Rencana panen tidak ditemukan.")

    for field, value in plan_update.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/crop-plans/{id}")
def delete_crop_plan(id: str, db: Session = Depends(get_db)):
    plan = db.query(CropPlan).filter(CropPlan.id == id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Rencana panen tidak ditemukan.")
    db.delete(plan)
    db.commit()
    return {"message": "Rencana panen berhasil dihapus."}


# Harvest Records
@router.get("/harvest-records", response_model=List[HarvestRecordResponse])
def get_harvest_records(farm_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(HarvestRecord)
    if farm_id:
        query = query.filter(HarvestRecord.farm_id == farm_id)
    return query.order_by(HarvestRecord.harvest_date.desc()).all()


@router.post("/harvest-records", response_model=HarvestRecordResponse)
def create_harvest_record(rec_in: HarvestRecordCreate, db: Session = Depends(get_db)):
    record = HarvestRecord(**rec_in.model_dump())
    db.add(record)
    db.flush()

    # Automatically create or link an inventory batch
    batch_count = db.query(InventoryBatch).count() + 1
    batch_code = f"BATCH-TRW-{rec_in.harvest_date.strftime('%Y%m')}-{batch_count:03d}"
    batch = InventoryBatch(
        farm_id=record.farm_id,
        harvest_record_id=record.id,
        batch_code=batch_code,
        harvest_date=record.harvest_date,
        initial_quantity_kg=record.quantity_kg,
        available_quantity_kg=record.quantity_kg - record.rejected_quantity_kg,
        quality_grade=record.quality_grade,
        condition_notes=record.notes or "Baru dipanen, kondisi segar prima",
        status="available",
        data_origin=record.data_origin,
    )
    db.add(batch)

    # If associated with crop plan, mark crop plan as harvested
    if record.crop_plan_id:
        c_plan = db.query(CropPlan).filter(CropPlan.id == record.crop_plan_id).first()
        if c_plan:
            c_plan.status = "harvested"

    db.commit()
    db.refresh(record)
    return record
