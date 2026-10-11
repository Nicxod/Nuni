import { NextRequest, NextResponse } from "next/server";
import {
  mockFarms,
  mockCropPlans,
  mockInventoryBatches,
  mockSupplyForecast,
  mockDemandForecast,
  mockGapAnalysis,
  mockBuyers,
  mockBuyerNeeds,
  mockStockActions,
  mockTransactions,
  mockProcessingOptions,
} from "@/lib/mockData";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");

  // Optional: Try proxying to external backend if API_BACKEND_URL is set
  const externalBackend = process.env.API_BACKEND_URL;
  if (externalBackend && !externalBackend.includes("localhost")) {
    try {
      const search = request.nextUrl.search;
      const targetUrl = `${externalBackend}/api/v1/${path}${search}`;
      const res = await fetch(targetUrl, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback to internal simulation data
    }
  }

  // Self-contained simulation data router
  if (path === "farms") {
    return NextResponse.json(mockFarms);
  }
  if (path === "crop-plans") {
    return NextResponse.json(mockCropPlans);
  }
  if (path === "inventory-batches") {
    return NextResponse.json(mockInventoryBatches);
  }
  if (path === "forecasts/supply/latest") {
    return NextResponse.json(mockSupplyForecast);
  }
  if (path === "forecasts/demand/latest") {
    return NextResponse.json(mockDemandForecast);
  }
  if (path === "forecasts/gap") {
    return NextResponse.json(mockGapAnalysis);
  }
  if (path === "stock-recommendations") {
    return NextResponse.json(mockStockActions);
  }
  if (path === "buyers") {
    return NextResponse.json(mockBuyers);
  }
  if (path === "buyer-needs") {
    return NextResponse.json(mockBuyerNeeds);
  }
  if (path === "transactions") {
    return NextResponse.json(mockTransactions);
  }
  if (path === "processing-options") {
    return NextResponse.json(mockProcessingOptions);
  }
  if (path === "reports/summary") {
    return NextResponse.json({
      usable_stock_kg: 7700,
      forecast_harvest_kg: 18000,
      confirmed_orders_kg: 4000,
      forecast_demand_kg: 12500,
      net_gap_kg: 5200,
      gap_status: "surplus",
      urgent_batches_count: 2,
    });
  }
  if (path === "auth/me") {
    return NextResponse.json({
      name: "Pak Slamet (Ketua Poktan Trawas)",
      email: "petani@resilokal.id",
      role: "farmer",
    });
  }

  return NextResponse.json({ message: "ResiLokal API endpoint ready" });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");

  // Try proxying to external backend if API_BACKEND_URL is set
  const externalBackend = process.env.API_BACKEND_URL;
  if (externalBackend && !externalBackend.includes("localhost")) {
    try {
      const body = await request.json().catch(() => ({}));
      const targetUrl = `${externalBackend}/api/v1/${path}`;
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // empty body
  }

  if (path === "auth/login") {
    return NextResponse.json({
      access_token: "mock-jwt-token-resilokal",
      user: {
        name: body.email?.includes("admin") ? "Admin ResiLokal" : "Pak Slamet",
        email: body.email || "petani@resilokal.id",
        role: body.email?.includes("admin") ? "admin" : "farmer",
      },
    });
  }
  if (path === "forecasts/supply/run") {
    return NextResponse.json(mockSupplyForecast);
  }
  if (path === "forecasts/demand/run") {
    return NextResponse.json(mockDemandForecast);
  }
  if (path === "stock-recommendations/generate") {
    return NextResponse.json(mockStockActions);
  }
  if (path === "crop-plans") {
    const newPlan = {
      id: "cp-" + Date.now(),
      ...body,
      data_origin: "simulation",
    };
    mockCropPlans.unshift(newPlan);
    return NextResponse.json(newPlan);
  }
  if (path === "inventory-batches") {
    const newBatch = {
      id: "bt-" + Date.now(),
      ...body,
      data_origin: "simulation",
    };
    mockInventoryBatches.unshift(newBatch);
    return NextResponse.json(newBatch);
  }
  if (path === "processing-calculator/estimate") {
    const rawQty = Number(body.raw_material_qty_kg || 1000);
    const yieldRatio = Number(body.yield_ratio || 0.4);
    const sellingPrice = Number(body.expected_selling_price || 15000);
    const outputUnits = rawQty * yieldRatio;
    const grossRev = outputUnits * sellingPrice;
    const totalCost = rawQty * 2500;
    return NextResponse.json({
      raw_material_qty_kg: rawQty,
      estimated_output_units: outputUnits,
      gross_revenue: grossRev,
      total_processing_cost: totalCost,
      estimated_contribution_margin: grossRev - totalCost,
      margin_percentage: ((grossRev - totalCost) / (grossRev || 1)) * 100,
    });
  }
  if (path === "system/seed") {
    return NextResponse.json({
      message: "Data simulasi rantai pasok Trawas ResiLokal berhasil dimuat ulang.",
    });
  }

  return NextResponse.json({ success: true, ...body });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ success: true, ...body });
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Item deleted" });
}
