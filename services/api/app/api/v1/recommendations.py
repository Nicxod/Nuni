from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user_optional
from app.models.models import (
    StockRecommendation,
    ProcessingOption,
    InventoryBatch,
    Transaction,
    TransactionAllocation,
    AuditLog,
    User,
)
from app.schemas.schemas import (
    StockRecommendationResponse,
    StockRecommendationReview,
    ProcessingOptionCreate,
    ProcessingOptionResponse,
    ProcessingCalculationRequest,
    ProcessingCalculationResponse,
    BuyerMatchingResponse,
)
from app.recommendations.engine import (
    SmartStockPlanner,
    ProcessingCostCalculator,
    BuyerMatchingService,
)

router = APIRouter(tags=["Stock Recommendations and Processing Calculator"])


# Recommendations
@router.get("/stock-recommendations", response_model=List[StockRecommendationResponse])
def get_recommendations(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(StockRecommendation)
    if status_filter:
        query = query.filter(StockRecommendation.status == status_filter)
    recs = query.order_by(StockRecommendation.created_at.desc()).all()
    
    res = []
    for r in recs:
        dto = StockRecommendationResponse.model_validate(r)
        if r.batch:
            dto.batch_code = r.batch.batch_code
        res.append(dto)
    return res


@router.post("/stock-recommendations/generate", response_model=List[StockRecommendationResponse])
def generate_recommendations(db: Session = Depends(get_db)):
    planner = SmartStockPlanner(db)
    new_recs = planner.generate_recommendations()
    res = []
    for r in new_recs:
        dto = StockRecommendationResponse.model_validate(r)
        if r.batch:
            dto.batch_code = r.batch.batch_code
        res.append(dto)
    return res


@router.post("/stock-recommendations/{id}/approve", response_model=StockRecommendationResponse)
def approve_recommendation(
    id: str,
    review_in: StockRecommendationReview,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    rec = db.query(StockRecommendation).filter(StockRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan.")

    if rec.status != "pending":
        raise HTTPException(status_code=400, detail=f"Rekomendasi sudah berstatus '{rec.status}'.")

    reviewer_id = current_user.id if current_user else None
    approved_qty = review_in.approved_quantity_kg or rec.quantity_kg or Decimal("0.0")

    # Atomic stock modification based on recommendation action
    if rec.batch and approved_qty > 0:
        batch = rec.batch
        before_state = {
            "batch_id": batch.id,
            "available_kg": float(batch.available_quantity_kg),
            "status": batch.status,
        }

        if rec.recommendation_type == "allocate":
            if batch.available_quantity_kg < approved_qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stok tersedia ({batch.available_quantity_kg} kg) kurang dari jumlah disetujui ({approved_qty} kg).",
                )
            batch.available_quantity_kg -= approved_qty
            batch.reserved_quantity_kg += approved_qty
            if batch.available_quantity_kg == 0:
                batch.status = "allocated"

            # Check if order allocation can be created
            order_id = (rec.assumptions_json or {}).get("order_id")
            if order_id:
                order = db.query(Transaction).filter(Transaction.id == order_id).first()
                if order:
                    alloc = TransactionAllocation(
                        transaction_id=order.id,
                        inventory_batch_id=batch.id,
                        allocated_quantity_kg=approved_qty,
                    )
                    db.add(alloc)
                    order.quantity_fulfilled_kg += approved_qty
                    if order.quantity_fulfilled_kg >= order.quantity_ordered_kg:
                        order.status = "fulfilled"

        elif rec.recommendation_type == "process":
            if batch.available_quantity_kg < approved_qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stok tersedia ({batch.available_quantity_kg} kg) kurang dari jumlah olah ({approved_qty} kg).",
                )
            batch.available_quantity_kg -= approved_qty
            batch.status = "processing"

        after_state = {
            "batch_id": batch.id,
            "available_kg": float(batch.available_quantity_kg),
            "status": batch.status,
        }

        # Record audit log
        audit = AuditLog(
            user_id=reviewer_id,
            action=f"approve_{rec.recommendation_type}",
            entity_type="inventory_batch",
            entity_id=batch.id,
            before_json=before_state,
            after_json=after_state,
        )
        db.add(audit)

    rec.status = "approved"
    rec.reviewed_by_user_id = reviewer_id
    rec.reviewed_at = datetime.now(timezone.utc)
    rec.review_notes = review_in.review_notes or "Disetujui oleh pengguna."

    db.commit()
    db.refresh(rec)
    dto = StockRecommendationResponse.model_validate(rec)
    if rec.batch:
        dto.batch_code = rec.batch.batch_code
    return dto


@router.post("/stock-recommendations/{id}/reject", response_model=StockRecommendationResponse)
def reject_recommendation(
    id: str,
    review_in: StockRecommendationReview,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    rec = db.query(StockRecommendation).filter(StockRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan.")

    rec.status = "rejected"
    rec.reviewed_by_user_id = current_user.id if current_user else None
    rec.reviewed_at = datetime.now(timezone.utc)
    rec.review_notes = review_in.review_notes or "Ditolak oleh pengguna."

    db.commit()
    db.refresh(rec)
    dto = StockRecommendationResponse.model_validate(rec)
    if rec.batch:
        dto.batch_code = rec.batch.batch_code
    return dto


@router.post("/stock-recommendations/{id}/complete", response_model=StockRecommendationResponse)
def complete_recommendation(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    rec = db.query(StockRecommendation).filter(StockRecommendation.id == id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Rekomendasi tidak ditemukan.")

    rec.status = "completed"
    rec.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rec)
    dto = StockRecommendationResponse.model_validate(rec)
    if rec.batch:
        dto.batch_code = rec.batch.batch_code
    return dto


# Processing Options
@router.get("/processing-options", response_model=List[ProcessingOptionResponse])
def get_processing_options(db: Session = Depends(get_db)):
    return db.query(ProcessingOption).filter(ProcessingOption.is_active == True).all()


@router.post("/processing-options", response_model=ProcessingOptionResponse)
def create_processing_option(opt_in: ProcessingOptionCreate, db: Session = Depends(get_db)):
    opt = ProcessingOption(**opt_in.model_dump())
    db.add(opt)
    db.commit()
    db.refresh(opt)
    return opt


# Processing Calculator (P1)
@router.post("/processing-calculator/estimate", response_model=ProcessingCalculationResponse)
def calculate_processing_cost(req: ProcessingCalculationRequest, db: Session = Depends(get_db)):
    option = None
    if req.processing_option_id:
        option = db.query(ProcessingOption).filter(ProcessingOption.id == req.processing_option_id).first()
    return ProcessingCostCalculator.calculate(req, option)


# Buyer Matching (P1)
@router.get("/buyer-matches", response_model=BuyerMatchingResponse)
def get_buyer_matches(batch_id: Optional[str] = None, db: Session = Depends(get_db)):
    service = BuyerMatchingService(db)
    return service.match_buyers_for_batch(batch_id)
