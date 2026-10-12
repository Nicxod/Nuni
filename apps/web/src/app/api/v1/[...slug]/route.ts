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
  mockDeliveries,
  mockMarketingCampaigns,
  mockMarketingAutomationRules,
  mockSeasonalClimatePrediction,
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

async function getDynamicSupplyForecast() {
  let plans = mockCropPlans;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/crop_plans?select=*`, {
      headers: supabaseHeaders,
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        plans = data;
      }
    }
  } catch {
    // ignore
  }

  const weeks = [
    { start: "2026-10-11", end: "2026-10-17" },
    { start: "2026-10-18", end: "2026-10-24" },
    { start: "2026-10-25", end: "2026-10-31" },
    { start: "2026-11-01", end: "2026-11-07" },
    { start: "2026-11-08", end: "2026-11-14" },
    { start: "2026-11-15", end: "2026-11-21" },
    { start: "2026-11-22", end: "2026-11-28" },
    { start: "2026-11-29", end: "2026-12-05" },
  ];

  const points = weeks.map((w) => {
    const matchingPlans = plans.filter((p) => {
      const date = p.expected_harvest_date;
      return date && date >= w.start && date <= w.end;
    });

    const harvestKg = matchingPlans.reduce(
      (sum, p) => sum + Number(p.expected_yield_kg || 0),
      0
    );

    const baseline = 1200;
    const predicted = harvestKg > 0 ? harvestKg : baseline;
    const upper = Math.round(predicted * 1.15);
    const lower = Math.round(predicted * 0.85);

    return {
      period_start: w.start,
      period_end: w.end,
      predicted_quantity_kg: predicted,
      upper_bound_kg: upper,
      lower_bound_kg: lower,
      baseline_quantity_kg: baseline,
    };
  });

  return {
    ...mockSupplyForecast,
    points,
  };
}

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
  if (path === "deliveries") return NextResponse.json(mockDeliveries);
  if (path === "damage-claims") return NextResponse.json(mockDeliveries.flatMap((d) => d.claims || []));
  if (path === "marketing-campaigns") return NextResponse.json(mockMarketingCampaigns);
  if (path === "marketing-automation-rules") return NextResponse.json(mockMarketingAutomationRules);

  if (path === "forecasts/supply/latest") {
    return NextResponse.json(await getDynamicSupplyForecast());
  }
  if (path === "forecasts/demand/latest") {
    return NextResponse.json(mockDemandForecast);
  }
  if (path === "forecasts/gap") {
    return NextResponse.json(mockGapAnalysis);
  }
  if (path === "forecasts/climate" || path === "climate/seasonal-forecast") {
    return NextResponse.json(mockSeasonalClimatePrediction);
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
    return NextResponse.json(await getDynamicSupplyForecast());
  }
  if (path === "forecasts/demand/run") {
    return NextResponse.json(mockDemandForecast);
  }
  if (path === "forecasts/climate/sync") {
    const interval = body?.interval_mode || "weekly";
    const nowStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const newSyncEntry = {
      sync_id: "SYNC-" + Date.now(),
      synced_at: `${nowStr} WIB (Siklus Mingguan Dasarian)`,
      cycle_type: (interval === "weekly" ? "weekly_dasarian" : "monthly") as any,
      rainfall_recorded_mm: 68,
      soil_status: "Lembap Gembur (Optimal Cabut Umbi)",
      detected_season: "rainy" as const,
      harvest_advisory: "Puncak panen hujan aktif (W1-W3). Segera alokasikan preservasi umbi 4.200 kg sebelum kemarau W4.",
      api_status: "success_200" as const,
    };
    if (mockSeasonalClimatePrediction.sync_history) {
      mockSeasonalClimatePrediction.sync_history.unshift(newSyncEntry);
    }
    mockSeasonalClimatePrediction.last_synced_at = `${nowStr} WIB`;
    mockSeasonalClimatePrediction.sync_interval_mode = interval as any;
    return NextResponse.json({
      success: true,
      message: `Data cuaca BMKG Trawas berhasil disinkronkan (${interval === "weekly" ? "Interval Mingguan / Dasarian 7-10 Hari" : "Interval Bulanan"}).`,
      climate_prediction: mockSeasonalClimatePrediction,
    });
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

  // 5. Deliveries & Damage Claims Handlers
  if (path === "deliveries") {
    const newDel = {
      id: "del-" + Date.now(),
      tracking_code: `TRW-LOG-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 90 + 10)}`,
      departure_time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      status: "dalam_perjalanan",
      current_location: "Berangkat dari Pos Pengumpul Trawas",
      temperature_c: 24.8,
      timeline: [
        {
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
          title: "Surat Jalan Logistik Diaktifkan",
          location: "Pos Pengumpul Trawas",
          status: "completed",
          note: "Armada diberangkatkan ke lokasi penerima.",
        },
      ],
      claims: [],
      ...body,
    };
    mockDeliveries.unshift(newDel as any);
    return NextResponse.json(newDel);
  }

  if (path === "damage-claims") {
    const targetDel = mockDeliveries.find((d) => d.id === body.delivery_id || d.tracking_code === body.tracking_code) || mockDeliveries[0];
    const newClaim = {
      id: "clm-" + Date.now(),
      claim_code: `CLM-TRW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 90 + 10)}`,
      reported_at: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) + " " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      status: "diajukan",
      tolerance_threshold_pct: 5.0,
      is_exceeding_tolerance: Number(body.breakage_percentage || 0) > 5.0,
      compensation_scheme: body.compensation_scheme || "potong_faktur_berikutnya",
      compensation_amount_rp: Number(body.compensation_amount_rp || (Number(body.damaged_kg || 0) * 15000)),
      ...body,
    };
    if (targetDel) {
      (targetDel as any).status = "ada_klaim";
      if (!(targetDel as any).claims) (targetDel as any).claims = [];
      ((targetDel as any).claims as any[]).unshift(newClaim);
    }
    return NextResponse.json(newClaim);
  }

  if (path.startsWith("damage-claims/") && path.endsWith("/review")) {
    const claimId = path.split("/")[1];
    let foundClaim: any = null;
    for (const d of mockDeliveries) {
      const c = (d.claims || []).find((item: any) => item.id === claimId);
      if (c) {
        c.status = body.action === "approve" ? "disetujui" : "ditolak";
        c.review_notes = body.notes || (body.action === "approve" ? "Klaim disetujui sesuai SOP Garansi Renyah" : "Ditolak karena kerusakan di bawah batas toleransi SOP 5%");
        c.reviewed_by = "Koordinator Logistik ResiLokal";
        if (body.compensation_amount) c.compensation_amount_rp = body.compensation_amount;
        foundClaim = c;
        break;
      }
    }
    return NextResponse.json(foundClaim || { success: true });
  }

  // 6. Marketing Automation Handlers
  if (path === "marketing-campaigns") {
    const newCamp = {
      id: "camp-" + Date.now(),
      created_at: new Date().toISOString(),
      status: "aktif",
      sent_at: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      open_rate_pct: 85.0,
      response_rate_pct: 60.0,
      converted_orders_kg: 2500,
      ...body,
    };
    mockMarketingCampaigns.unshift(newCamp as any);
    return NextResponse.json(newCamp);
  }

  if (path.startsWith("marketing-campaigns/") && path.endsWith("/send")) {
    const campId = path.split("/")[1];
    const camp = mockMarketingCampaigns.find((c) => c.id === campId);
    if (camp) {
      camp.status = "terkirim";
      camp.sent_at = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
      camp.open_rate_pct = 96.5;
      camp.response_rate_pct = 72.0;
    }
    return NextResponse.json({ success: true, message: "Broadcast kampanye berhasil dikirim ke mitra." });
  }

  if (path.startsWith("marketing-automation-rules/") && path.endsWith("/toggle")) {
    const ruleId = path.split("/")[1];
    const rule = mockMarketingAutomationRules.find((r) => r.id === ruleId);
    if (rule) {
      rule.is_active = !rule.is_active;
      if (rule.is_active) {
        rule.total_triggered_count += 1;
        rule.last_triggered_at = "Baru saja aktif";
      }
    }
    return NextResponse.json({ success: true, is_active: rule?.is_active });
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
