from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.models import (
    InventoryBatch,
    Transaction,
    CropPlan,
    Buyer,
    BuyerNeed,
    ProcessingOption,
    StockRecommendation,
    ForecastRun,
    AuditLog,
)
from app.schemas.schemas import (
    GapAnalysisResponse,
    GapPeriodPoint,
    ProcessingCalculationRequest,
    ProcessingCalculationResponse,
    BuyerMatchingResponse,
    BuyerMatchItem,
)
from app.core.config import settings


class GapAnalysisService:
    def __init__(self, db: Session):
        self.db = db

    def calculate_gap(self) -> GapAnalysisResponse:
        today = date.today()
        
        # 1. Usable stock right now (available and not spoiled/discarded)
        batches = (
            self.db.query(InventoryBatch)
            .filter(InventoryBatch.status.in_(["available", "allocated"]))
            .all()
        )
        total_usable_stock = sum(b.available_quantity_kg for b in batches) or Decimal("0.0")

        # 2. Get latest supply and demand forecast runs
        latest_supply_run = (
            self.db.query(ForecastRun)
            .filter(ForecastRun.forecast_type == "supply")
            .order_by(ForecastRun.generated_at.desc())
            .first()
        )
        latest_demand_run = (
            self.db.query(ForecastRun)
            .filter(ForecastRun.forecast_type == "demand")
            .order_by(ForecastRun.generated_at.desc())
            .first()
        )

        # 3. Confirmed orders pending fulfillment
        confirmed_transactions = (
            self.db.query(Transaction)
            .filter(Transaction.status == "confirmed")
            .all()
        )
        total_confirmed_orders = sum(t.quantity_ordered_kg - t.quantity_fulfilled_kg for t in confirmed_transactions) or Decimal("0.0")

        # Prepare periods
        periods: List[GapPeriodPoint] = []
        surplus_count = 0
        deficit_count = 0

        # Build 6 periods (weekly by default)
        cur_start = today
        cumulative_carryover_stock = total_usable_stock

        supply_points = {p.period_start: p for p in (latest_supply_run.points if latest_supply_run else [])}
        demand_points = {p.period_start: p for p in (latest_demand_run.points if latest_demand_run else [])}

        all_period_starts = sorted(list(set(list(supply_points.keys()) + list(demand_points.keys()))))
        if not all_period_starts:
            # Fallback 4 weekly periods
            for i in range(4):
                all_period_starts.append(today + timedelta(days=i * 7))

        total_forecast_harvest = Decimal("0.0")
        total_forecast_demand = Decimal("0.0")

        for idx, p_start in enumerate(all_period_starts[:6]):
            p_end = p_start + timedelta(days=6)
            s_pt = supply_points.get(p_start)
            d_pt = demand_points.get(p_start)

            harvest_val = s_pt.predicted_quantity_kg if s_pt else Decimal("1200.0")
            demand_val = d_pt.predicted_quantity_kg if d_pt else Decimal("1400.0")

            total_forecast_harvest += harvest_val
            total_forecast_demand += demand_val

            # Orders falling into this period
            orders_in_period = sum(
                (t.quantity_ordered_kg - t.quantity_fulfilled_kg)
                for t in confirmed_transactions
                if p_start <= t.order_date <= p_end
            ) or (total_confirmed_orders if idx == 0 else Decimal("0.0"))

            # Projected available supply
            # In period 0, starts with current usable stock. Subsequent periods carry forward
            period_starting_stock = cumulative_carryover_stock if idx == 0 else Decimal("0.0")
            projected_supply = period_starting_stock + harvest_val - orders_in_period
            
            # Gap
            projected_gap = projected_supply - demand_val

            # Status determination
            if projected_gap > Decimal(str(settings.GAP_SURPLUS_THRESHOLD_KG)):
                status = "surplus"
                surplus_count += 1
                notes = f"Potensi surplus +{projected_gap:.0f} kg. Pertimbangkan pengolahan atau cari pembeli baru."
            elif projected_gap < Decimal(str(settings.GAP_DEFICIT_THRESHOLD_KG)):
                status = "deficit"
                deficit_count += 1
                notes = f"Potensi kekurangan {abs(projected_gap):.0f} kg. Perlu koordinasi panen kelompok tani."
            else:
                status = "balanced"
                notes = "Pasokan dan permintaan relatif seimbang dalam batas toleransi ±500 kg."

            periods.append(
                GapPeriodPoint(
                    period_start=p_start,
                    period_end=p_end,
                    period_label=f"Minggu {idx + 1} ({p_start.strftime('%d %b')})",
                    usable_stock_kg=period_starting_stock,
                    forecast_harvest_kg=harvest_val,
                    confirmed_orders_kg=orders_in_period,
                    forecast_demand_kg=demand_val,
                    projected_available_supply_kg=projected_supply,
                    projected_gap_kg=projected_gap,
                    gap_status=status,
                    notes=notes,
                )
            )

        overall_gap = (total_usable_stock + total_forecast_harvest - total_confirmed_orders) - total_forecast_demand

        return GapAnalysisResponse(
            total_usable_stock_kg=total_usable_stock,
            total_forecast_harvest_kg=total_forecast_harvest,
            total_confirmed_orders_kg=total_confirmed_orders,
            total_forecast_demand_kg=total_forecast_demand,
            overall_net_gap_kg=overall_gap,
            periods=periods,
            surplus_periods_count=surplus_count,
            deficit_periods_count=deficit_count,
            data_origin="simulation",
            generated_at=datetime.now(timezone.utc),
        )


