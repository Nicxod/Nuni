from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.models import Buyer, BuyerNeed
from app.schemas.schemas import (
    BuyerCreate,
    BuyerResponse,
    BuyerNeedCreate,
    BuyerNeedResponse,
)

router = APIRouter(tags=["Buyers and Market Demand Needs"])


@router.get("/buyers", response_model=List[BuyerResponse])
def get_buyers(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Buyer)
    if category:
        query = query.filter(Buyer.buyer_category == category)
    if status:
        query = query.filter(Buyer.status == status)
    return query.order_by(Buyer.business_name.asc()).all()


@router.post("/buyers", response_model=BuyerResponse)
def create_buyer(buyer_in: BuyerCreate, db: Session = Depends(get_db)):
    buyer = Buyer(**buyer_in.model_dump())
    db.add(buyer)
    db.commit()
    db.refresh(buyer)
    return buyer


@router.get("/buyer-needs", response_model=List[BuyerNeedResponse])
def get_buyer_needs(buyer_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(BuyerNeed)
    if buyer_id:
        query = query.filter(BuyerNeed.buyer_id == buyer_id)
    needs = query.order_by(BuyerNeed.needed_from.asc()).all()
    
    # Map buyer names
    res = []
    for n in needs:
        dto = BuyerNeedResponse.model_validate(n)
        if n.buyer:
            dto.buyer_name = n.buyer.business_name
        res.append(dto)
    return res


@router.post("/buyer-needs", response_model=BuyerNeedResponse)
def create_buyer_need(need_in: BuyerNeedCreate, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == need_in.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Pembeli (buyer) tidak ditemukan.")

    need = BuyerNeed(**need_in.model_dump())
    db.add(need)
    db.commit()
    db.refresh(need)
    res = BuyerNeedResponse.model_validate(need)
    res.buyer_name = buyer.business_name
    return res
