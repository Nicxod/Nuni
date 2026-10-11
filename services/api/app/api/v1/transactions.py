import csv
import io
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.models import Transaction, Buyer, InventoryBatch, TransactionAllocation, AuditLog
from app.schemas.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    CSVImportResult,
)

router = APIRouter(tags=["Transactions and Orders"])


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    status_filter: Optional[str] = None,
    buyer_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if status_filter:
        query = query.filter(Transaction.status == status_filter)
    if buyer_id:
        query = query.filter(Transaction.buyer_id == buyer_id)
    
    txs = query.order_by(Transaction.transaction_date.desc()).all()
    res = []
    for t in txs:
        dto = TransactionResponse.model_validate(t)
        dto.total_amount = t.quantity_ordered_kg * t.unit_price
        if t.buyer:
            dto.buyer_name = t.buyer.business_name
        res.append(dto)
    return res


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    buyer = db.query(Buyer).filter(Buyer.id == tx_in.buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Pembeli (buyer) tidak ditemukan.")

    tx = Transaction(**tx_in.model_dump())
    db.add(tx)
    db.commit()
    db.refresh(tx)

    dto = TransactionResponse.model_validate(tx)
    dto.total_amount = tx.quantity_ordered_kg * tx.unit_price
    dto.buyer_name = buyer.business_name
    return dto


@router.patch("/transactions/{id}", response_model=TransactionResponse)
def update_transaction(id: str, tx_update: TransactionUpdate, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaksi tidak ditemukan.")

    for field, value in tx_update.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    dto = TransactionResponse.model_validate(tx)
    dto.total_amount = tx.quantity_ordered_kg * tx.unit_price
    if tx.buyer:
        dto.buyer_name = tx.buyer.business_name
    return dto


@router.post("/import/transactions-csv", response_model=CSVImportResult)
async def import_transactions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith((".csv", ".txt")):
        raise HTTPException(status_code=400, detail="Format file harus CSV.")

    contents = await file.read()
    decoded = contents.decode("utf-8", errors="replace")
    csv_reader = csv.DictReader(io.StringIO(decoded))

    total_rows = 0
    success_rows = 0
    failed_rows = 0
    error_list = []

    # Map buyers by business_name (case-insensitive)
    existing_buyers = {b.business_name.strip().lower(): b for b in db.query(Buyer).all()}

    for line_idx, row in enumerate(csv_reader, start=2):
        total_rows += 1
        try:
            buyer_name = (row.get("buyer_name") or row.get("buyer") or "").strip()
            date_str = (row.get("transaction_date") or row.get("date") or "").strip()
            qty_str = (row.get("quantity_ordered_kg") or row.get("quantity_kg") or row.get("quantity") or "").strip()
            price_str = (row.get("unit_price") or row.get("price") or "2500").strip()
            status_val = (row.get("status") or "confirmed").strip().lower()

            if not buyer_name:
                raise ValueError("Kolom 'buyer_name' wajib diisi.")
            if not date_str:
                raise ValueError("Kolom 'transaction_date' wajib diisi (format YYYY-MM-DD).")
            if not qty_str:
                raise ValueError("Kolom 'quantity_ordered_kg' wajib diisi.")

            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            parsed_qty = Decimal(qty_str)
            parsed_price = Decimal(price_str)

            if parsed_qty < 0:
                raise ValueError("Kuantitas tidak boleh negatif.")

            # Find or auto-create buyer
            b_key = buyer_name.lower()
            if b_key in existing_buyers:
                buyer = existing_buyers[b_key]
            else:
                buyer = Buyer(
                    business_name=buyer_name,
                    buyer_category="umkm_chips",
                    village_or_area="Trawas",
                    is_verified=True,
                )
                db.add(buyer)
                db.flush()
                existing_buyers[b_key] = buyer

            tx = Transaction(
                buyer_id=buyer.id,
                transaction_date=parsed_date,
                order_date=parsed_date,
                quantity_ordered_kg=parsed_qty,
                quantity_fulfilled_kg=parsed_qty if status_val == "fulfilled" else Decimal("0.0"),
                unit_price=parsed_price,
                status=status_val if status_val in ["draft", "confirmed", "fulfilled", "cancelled", "rejected"] else "confirmed",
                data_origin="simulation",
                notes=f"Diimpor dari file CSV: {file.filename}",
            )
            db.add(tx)
            success_rows += 1

        except Exception as err:
            failed_rows += 1
            error_list.append(f"Baris {line_idx}: {str(err)}")

    db.commit()
    return CSVImportResult(
        total_rows=total_rows,
        successful_rows=success_rows,
        failed_rows=failed_rows,
        errors=error_list,
        message=f"Impor CSV selesai. {success_rows} berhasil, {failed_rows} gagal.",
    )


@router.get("/export/transactions-csv")
def export_transactions_csv(db: Session = Depends(get_db)):
    txs = db.query(Transaction).order_by(Transaction.transaction_date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id",
        "buyer_name",
        "transaction_date",
        "quantity_ordered_kg",
        "quantity_fulfilled_kg",
        "unit_price",
        "total_amount",
        "status",
        "data_origin",
        "notes",
    ])
    for t in txs:
        writer.writerow([
            t.id,
            t.buyer.business_name if t.buyer else "",
            t.transaction_date.isoformat(),
            str(t.quantity_ordered_kg),
            str(t.quantity_fulfilled_kg),
            str(t.unit_price),
            str(t.quantity_ordered_kg * t.unit_price),
            t.status,
            t.data_origin,
            t.notes or "",
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions_trawas_simulasi.csv"},
    )