class SmartStockPlanner:
    def __init__(self, db: Session):
        self.db = db

    def generate_recommendations(self) -> List[StockRecommendation]:
        """
        Generates actionable stock recommendations based on FIFO batch age,
        handling deadlines, open confirmed orders, and processing options.
        Requires human review/approval.
        """
        today = date.today()
        created_recommendations = []

        # 1. Check open confirmed orders needing stock allocation
        confirmed_orders = (
            self.db.query(Transaction)
            .filter(Transaction.status == "confirmed")
            .all()
        )

        available_batches = (
            self.db.query(InventoryBatch)
            .filter(InventoryBatch.status == "available", InventoryBatch.available_quantity_kg > 0)
            .order_by(InventoryBatch.harvest_date.asc())  # FIFO: oldest first
            .all()
        )

        # Recommendation 1: Allocate oldest available batches to confirmed orders
        for order in confirmed_orders:
            needed = order.quantity_ordered_kg - order.quantity_fulfilled_kg
            if needed <= 0:
                continue

            for batch in available_batches:
                if batch.available_quantity_kg <= 0:
                    continue

                alloc_qty = min(batch.available_quantity_kg, needed)
                rec = StockRecommendation(
                    recommendation_type="allocate",
                    batch_id=batch.id,
                    period_start=today,
                    period_end=today + timedelta(days=2),
                    quantity_kg=alloc_qty,
                    reason=f"Alokasikan {alloc_qty:.0f} kg dari batch {batch.batch_code} (panen {batch.harvest_date}) untuk memenuhi pesanan {order.buyer.business_name}.",
                    assumptions_json={"order_id": order.id, "batch_code": batch.batch_code, "unit_price": float(order.unit_price)},
                    estimated_value=alloc_qty * order.unit_price,
                    estimated_cost=Decimal("0.0"),
                    status="pending",
                )
                self.db.add(rec)
                created_recommendations.append(rec)
                needed -= alloc_qty
                if needed <= 0:
                    break

        # Recommendation 2: Check batches near handling deadline (fresh cassava SOP: 3-4 days max)
        processing_opts = self.db.query(ProcessingOption).filter(ProcessingOption.is_active == True).all()
        best_opt = processing_opts[0] if processing_opts else None

        for batch in available_batches:
            days_since_harvest = (today - batch.harvest_date).days
            # If batch is 2 days old or older, recommend quick processing to prevent post-harvest spoilage
            if days_since_harvest >= 2 and batch.available_quantity_kg > 100:
                opt_name = best_opt.name if best_opt else "Keripik Singkong Gurih"
                est_val = batch.available_quantity_kg * Decimal("4500.0")  # projected value after processing
                est_cost = batch.available_quantity_kg * Decimal("1500.0")

                rec = StockRecommendation(
                    recommendation_type="process",
                    batch_id=batch.id,
                    period_start=today,
                    period_end=today + timedelta(days=1),
                    quantity_kg=batch.available_quantity_kg,
                    reason=f"Batch {batch.batch_code} sudah berusia {days_since_harvest} hari pascapanen. Disarankan segera diolah menjadi '{opt_name}' sebelum terjadi degradasi vaskular (rusak/kebiruan).",
                    assumptions_json={
                        "days_since_harvest": days_since_harvest,
                        "sop_reference": best_opt.food_safety_sop_reference if best_opt else "SOP-TRAWAS-01",
                        "processing_option": opt_name,
                    },
                    estimated_cost=est_cost,
                    estimated_value=est_val,
                    status="pending",
                )
                self.db.add(rec)
                created_recommendations.append(rec)

        self.db.commit()
        return created_recommendations


