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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ketlojcjikrchzlmrufz.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtldGxvamNqaWtyY2h6bG1ydWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MzA1NzYsImV4cCI6MjEwNzMwNjU3Nn0.WYYvncMKMB2U8DoiI367uts1jA9ZGWEQ5W8dBHZu3Gk";

const supabaseHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

const tableMap: Record<string, string> = {
  farms: "farms",
  "crop-plans": "crop_plans",
  "inventory-batches": "inventory_batches",
  buyers: "buyers",
  "buyer-needs": "buyer_needs",
  transactions: "transactions",
  "processing-options": "processing_options",
  "stock-recommendations": "stock_recommendations",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");

  // Check Supabase Table Mapping
  const sbTable = tableMap[path];
  if (sbTable) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${sbTable}?select=*`, {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (err) {
      console.warn("Supabase fetch fallback:", err);
    }
  }

  // Self-contained simulation and analytics endpoints
  if (path === "farms") return NextResponse.json(mockFarms);
  if (path === "crop-plans") return NextResponse.json(mockCropPlans);
  if (path === "inventory-batches") return NextResponse.json(mockInventoryBatches);
  if (path === "buyers") return NextResponse.json(mockBuyers);
  if (path === "buyer-needs") return NextResponse.json(mockBuyerNeeds);
  if (path === "transactions") return NextResponse.json(mockTransactions);
  if (path === "processing-options") return NextResponse.json(mockProcessingOptions);
  if (path === "stock-recommendations") return NextResponse.json(mockStockActions);

  if (path === "forecasts/supply/latest") {
    return NextResponse.json(mockSupplyForecast);
  }
  if (path === "forecasts/demand/latest") {
    return NextResponse.json(mockDemandForecast);
  }
  if (path === "forecasts/gap") {
    return NextResponse.json(mockGapAnalysis);
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

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // empty body
  }

  // Write directly to Supabase if table matches
  const sbTable = tableMap[path];
  if (sbTable) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${sbTable}`, {
        method: "POST",
        headers: {
          ...supabaseHeaders,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          ...body,
          id: body.id || (typeof crypto !== "undefined" ? crypto.randomUUID() : "item-" + Date.now()),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data[0] || data);
      }
    } catch (err) {
      console.warn("Supabase insert fallback:", err);
    }
  }

  // Fallback handlers
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
    const newPlan = { id: "cp-" + Date.now(), ...body, data_origin: "simulation" };
    mockCropPlans.unshift(newPlan);
    return NextResponse.json(newPlan);
  }
  if (path === "inventory-batches") {
    const newBatch = { id: "bt-" + Date.now(), ...body, data_origin: "simulation" };
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
