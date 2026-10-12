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

  // 1. Export Transactions CSV
  if (
    path === "export/transactions-csv" ||
    path === "export/transactions.csv" ||
    path === "transactions/export"
  ) {
    let txList: any[] = [];
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=transaction_date.desc`, {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          txList = data;
        }
      }
    } catch (err) {
      console.warn("Supabase tx fetch for CSV export fallback:", err);
    }

    if (txList.length === 0) {
      txList = mockTransactions;
    }

    // Map buyer names
    const buyerMap = new Map<string, string>();
    mockBuyers.forEach((b) => buyerMap.set(b.id, b.business_name));
    try {
      const bRes = await fetch(`${SUPABASE_URL}/rest/v1/buyers?select=id,business_name`, {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        if (Array.isArray(bData)) {
          bData.forEach((b) => buyerMap.set(b.id, b.business_name));
        }
      }
    } catch {
      // ignore
    }

    const headers = [
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
    ];

    const rows = txList.map((t) => {
      const buyerName = t.buyer_name || buyerMap.get(t.buyer_id) || "Pembeli Trawas";
      const qtyOrdered = Number(t.quantity_ordered_kg || 0);
      const qtyFulfilled = Number(t.quantity_fulfilled_kg || 0);
      const unitPrice = Number(t.unit_price || 0);
      const totalAmount = Number(t.total_amount || qtyOrdered * unitPrice);
      const notes = (t.notes || "").replace(/"/g, '""');
      return [
        `"${t.id}"`,
        `"${buyerName}"`,
        `"${t.transaction_date || t.order_date || ""}"`,
        qtyOrdered,
        qtyFulfilled,
        unitPrice,
        totalAmount,
        `"${t.status || "confirmed"}"`,
        `"${t.data_origin || "simulation"}"`,
        `"${notes}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions_trawas_simulasi.csv"',
        "Cache-Control": "no-cache",
      },
    });
  }

  // 2. Buyer Matches (P1)
  if (path === "buyer-matches") {
    let buyerList = mockBuyers;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/buyers?select=*`, {
        headers: supabaseHeaders,
        next: { revalidate: 0 },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          buyerList = data;
        }
      }
    } catch {
      // ignore
    }

    const matches = buyerList.map((b) => {
      const isChips = b.buyer_category === "umkm_chips";
      const isFactory = b.buyer_category === "tapioca_factory";
      const score = isChips ? 95 : isFactory ? 88 : 78;
      const reasons = isChips
        ? [
            "Kualitas Grade A cocok untuk irisan keripik renyah",
            "Kapasitas beli sesuai proyeksi panen Trawas (5.000 kg)",
            "Lokasi dekat sentra UMKM Desa Ketapanrame",
          ]
        : isFactory
        ? [
            "Menerima volume besar (>15.000 kg)",
            "Toleransi variasi ukuran umbi",
            "Pembayaran tempo terjadwal",
          ]
        : ["Penyerapan konsisten untuk kebutuhan pasar lokal"];

      return {
        buyer_id: b.id,
        business_name: b.business_name,
        buyer_category: b.buyer_category,
        village_or_area: b.village_or_area,
        score,
        matched_reasons: reasons,
        volume_match_pct: isChips ? 100 : 85,
        target_price_per_kg: isChips ? 2800 : 2500,
        contact_phone: b.contact_phone,
      };
    });

    return NextResponse.json({ matches });
  }

  // 3. Harvest Records
  if (path === "harvest-records") {
    return NextResponse.json([
      {
        id: "hr-1",
        crop_plan_id: "cp-1",
        farm_name: "Poktan Trawas Makmur - Blok A",
        harvest_date: "2026-10-09",
        actual_quantity_kg: 5000,
        quality_grade: "A",
        recorded_at: "2026-10-09T08:00:00Z",
        notes: "Hasil panen segar pagi hari",
      },
    ]);
  }

  // 4. Check Supabase Table Mapping
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

  // 5. Fallback Mock Data Endpoints
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
      total_farms: 3,
      total_crop_plans_active: 4,
      total_inventory_available_kg: 7700,
      total_urgent_batches_kg: 4200,
      total_confirmed_orders_kg: 4000,
      total_demand_forecast_kg: 74100,
      projected_gap_kg: 5200,
      active_recommendations_count: 2,
      registered_buyers_count: 3,
      data_origin_notice: "simulation",
      generated_at: "2026-10-12T08:00:00.000Z",
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

  // 1. CSV Import for Transactions
  if (path === "import/transactions-csv") {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ detail: "File CSV tidak ditemukan." }, { status: 400 });
      }

      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      let successCount = 0;
      let failCount = 0;
      const errorList: string[] = [];

      // Parse lines (skipping header)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        try {
          const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
          if (parts.length >= 4) {
            const newTx = {
              id: "tx-imp-" + Date.now() + "-" + i,
              buyer_id: mockBuyers[0].id,
              buyer_name: parts[1] || "Pembeli CSV",
              transaction_date: parts[2] || new Date().toISOString().split("T")[0],
              order_date: parts[2] || new Date().toISOString().split("T")[0],
              quantity_ordered_kg: Number(parts[3] || 1000),
              quantity_fulfilled_kg: Number(parts[4] || parts[3] || 1000),
              unit_price: Number(parts[5] || 2500),
              total_amount: Number(parts[6] || Number(parts[3] || 1000) * Number(parts[5] || 2500)),
              status: parts[7] || "confirmed",
              data_origin: "simulation",
              notes: `Impor dari file CSV: ${file.name}`,
            };
            mockTransactions.unshift(newTx as any);

            // Attempt Supabase insert
            try {
              await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
                method: "POST",
                headers: supabaseHeaders,
                body: JSON.stringify({
                  id: newTx.id,
                  buyer_id: newTx.buyer_id,
                  transaction_date: newTx.transaction_date,
                  order_date: newTx.order_date,
                  quantity_ordered_kg: newTx.quantity_ordered_kg,
                  quantity_fulfilled_kg: newTx.quantity_fulfilled_kg,
                  unit_price: newTx.unit_price,
                  status: newTx.status,
                  data_origin: "simulation",
                  notes: newTx.notes,
                }),
              });
            } catch {
              // ignore
            }

            successCount++;
          }
        } catch (err: any) {
          failCount++;
          errorList.push(`Baris ${i + 1}: ${err.message}`);
        }
      }

      return NextResponse.json({
        total_rows: lines.length - 1,
        successful_rows: successCount,
        failed_rows: failCount,
        errors: errorList,
        message: `Impor CSV selesai. ${successCount} transaksi berhasil dimasukkan.`,
      });
    } catch (err: any) {
      return NextResponse.json({ detail: "Gagal memproses file CSV: " + err.message }, { status: 500 });
    }
  }

  // Parse JSON Body
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // empty body
  }

  // 2. Stock Recommendation Approval / Rejection
  if (path.startsWith("stock-recommendations/") && path.endsWith("/approve")) {
    const recId = path.split("/")[1];
    const rec = mockStockActions.find((r) => r.id === recId) as any;
    if (rec) {
      rec.status = "approved";
      rec.review_notes = body.review_notes || "Disetujui pengguna";
      rec.reviewed_at = new Date().toISOString();
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stock_recommendations?id=eq.${recId}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({
          status: "approved",
          review_notes: body.review_notes || "Disetujui pengguna",
          reviewed_at: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore
    }
    return NextResponse.json(rec || { success: true, status: "approved" });
  }

  if (path.startsWith("stock-recommendations/") && path.endsWith("/reject")) {
    const recId = path.split("/")[1];
    const rec = mockStockActions.find((r) => r.id === recId) as any;
    if (rec) {
      rec.status = "rejected";
      rec.review_notes = body.review_notes || "Ditolak pengguna";
      rec.reviewed_at = new Date().toISOString();
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stock_recommendations?id=eq.${recId}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({
          status: "rejected",
          review_notes: body.review_notes || "Ditolak pengguna",
          reviewed_at: new Date().toISOString(),
        }),
      });
    } catch {
      // ignore
    }
    return NextResponse.json(rec || { success: true, status: "rejected" });
  }

  if (path.startsWith("stock-recommendations/") && path.endsWith("/complete")) {
    const recId = path.split("/")[1];
    const rec = mockStockActions.find((r) => r.id === recId) as any;
    if (rec) {
      rec.status = "completed";
    }
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/stock_recommendations?id=eq.${recId}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({ status: "completed" }),
      });
    } catch {
      // ignore
    }
    return NextResponse.json(rec || { success: true, status: "completed" });
  }

  // 3. Write directly to Supabase if table matches
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

  // 4. Specialized Handlers
  if (path === "auth/login") {
    return NextResponse.json({
      access_token: "mock-jwt-token-resilokal",
      user: {
        name: body.email?.includes("admin") ? "Admin ResiLokal" : "Pak Slamet (Ketua Poktan)",
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
  if (path === "buyers") {
    const newBuyer = {
      id: "buyer-" + Date.now(),
      is_verified: true,
      status: "active",
      ...body,
      data_origin: "simulation",
    };
    mockBuyers.unshift(newBuyer);
    return NextResponse.json(newBuyer);
  }
  if (path === "transactions") {
    const newTx = {
      id: "tx-" + Date.now(),
      order_date: body.order_date || body.transaction_date || new Date().toISOString().split("T")[0],
      transaction_date: body.transaction_date || new Date().toISOString().split("T")[0],
      ...body,
      data_origin: "simulation",
    };
    mockTransactions.unshift(newTx);
    return NextResponse.json(newTx);
  }
  if (path === "processing-calculator/estimate") {
    const rawQty = Number(body.input_raw_cassava_kg || body.raw_material_qty_kg || 1000);
    const rawPrice = Number(body.raw_cassava_price_per_kg || 2500);
    const optionId = body.processing_option_id;
    const opt = mockProcessingOptions.find((o) => o.id === optionId) || mockProcessingOptions[0];

    const yieldRatio = Number(opt.yield_ratio || 0.4);
    const outputUnits = Math.round(rawQty * yieldRatio);
    const outputUnit = opt.output_unit || "pack";
    const laborCostTotal = Math.round(rawQty * Number(opt.labor_cost || 600));
    const energyCostTotal = Math.round(rawQty * Number(opt.energy_cost || 400));
    const packagingCostTotal = Math.round(rawQty * Number(opt.packaging_cost || 500));
    const distributionCostTotal = Math.round(rawQty * Number(opt.distribution_cost || 250));
    const otherCostTotal = Math.round(rawQty * Number(opt.other_cost || 150));
    const totalProcessingCost = laborCostTotal + energyCostTotal + packagingCostTotal + distributionCostTotal + otherCostTotal;

    const rawMaterialCost = Math.round(rawQty * rawPrice);
    const totalCombinedCost = rawMaterialCost + totalProcessingCost;
    const sellingPricePerUnit = Number(opt.expected_selling_price_per_unit || 15000);
    const grossRevenue = Math.round(outputUnits * sellingPricePerUnit);
    const rawSaleRevenue = Math.round(rawQty * rawPrice);
    const estimatedMargin = grossRevenue - totalCombinedCost;
    const marginPct = grossRevenue > 0 ? Number(((estimatedMargin / grossRevenue) * 100).toFixed(1)) : 0;
    const unitCost = outputUnits > 0 ? Math.round(totalCombinedCost / outputUnits) : 0;
    const netValueAdded = grossRevenue - rawSaleRevenue - totalProcessingCost;

    return NextResponse.json({
      input_raw_cassava_kg: rawQty,
      raw_material_cost: rawMaterialCost,
      yield_ratio: yieldRatio,
      output_finished_quantity: outputUnits,
      output_unit: outputUnit,
      total_processing_cost: totalProcessingCost,
      labor_cost_total: laborCostTotal,
      energy_cost_total: energyCostTotal,
      packaging_cost_total: packagingCostTotal,
      distribution_cost_total: distributionCostTotal,
      other_cost_total: otherCostTotal,
      total_combined_cost: totalCombinedCost,
      unit_cost_per_finished_unit: unitCost,
      expected_selling_price_per_unit: sellingPricePerUnit,
      gross_revenue: grossRevenue,
      estimated_contribution_margin: estimatedMargin,
      margin_percentage: marginPct,
      raw_sale_revenue_comparison: rawSaleRevenue,
      net_value_added_vs_raw: netValueAdded,
      disclaimer: "Simulasi margin mengacu pada baseline rendemen dan struktur biaya olahan lokal Trawas.",
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
  const { slug } = await params;
  const path = slug.join("/");
  const body = await request.json().catch(() => ({}));

  // Handle /crop-plans/:id
  if (path.startsWith("crop-plans/")) {
    const id = path.split("/")[1];
    const plan = mockCropPlans.find((p) => p.id === id);
    if (plan) Object.assign(plan, body);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/crop_plans?id=eq.${id}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify(body),
      });
    } catch {
      // ignore
    }
    return NextResponse.json(plan || { success: true, ...body });
  }

  // Handle /inventory-batches/:id
  if (path.startsWith("inventory-batches/")) {
    const id = path.split("/")[1];
    const batch = mockInventoryBatches.find((b) => b.id === id);
    if (batch) Object.assign(batch, body);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_batches?id=eq.${id}`, {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify(body),
      });
    } catch {
      // ignore
    }
    return NextResponse.json(batch || { success: true, ...body });
  }

  return NextResponse.json({ success: true, ...body });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/");

  // Delete crop plan
  if (path.startsWith("crop-plans/")) {
    const id = path.split("/")[1];
    const idx = mockCropPlans.findIndex((p) => p.id === id);
    if (idx !== -1) mockCropPlans.splice(idx, 1);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/crop_plans?id=eq.${id}`, {
        method: "DELETE",
        headers: supabaseHeaders,
      });
    } catch (err) {
      console.warn("Supabase delete crop_plan error:", err);
    }
    return NextResponse.json({ success: true, message: "Rencana tanam/panen berhasil dihapus." });
  }

  // Delete inventory batch
  if (path.startsWith("inventory-batches/")) {
    const id = path.split("/")[1];
    const idx = mockInventoryBatches.findIndex((b) => b.id === id);
    if (idx !== -1) mockInventoryBatches.splice(idx, 1);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/inventory_batches?id=eq.${id}`, {
        method: "DELETE",
        headers: supabaseHeaders,
      });
    } catch (err) {
      console.warn("Supabase delete inventory_batch error:", err);
    }
    return NextResponse.json({ success: true, message: "Batch stok berhasil dihapus." });
  }

  return NextResponse.json({ success: true, message: "Item deleted" });
}
