from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.models import InventoryBatch, Farm
from app.schemas.schemas import (
    InventoryBatchCreate,
    InventoryBatchUpdate,
    InventoryBatchResponse,
)

router = APIRouter(prefix="/inventory-batches", tags=["Inventory Batches"])


@router.get("", response_model=List[InventoryBatchResponse])
def get_inventory_batches(
    status_filter: Optional[str] = None,
    grade_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryBatch)
    if status_filter:
        query = query.filter(InventoryBatch.status == status_filter)
    if grade_filter:
        query = query.filter(InventoryBatch.quality_grade == grade_filter)
    return query.order_by(InventoryBatch.harvest_date.desc()).all()


@router.post("", response_model=InventoryBatchResponse)
def create_inventory_batch(batch_in: InventoryBatchCreate, db: Session = Depends(get_db)):
    batch = InventoryBatch(**batch_in.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.patch("/{id}", response_model=InventoryBatchResponse)
def update_inventory_batch(id: str, batch_update: InventoryBatchUpdate, db: Session = Depends(get_db)):
    batch = db.query(InventoryBatch).filter(InventoryBatch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch persediaan tidak ditemukan.")

    for field, value in batch_update.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)

    db.commit()
    db.refresh(batch)
    return batch
