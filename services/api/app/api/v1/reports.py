from datetime import datetime, timezone, date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import get_password_hash
from app.models.models import (
    User,
    Farm,
    CropPlan,
    HarvestRecord,
    InventoryBatch,
    Buyer,
    BuyerNeed,
    Transaction,
    ProcessingOption,
    StockRecommendation,
    ForecastRun,
)
from app.schemas.schemas import SummaryReportResponse
from app.forecasting.engine import SupplyForecaster, DemandForecaster
from app.recommendations.engine import SmartStockPlanner

router = APIRouter(tags=["Reports and System Seed"])


@router.get("/reports/summary", response_model=SummaryReportResponse)
def get_summary_report(db: Session = Depends(get_db)):
    total_farms = db.query(Farm).count()
    active_crop_plans = db.query(CropPlan).filter(CropPlan.status.in_(["growing", "ready_to_harvest"])).count()
    
    batches = db.query(InventoryBatch).filter(InventoryBatch.status.in_(["available", "allocated"])).all()
    total_inv_kg = sum(b.available_quantity_kg for b in batches) or Decimal("0.0")

    today = date.today()
    # Batches older than 2 days or past deadline considered urgent
    urgent_batches = [b for b in batches if (today - b.harvest_date).days >= 2]
    total_urgent_kg = sum(b.available_quantity_kg for b in urgent_batches) or Decimal("0.0")

    confirmed_txs = db.query(Transaction).filter(Transaction.status == "confirmed").all()
    total_confirmed_orders = sum(t.quantity_ordered_kg - t.quantity_fulfilled_kg for t in confirmed_txs) or Decimal("0.0")

    latest_demand_run = db.query(ForecastRun).filter(ForecastRun.forecast_type == "demand").order_by(ForecastRun.generated_at.desc()).first()
    total_demand_forecast = sum(p.predicted_quantity_kg for p in (latest_demand_run.points if latest_demand_run else [])) or Decimal("0.0")

    net_gap = total_inv_kg - total_confirmed_orders - total_demand_forecast
    active_recs_count = db.query(StockRecommendation).filter(StockRecommendation.status == "pending").count()
    buyers_count = db.query(Buyer).count()

    return SummaryReportResponse(
        total_farms=total_farms,
        total_crop_plans_active=active_crop_plans,
        total_inventory_available_kg=total_inv_kg,
        total_urgent_batches_kg=total_urgent_kg,
        total_confirmed_orders_kg=total_confirmed_orders,
        total_demand_forecast_kg=total_demand_forecast,
        projected_gap_kg=net_gap,
        active_recommendations_count=active_recs_count,
        registered_buyers_count=buyers_count,
        data_origin_notice="Semua data berstatus SIMULASI untuk validasi rantai pasok singkong Trawas.",
        generated_at=datetime.now(timezone.utc),
    )