class ProcessingCostCalculator:
    """
    Deterministic cost and contribution margin calculator for cassava processing options.
    Uses exact Decimal arithmetic.
    """

    @staticmethod
    def calculate(req: ProcessingCalculationRequest, option: Optional[ProcessingOption] = None) -> ProcessingCalculationResponse:
        input_kg = req.input_raw_cassava_kg
        raw_price = req.raw_cassava_price_per_kg
        raw_mat_cost = input_kg * raw_price

        # Yield ratio (rendemen)
        yield_ratio = req.yield_ratio or (option.yield_ratio if option else Decimal("0.35"))
        output_qty = input_kg * yield_ratio
        output_unit = option.output_unit if option else "kg"

        # Costs per kg input
        labor_rate = req.labor_cost if req.labor_cost is not None else (option.labor_cost if option else Decimal("500.0"))
        energy_rate = req.energy_cost if req.energy_cost is not None else (option.energy_cost if option else Decimal("300.0"))
        pack_rate = req.packaging_cost if req.packaging_cost is not None else (option.packaging_cost if option else Decimal("400.0"))
        dist_rate = req.distribution_cost if req.distribution_cost is not None else (option.distribution_cost if option else Decimal("200.0"))
        other_rate = req.other_cost if req.other_cost is not None else (option.other_cost if option else Decimal("100.0"))

        labor_tot = input_kg * labor_rate
        energy_tot = input_kg * energy_rate
        pack_tot = input_kg * pack_rate
        dist_tot = input_kg * dist_rate
        other_tot = input_kg * other_rate

        total_proc_cost = labor_tot + energy_tot + pack_tot + dist_tot + other_tot
        total_combined_cost = raw_mat_cost + total_proc_cost

        unit_cost = total_combined_cost / output_qty if output_qty > 0 else Decimal("0.0")

        selling_price = req.expected_selling_price_per_unit or (option.expected_selling_price_per_unit if option else Decimal("18000.0"))
        gross_rev = output_qty * selling_price
        contribution_margin = gross_rev - total_combined_cost
        margin_pct = (contribution_margin / gross_rev * Decimal("100.0")) if gross_rev > 0 else Decimal("0.0")

        # Raw sale comparison
        raw_sale_rev = input_kg * raw_price
        # Net advantage of processing vs selling raw
        advantage = contribution_margin

        # Break-even volume
        fixed_assumed = Decimal("200000.0")  # example fixed equipment setup in Rupiah
        unit_margin = selling_price - unit_cost
        break_even = (fixed_assumed / unit_margin) if unit_margin > 0 else None

        return ProcessingCalculationResponse(
            input_raw_cassava_kg=input_kg,
            raw_material_cost=raw_mat_cost,
            yield_ratio=yield_ratio,
            output_finished_quantity=round(output_qty, 2),
            output_unit=output_unit,
            total_processing_cost=total_proc_cost,
            labor_cost_total=labor_tot,
            energy_cost_total=energy_tot,
            packaging_cost_total=pack_tot,
            distribution_cost_total=dist_tot,
            other_cost_total=other_tot,
            total_combined_cost=total_combined_cost,
            unit_cost_per_finished_unit=round(unit_cost, 2),
            expected_selling_price_per_unit=selling_price,
            gross_revenue=gross_rev,
            estimated_contribution_margin=contribution_margin,
            margin_percentage=round(margin_pct, 2),
            raw_sale_revenue_comparison=raw_sale_rev,
            raw_sale_margin_advantage=advantage,
            break_even_volume_kg=round(break_even, 2) if break_even else None,
            disclaimer="Kalkulasi deterministik margin kontribusi sebelum pajak, amortisasi alat, dan penyusutan. Dihitung untuk simulasi evaluasi pengolahan Trawas.",
        )


class BuyerMatchingService:
    def __init__(self, db: Session):
        self.db = db

    def match_buyers_for_batch(self, batch_id: Optional[str] = None) -> BuyerMatchingResponse:
        batch = None
        if batch_id:
            batch = self.db.query(InventoryBatch).filter(InventoryBatch.id == batch_id).first()

        available_kg = batch.available_quantity_kg if batch else Decimal("1000.0")
        quality_grade = batch.quality_grade if batch else "A"

        buyers = self.db.query(Buyer).filter(Buyer.status == "active").all()
        matched_items = []

        for b in buyers:
            score = 50  # base
            reasons = []

            # 1. Volume match
            if b.max_quantity_kg:
                vol_ratio = float(available_kg / b.max_quantity_kg)
                if 0.5 <= vol_ratio <= 1.5:
                    score += 25
                    reasons.append(f"Volume sesuai kapasitas beli (~{b.max_quantity_kg:.0f} kg/batch)")
                else:
                    score += 10
            else:
                score += 15

            # 2. Grade match
            if b.preferred_grade == quality_grade:
                score += 15
                reasons.append(f"Kualitas Grade {quality_grade} cocok dengan preferensi pembeli")

            # 3. Location match (Trawas)
            if "Trawas" in b.village_or_area:
                score += 10
                reasons.append("Lokasi di area Trawas (biaya logistik minimal)")

            score = min(100, score)

            matched_items.append(
                BuyerMatchItem(
                    buyer_id=b.id,
                    business_name=b.business_name,
                    buyer_category=b.buyer_category,
                    village_or_area=b.village_or_area,
                    score=score,
                    matched_reasons=reasons,
                    volume_match_pct=round(float(available_kg / (b.max_quantity_kg or available_kg)) * 100, 1),
                    target_price_per_kg=Decimal("2600.0"),
                    contact_phone=b.contact_phone,
                )
            )

        matched_items.sort(key=lambda x: x.score, reverse=True)

        return BuyerMatchingResponse(
            batch_id=batch_id,
            available_kg=available_kg,
            quality_grade=quality_grade,
            matches=matched_items,
        )
