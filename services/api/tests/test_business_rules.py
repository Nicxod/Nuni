from decimal import Decimal
from datetime import date, timedelta
import pytest
from app.schemas.schemas import ProcessingCalculationRequest
from app.recommendations.engine import ProcessingCostCalculator
from app.forecasting.engine import calculate_metrics
import numpy as np


def test_calculate_metrics():
    y_true = np.array([100.0, 200.0, 300.0])
    y_pred = np.array([110.0, 190.0, 310.0])
    metrics = calculate_metrics(y_true, y_pred)
    assert metrics["mae"] == 10.0
    assert metrics["rmse"] == 10.0
    assert abs(metrics["wape"] - (30.0 / 600.0)) < 0.001


def test_processing_calculator_deterministic_decimal():
    req = ProcessingCalculationRequest(
        input_raw_cassava_kg=Decimal("1000.0"),
        raw_cassava_price_per_kg=Decimal("2500.0"),
        yield_ratio=Decimal("0.40"),
        expected_selling_price_per_unit=Decimal("15000.0"),
        labor_cost=Decimal("600.0"),
        energy_cost=Decimal("400.0"),
        packaging_cost=Decimal("500.0"),
        distribution_cost=Decimal("250.0"),
        other_cost=Decimal("150.0"),
    )
    res = ProcessingCostCalculator.calculate(req, None)

    # Raw material cost: 1000 * 2500 = 2,500,000
    assert res.raw_material_cost == Decimal("2500000.0")
    # Finished quantity: 1000 * 0.40 = 400 kg/pack
    assert res.output_finished_quantity == Decimal("400.0")
    # Processing costs per kg: 600 + 400 + 500 + 250 + 150 = 1900
    # Total processing cost: 1000 * 1900 = 1,900,000
    assert res.total_processing_cost == Decimal("1900000.0")
    # Total combined cost: 2,500,000 + 1,900,000 = 4,400,000
    assert res.total_combined_cost == Decimal("4400000.0")
    # Gross revenue: 400 * 15,000 = 6,000,000
    assert res.gross_revenue == Decimal("6000000.0")
    # Contribution margin: 6,000,000 - 4,400,000 = 1,600,000
    assert res.estimated_contribution_margin == Decimal("1600000.0")
    # If sold raw: 1000 * 2500 = 2,500,000
    assert res.raw_sale_revenue_comparison == Decimal("2500000.0")
    assert res.margin_percentage > Decimal("20.0")


def test_non_negative_validation():
    with pytest.raises(Exception):
        ProcessingCalculationRequest(
            input_raw_cassava_kg=Decimal("-500.0"),
            raw_cassava_price_per_kg=Decimal("2500.0"),
        )
