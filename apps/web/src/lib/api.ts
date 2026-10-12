const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cassavaflow_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(!isFormData),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = "Terjadi kesalahan saat memproses data.";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => apiFetch<any>("/auth/me"),

  // Crop Plans & Farms
  getFarms: () => apiFetch<any[]>("/farms"),
  getCropPlans: (params?: { status_filter?: string; farm_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/crop-plans${query ? `?${query}` : ""}`);
  },
  createCropPlan: (data: any) =>
    apiFetch<any>("/crop-plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCropPlan: (id: string, data: any) =>
    apiFetch<any>(`/crop-plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCropPlan: (id: string) =>
    apiFetch<any>(`/crop-plans/${id}`, {
      method: "DELETE",
    }),

  // Harvest Records
  getHarvestRecords: () => apiFetch<any[]>("/harvest-records"),
  createHarvestRecord: (data: any) =>
    apiFetch<any>("/harvest-records", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Inventory Batches
  getInventoryBatches: (params?: { status_filter?: string; grade_filter?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/inventory-batches${query ? `?${query}` : ""}`);
  },
  createInventoryBatch: (data: any) =>
    apiFetch<any>("/inventory-batches", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateInventoryBatch: (id: string, data: any) =>
    apiFetch<any>(`/inventory-batches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Buyers & Buyer Needs
  getBuyers: () => apiFetch<any[]>("/buyers"),
  createBuyer: (data: any) =>
    apiFetch<any>("/buyers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getBuyerNeeds: () => apiFetch<any[]>("/buyer-needs"),
  createBuyerNeed: (data: any) =>
    apiFetch<any>("/buyer-needs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Transactions
  getTransactions: (params?: { status_filter?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<any[]>(`/transactions${query ? `?${query}` : ""}`);
  },
  createTransaction: (data: any) =>
    apiFetch<any>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  importTransactionsCsv: (formData: FormData) =>
    apiFetch<any>("/import/transactions-csv", {
      method: "POST",
      body: formData,
    }),
  getExportTransactionsCsvUrl: () => `${API_BASE_URL}/export/transactions-csv`,

  // Forecasts
  runSupplyForecast: (granularity = "weekly", horizon = 8) =>
    apiFetch<any>("/forecasts/supply/run", {
      method: "POST",
      body: JSON.stringify({ granularity, horizon_periods: horizon }),
    }),
  runDemandForecast: (granularity = "weekly", horizon = 8) =>
    apiFetch<any>("/forecasts/demand/run", {
      method: "POST",
      body: JSON.stringify({ granularity, horizon_periods: horizon }),
    }),
  getLatestForecast: (type: "supply" | "demand") =>
    apiFetch<any>(`/forecasts/${type}/latest`),
  getGapAnalysis: () => apiFetch<any>("/forecasts/gap"),
  getClimatePrediction: () => apiFetch<any>("/forecasts/climate"),

  // Stock Recommendations
  getRecommendations: (status?: string) => {
    const query = status ? `?status_filter=${status}` : "";
    return apiFetch<any[]>(`/stock-recommendations${query}`);
  },
  generateRecommendations: () =>
    apiFetch<any[]>("/stock-recommendations/generate", {
      method: "POST",
    }),
  approveRecommendation: (id: string, reviewNotes?: string, approvedQty?: number) =>
    apiFetch<any>(`/stock-recommendations/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({
        status: "approved",
        review_notes: reviewNotes,
        approved_quantity_kg: approvedQty,
      }),
    }),
  rejectRecommendation: (id: string, reviewNotes?: string) =>
    apiFetch<any>(`/stock-recommendations/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({
        status: "rejected",
        review_notes: reviewNotes,
      }),
    }),
  completeRecommendation: (id: string) =>
    apiFetch<any>(`/stock-recommendations/${id}/complete`, {
      method: "POST",
    }),

  // Processing Options & Calculator
  getProcessingOptions: () => apiFetch<any[]>("/processing-options"),
  estimateProcessingCost: (data: any) =>
    apiFetch<any>("/processing-calculator/estimate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Buyer Matches (P1)
  getBuyerMatches: (batchId?: string) => {
    const query = batchId ? `?batch_id=${batchId}` : "";
    return apiFetch<any>(`/buyer-matches${query}`);
  },

  // Reports & System Seed
  getSummaryReport: () => apiFetch<any>("/reports/summary"),
  seedSystem: () =>
    apiFetch<any>("/system/seed", {
      method: "POST",
    }),

  // Delivery Tracking & Damage/Breakage Claims (Lapisan Sistem Informasi Logistik)
  getDeliveries: () => apiFetch<any[]>("/deliveries"),
  createDelivery: (data: any) =>
    apiFetch<any>("/deliveries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDamageClaims: () => apiFetch<any[]>("/damage-claims"),
  createDamageClaim: (data: any) =>
    apiFetch<any>("/damage-claims", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  reviewDamageClaim: (claimId: string, action: "approve" | "reject", notes?: string, compAmount?: number) =>
    apiFetch<any>(`/damage-claims/${claimId}/review`, {
      method: "POST",
      body: JSON.stringify({ action, notes, compensation_amount: compAmount }),
    }),

  // Marketing Automation & Broadcast (Lapisan Sistem Informasi Pemasaran)
  getMarketingCampaigns: () => apiFetch<any[]>("/marketing-campaigns"),
  createMarketingCampaign: (data: any) =>
    apiFetch<any>("/marketing-campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendMarketingCampaign: (campaignId: string) =>
    apiFetch<any>(`/marketing-campaigns/${campaignId}/send`, {
      method: "POST",
    }),
  getMarketingRules: () => apiFetch<any[]>("/marketing-automation-rules"),
  toggleMarketingRule: (ruleId: string) =>
    apiFetch<any>(`/marketing-automation-rules/${ruleId}/toggle`, {
      method: "POST",
    }),
};