@router.post("/system/seed")
def seed_system_data(db: Session = Depends(get_db)):
    """
    Seeds comprehensive simulated data for Trawas:
    - Users (admin, farmer, buyer, viewer)
    - Farms in Trawas villages (Ketapanrame, Duyung, Belik, Tamanjero)
    - Crop Plans with harvest dates
    - Harvest Records & Inventory Batches
    - Buyers (UMKM Keripik, Pabrik Tepung Mocaf, Pedagang Pasar)
    - Buyer Needs & Orders/Transactions
    - Processing Options (Keripik, Mocaf, Singkong Beku)
    - Runs initial supply & demand forecast and generates recommendations
    """
    # 1. Users
    existing_users = {u.email: u for u in db.query(User).all()}

    demo_users = [
        {"name": "Admin Trawas", "email": "admin@cassavaflow.local", "role": "admin", "password": "adminpassword123"},
        {"name": "Pak Slamet (Ketua Poktan Trawas)", "email": "petani@cassavaflow.local", "role": "farmer", "password": "petanipassword123"},
        {"name": "Ibu Sri (UMKM Keripik Barokah)", "email": "pembeli@cassavaflow.local", "role": "buyer", "password": "pembelipassword123"},
        {"name": "Analis Rantai Pasok", "email": "viewer@cassavaflow.local", "role": "viewer", "password": "viewerpassword123"},
    ]

    users_map = {}
    for du in demo_users:
        if du["email"] not in existing_users:
            u = User(
                name=du["name"],
                email=du["email"],
                password_hash=get_password_hash(du["password"]),
                role=du["role"],
                is_active=True,
            )
            db.add(u)
            db.flush()
            users_map[du["role"]] = u
        else:
            users_map[du["role"]] = existing_users[du["email"]]

    farmer_user = users_map.get("farmer") or db.query(User).filter(User.role == "farmer").first()
    buyer_user = users_map.get("buyer") or db.query(User).filter(User.role == "buyer").first()

    # 2. Farms
    if db.query(Farm).count() == 0:
        farms_data = [
            Farm(owner_user_id=farmer_user.id, group_name="Poktan Trawas Makmur - Blok A", village="Desa Ketapanrame, Trawas", area_hectares=Decimal("2.5"), notes="Lahan lereng gunung, tanah vulkanik gembur"),
            Farm(owner_user_id=farmer_user.id, group_name="Poktan Sumber Urip - Blok B", village="Desa Duyung, Trawas", area_hectares=Decimal("1.8"), notes="Lahan tadah hujan terasering"),
            Farm(owner_user_id=farmer_user.id, group_name="Poktan Subur Sari - Blok C", village="Desa Belik, Trawas", area_hectares=Decimal("3.0"), notes="Akses jalan aspal mudah untuk angkutan truk"),
        ]
        db.add_all(farms_data)
        db.flush()

    farms = db.query(Farm).all()
    today = date.today()

    # 3. Processing Options
    if db.query(ProcessingOption).count() == 0:
        opts = [
            ProcessingOption(
                name="Keripik Singkong Renyah Balado/Gurih",
                description="Pengolahan singkong segar menjadi keripik iris tipis siap kemas untuk oleh-oleh Trawas.",
                input_unit="kg",
                output_unit="pack_250g",
                yield_ratio=Decimal("0.40"),  # 1 kg singkong menghasilkan ~1.6 bungkus (0.40 kg produk jadi)
                capacity_kg_per_day=Decimal("600.0"),
                labor_cost=Decimal("600.0"),
                energy_cost=Decimal("400.0"),
                packaging_cost=Decimal("500.0"),
                distribution_cost=Decimal("250.0"),
                other_cost=Decimal("150.0"),
                expected_selling_price_per_unit=Decimal("15000.0"),
                food_safety_sop_reference="SOP-TRAWAS-KERIPIK-01",
                is_active=True,
            ),
            ProcessingOption(
                name="Tepung Mocaf (Modified Cassava Flour)",
                description="Fermentasi singkong terfermentasi bakteri asam laktat, jemur dan giling untuk substitusi terigu.",
                input_unit="kg",
                output_unit="kg",
                yield_ratio=Decimal("0.32"),  # 32% rendemen tepung mocaf
                capacity_kg_per_day=Decimal("1000.0"),
                labor_cost=Decimal("450.0"),
                energy_cost=Decimal("350.0"),
                packaging_cost=Decimal("300.0"),
                distribution_cost=Decimal("200.0"),
                other_cost=Decimal("100.0"),
                expected_selling_price_per_unit=Decimal("13500.0"),
                food_safety_sop_reference="SOP-TRAWAS-MOCAF-02",
                is_active=True,
            ),
            ProcessingOption(
                name="Singkong Parut Beku Vakum",
                description="Pengupasan, pencucian higienis, pemarutan dan pembekuan suhu -18°C untuk bahan kue basah.",
                input_unit="kg",
                output_unit="pack_1kg",
                yield_ratio=Decimal("0.85"),
                capacity_kg_per_day=Decimal("400.0"),
                labor_cost=Decimal("500.0"),
                energy_cost=Decimal("500.0"),
                packaging_cost=Decimal("600.0"),
                distribution_cost=Decimal("300.0"),
                other_cost=Decimal("100.0"),
                expected_selling_price_per_unit=Decimal("8000.0"),
                food_safety_sop_reference="SOP-TRAWAS-BEKU-03",
                is_active=True,
            ),
        ]
        db.add_all(opts)
        db.flush()

    # 4. Crop Plans & Harvest Records
    if db.query(CropPlan).count() == 0 and farms:
        f1, f2, f3 = farms[0], farms[1], farms[2] if len(farms) > 2 else farms[0]
        plans = [
            CropPlan(farm_id=f1.id, crop_name="Singkong Gajah", variety="Gajah", planting_date=today - timedelta(days=240), expected_harvest_date=today + timedelta(days=5), area_hectares=Decimal("1.0"), expected_yield_kg=Decimal("18000.0"), status="ready_to_harvest", data_origin="simulation"),
            CropPlan(farm_id=f2.id, crop_name="Singkong Manggu", variety="Manggu", planting_date=today - timedelta(days=210), expected_harvest_date=today + timedelta(days=14), area_hectares=Decimal("0.8"), expected_yield_kg=Decimal("12000.0"), status="growing", data_origin="simulation"),
            CropPlan(farm_id=f3.id, crop_name="Singkong Kuning Mentega", variety="Kuning", planting_date=today - timedelta(days=180), expected_harvest_date=today + timedelta(days=28), area_hectares=Decimal("1.2"), expected_yield_kg=Decimal("16500.0"), status="growing", data_origin="simulation"),
            CropPlan(farm_id=f1.id, crop_name="Singkong Gajah Blok 2", variety="Gajah", planting_date=today - timedelta(days=150), expected_harvest_date=today + timedelta(days=45), area_hectares=Decimal("1.5"), expected_yield_kg=Decimal("22000.0"), status="growing", data_origin="simulation"),
        ]
        db.add_all(plans)
        db.flush()

        # Historical Harvest Records
        hist_records = [
            HarvestRecord(farm_id=f1.id, harvest_date=today - timedelta(days=45), quantity_kg=Decimal("4500.0"), quality_grade="A", rejected_quantity_kg=Decimal("150.0"), data_origin="simulation", notes="Panen awal musim kemarau"),
            HarvestRecord(farm_id=f2.id, harvest_date=today - timedelta(days=32), quantity_kg=Decimal("3800.0"), quality_grade="Super", rejected_quantity_kg=Decimal("80.0"), data_origin="simulation", notes="Umbi padat tidak berserat"),
            HarvestRecord(farm_id=f3.id, harvest_date=today - timedelta(days=18), quantity_kg=Decimal("5200.0"), quality_grade="A", rejected_quantity_kg=Decimal("200.0"), data_origin="simulation", notes="Hasil panen lahan Belik"),
            HarvestRecord(farm_id=f1.id, harvest_date=today - timedelta(days=3), quantity_kg=Decimal("3200.0"), quality_grade="A", rejected_quantity_kg=Decimal("100.0"), data_origin="simulation", notes="Panen parsial petak timur"),
            HarvestRecord(farm_id=f2.id, harvest_date=today - timedelta(days=1), quantity_kg=Decimal("2100.0"), quality_grade="B", rejected_quantity_kg=Decimal("50.0"), data_origin="simulation", notes="Singkong ukuran sedang"),
        ]
        db.add_all(hist_records)
        db.flush()

        # Batches
        batches = [
            InventoryBatch(
                farm_id=f1.id,
                harvest_record_id=hist_records[3].id,
                batch_code="BATCH-TRW-202610-001",
                harvest_date=today - timedelta(days=3),
                initial_quantity_kg=Decimal("3100.0"),
                available_quantity_kg=Decimal("1800.0"),
                reserved_quantity_kg=Decimal("1300.0"),
                quality_grade="A",
                condition_notes="Panen 3 hari lalu, butuh penanganan/distribusi cepat agar tidak lebam",
                status="available",
                handling_deadline=today + timedelta(days=1),
                data_origin="simulation",
            ),
            InventoryBatch(
                farm_id=f2.id,
                harvest_record_id=hist_records[4].id,
                batch_code="BATCH-TRW-202610-002",
                harvest_date=today - timedelta(days=1),
                initial_quantity_kg=Decimal("2050.0"),
                available_quantity_kg=Decimal("2050.0"),
                reserved_quantity_kg=Decimal("0.0"),
                quality_grade="B",
                condition_notes="Segar baru panen kemarin, kadar pati tinggi cocok untuk keripik",
                status="available",
                handling_deadline=today + timedelta(days=3),
                data_origin="simulation",
            ),
        ]
        db.add_all(batches)
        db.flush()

    # 5. Buyers
    if db.query(Buyer).count() == 0:
        buyers_data = [
            Buyer(user_id=buyer_user.id if buyer_user else None, business_name="UMKM Keripik Barokah Trawas", buyer_category="umkm_chips", village_or_area="Ketapanrame, Trawas", contact_phone="081234567891", max_quantity_kg=Decimal("2500.0"), preferred_grade="A", lead_time_days=2, is_verified=True, status="active"),
            Buyer(business_name="Sentra Oleh-Oleh Singkong Renyah", buyer_category="umkm_chips", village_or_area="Duyung, Trawas", contact_phone="081234567892", max_quantity_kg=Decimal("1500.0"), preferred_grade="A", lead_time_days=3, is_verified=True, status="active"),
            Buyer(business_name="Koperasi Pengolah Mocaf Mojokerto", buyer_category="tapioca_factory", village_or_area="Pacet - Mojokerto", contact_phone="081234567893", max_quantity_kg=Decimal("8000.0"), preferred_grade="B", lead_time_days=5, is_verified=True, status="active"),
            Buyer(business_name="Pedagang Pasar Subuh Trawas", buyer_category="fresh_market", village_or_area="Pasar Trawas", contact_phone="081234567894", max_quantity_kg=Decimal("800.0"), preferred_grade="Super", lead_time_days=1, is_verified=True, status="active"),
        ]
        db.add_all(buyers_data)
        db.flush()

    buyers = db.query(Buyer).all()

    # 6. Buyer Needs & Transactions
    if db.query(Transaction).count() == 0 and buyers:
        b1, b2, b3 = buyers[0], buyers[1], buyers[2]
        needs = [
            BuyerNeed(buyer_id=b1.id, needed_from=today, needed_until=today + timedelta(days=7), quantity_kg=Decimal("2000.0"), minimum_grade="A", target_price_per_kg=Decimal("2600.0"), status="confirmed", data_origin="simulation"),
            BuyerNeed(buyer_id=b2.id, needed_from=today + timedelta(days=5), needed_until=today + timedelta(days=12), quantity_kg=Decimal("1200.0"), minimum_grade="A", target_price_per_kg=Decimal("2500.0"), status="planned", data_origin="simulation"),
            BuyerNeed(buyer_id=b3.id, needed_from=today + timedelta(days=10), needed_until=today + timedelta(days=20), quantity_kg=Decimal("5000.0"), minimum_grade="B", target_price_per_kg=Decimal("2300.0"), status="planned", data_origin="simulation"),
        ]
        db.add_all(needs)

        txs = [
            Transaction(buyer_id=b1.id, transaction_date=today - timedelta(days=28), order_date=today - timedelta(days=30), fulfilled_date=today - timedelta(days=28), quantity_ordered_kg=Decimal("1500.0"), quantity_fulfilled_kg=Decimal("1500.0"), unit_price=Decimal("2500.0"), status="fulfilled", data_origin="simulation", notes="Pesanan rutin mingguan"),
            Transaction(buyer_id=b2.id, transaction_date=today - timedelta(days=14), order_date=today - timedelta(days=16), fulfilled_date=today - timedelta(days=14), quantity_ordered_kg=Decimal("1000.0"), quantity_fulfilled_kg=Decimal("1000.0"), unit_price=Decimal("2550.0"), status="fulfilled", data_origin="simulation", notes="Pesanan keripik balado"),
            Transaction(buyer_id=b3.id, transaction_date=today - timedelta(days=7), order_date=today - timedelta(days=10), fulfilled_date=today - timedelta(days=7), quantity_ordered_kg=Decimal("4000.0"), quantity_fulfilled_kg=Decimal("4000.0"), unit_price=Decimal("2300.0"), status="fulfilled", data_origin="simulation", notes="Bahan baku mocaf batch awal"),
            Transaction(buyer_id=b1.id, transaction_date=today, order_date=today, quantity_ordered_kg=Decimal("1800.0"), quantity_fulfilled_kg=Decimal("0.0"), unit_price=Decimal("2600.0"), status="confirmed", data_origin="simulation", notes="Pesanan berjalan untuk stok akhir pekan"),
        ]
        db.add_all(txs)
        db.flush()

    db.commit()

    # 7. Run initial forecasts & recommendations
    SupplyForecaster(db).run()
    DemandForecaster(db).run()
    SmartStockPlanner(db).generate_recommendations()

    return {"message": "Data simulasi rantai pasok Trawas berhasil dimasukkan (berlabel SIMULASI)."}
