export type UserRole = "admin" | "farmer" | "buyer" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Farm {
  id: string;
  owner_user_id: string;
  group_name: string | null;
  village: string;
  area_hectares: number;
  notes: string | null;
}

export interface CropPlan {
  id: string;
  farm_id: string;
  crop_name: string;
  variety: string | null;
  planting_date: string | null;
  expected_harvest_date: string;
  area_hectares: number;
  expected_yield_kg: number | null;
  status: "planned" | "growing" | "ready_to_harvest" | "harvested" | "failed";
  data_origin: "actual" | "manual_estimate" | "simulation";
  notes: string | null;
}

export interface HarvestRecord {
  id: string;
  farm_id: string;
  crop_plan_id: string | null;
  harvest_date: string;
  quantity_kg: number;
  quality_grade: string | null;
  rejected_quantity_kg: number;
  data_origin: string;
  notes: string | null;
}

export interface InventoryBatch {
  id: string;
  farm_id: string;
  harvest_record_id: string | null;
  batch_code: string;
  harvest_date: string;
  initial_quantity_kg: number;
  available_quantity_kg: number;
  reserved_quantity_kg: number;
  quality_grade: string | null;
  condition_notes: string | null;
  status: "available" | "ordered" | "allocated" | "processing" | "sold" | "spoiled" | "discarded";
  handling_deadline: string | null;
  batch_category?: "fresh_tuber" | "preserved_tuber" | "finished_chips";
  preservation_method?: "blanch_frozen" | "cold_storage_paraffin" | "vacuum_sealed" | null;
  storage_location?: string | null;
  shelf_life_months?: number | null;
  data_origin: string;
  created_at: string;
}

export interface Buyer {
  id: string;
  user_id: string | null;
  business_name: string;
  buyer_category: "umkm_chips" | "tapioca_factory" | "fresh_market" | "animal_feed" | "other";
  village_or_area: string;
  contact_phone: string | null;
  max_quantity_kg: number | null;
  preferred_grade: string | null;
  lead_time_days: number | null;
  is_verified: boolean;
  status: string;
}

export interface BuyerNeed {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  needed_from: string;
  needed_until: string;
  quantity_kg: number;
  minimum_grade: string | null;
  target_price_per_kg: number | null;
  status: "planned" | "confirmed" | "cancelled" | "fulfilled";
  data_origin: string;
}

export interface Transaction {
  id: string;
  buyer_id: string;
  buyer_name?: string;
  farmer_id: string | null;
  transaction_date: string;
  order_date: string;
  fulfilled_date: string | null;
  quantity_ordered_kg: number;
  quantity_fulfilled_kg: number;
  unit_price: number;
  total_amount: number;
  delivery_cost: number | null;
  status: "draft" | "confirmed" | "fulfilled" | "cancelled" | "rejected";
  data_origin: string;
  notes: string | null;
}

export interface ForecastPoint {
  id: string;
  period_start: string;
  period_end: string;
  predicted_quantity_kg: number;
  lower_bound_kg: number | null;
  upper_bound_kg: number | null;
  actual_quantity_kg: number | null;
  baseline_quantity_kg: number | null;
}

export interface ForecastRun {
  id: string;
  forecast_type: "supply" | "demand";
  period_start: string;
  period_end: string;
  granularity: string;
  method_name: string;
  model_version: string;
  generated_at: string;
  observations_count: number;
  metrics_json: {
    mae: number;
    rmse: number;
    wape: number;
  } | null;
  quality_status: "reliable" | "low_confidence" | "insufficient_data";
  notes: string | null;
  points: ForecastPoint[];
}

export interface GapPeriodPoint {
  period_start: string;
  period_end: string;
  period_label: string;
  usable_stock_kg: number;
  forecast_harvest_kg: number;
  confirmed_orders_kg: number;
  forecast_demand_kg: number;
  projected_available_supply_kg: number;
  projected_gap_kg: number;
  gap_status: "surplus" | "deficit" | "balanced" | "insufficient_data";
  season?: "rainy" | "dry";
  buffer_preservation_kg?: number;
  buffer_release_kg?: number;
  post_buffer_gap_kg?: number;
  notes: string;
}

export interface GapAnalysisResponse {
  total_usable_stock_kg: number;
  total_forecast_harvest_kg: number;
  total_confirmed_orders_kg: number;
  total_forecast_demand_kg: number;
  overall_net_gap_kg: number;
  periods: GapPeriodPoint[];
  surplus_periods_count: number;
  deficit_periods_count: number;
  data_origin: string;
  generated_at: string;
}

export interface ProcessingOption {
  id: string;
  name: string;
  description: string | null;
  input_unit: string;
  output_unit: string;
  yield_ratio: number;
  capacity_kg_per_day: number;
  labor_cost: number;
  energy_cost: number;
  packaging_cost: number;
  distribution_cost: number;
  other_cost: number;
  expected_selling_price_per_unit: number;
  food_safety_sop_reference: string | null;
  is_active: boolean;
}

export interface StockRecommendation {
  id: string;
  recommendation_type: "sell" | "allocate" | "process" | "preserve" | "release_buffer" | "find_buyer" | "procure";
  batch_id: string | null;
  batch_code: string | null;
  period_start: string;
  period_end: string;
  quantity_kg: number | null;
  reason: string;
  season_context?: "rainy_surplus" | "dry_deficit";
  preservation_method?: string;
  assumptions_json: Record<string, any> | null;
  estimated_cost: number | null;
  estimated_value: number | null;
  status: "pending" | "approved" | "rejected" | "completed" | "expired";
  created_by_system_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
}

export interface SummaryReport {
  total_farms: number;
  total_crop_plans_active: number;
  total_inventory_available_kg: number;
  total_urgent_batches_kg: number;
  total_confirmed_orders_kg: number;
  total_demand_forecast_kg: number;
  projected_gap_kg: number;
  active_recommendations_count: number;
  registered_buyers_count: number;
  data_origin_notice: string;
  generated_at: string;
}

export interface ProcessingCalcResponse {
  input_raw_cassava_kg: number;
  raw_material_cost: number;
  yield_ratio: number;
  output_finished_quantity: number;
  output_unit: string;
  total_processing_cost: number;
  labor_cost_total: number;
  energy_cost_total: number;
  packaging_cost_total: number;
  distribution_cost_total: number;
  other_cost_total: number;
  total_combined_cost: number;
  unit_cost_per_finished_unit: number;
  expected_selling_price_per_unit: number;
  gross_revenue: number;
  estimated_contribution_margin: number;
  margin_percentage: number;
  raw_sale_revenue_comparison: number;
  raw_sale_margin_advantage: number;
  break_even_volume_kg: number | null;
  disclaimer: string;
}

export interface BuyerMatchItem {
  buyer_id: string;
  business_name: string;
  buyer_category: string;
  village_or_area: string;
  score: number;
  matched_reasons: string[];
  volume_match_pct: number;
  target_price_per_kg: number | null;
  contact_phone: string | null;
}

export interface DamageClaim {
  id: string;
  claim_code: string;
  delivery_id: string;
  tracking_code: string;
  buyer_name: string;
  reported_at: string;
  item_type: string;
  total_shipped_kg: number;
  damaged_kg: number;
  breakage_percentage: number;
  damage_type: "remuk_keripik" | "patah_umbi_singkong" | "busuk_ppd_transit" | "kemasan_rusak";
  tolerance_threshold_pct: number;
  is_exceeding_tolerance: boolean;
  photo_url?: string;
  buyer_notes: string;
  status: "diajukan" | "dalam_verifikasi" | "disetujui" | "ditolak";
  compensation_scheme: "potong_faktur_berikutnya" | "kirim_batch_pengganti" | "refund_dana";
  compensation_amount_rp: number;
  reviewed_by?: string;
  review_notes?: string;
}

export interface DeliveryTimelineEvent {
  time: string;
  title: string;
  location: string;
  status: "completed" | "current" | "upcoming";
  note: string;
}

export interface DeliveryOrder {
  id: string;
  tracking_code: string;
  transaction_id?: string;
  buyer_id: string;
  buyer_name: string;
  destination_address: string;
  item_type: "Singkong Segar Grade A" | "Singkong Segar Grade B" | "Keripik Singkong Barokah" | "Tepung Mocaf Duyung";
  quantity_kg: number;
  package_count: number;
  driver_name: string;
  driver_phone: string;
  vehicle_type: string;
  vehicle_plate: string;
  departure_time: string;
  estimated_arrival: string;
  actual_arrival?: string;
  status: "dipersiapkan" | "dalam_perjalanan" | "terkirim" | "ada_klaim";
  current_location: string;
  temperature_c?: number;
  fragile_level: "tinggi_rentan_remuk" | "sedang" | "standar";
  timeline: DeliveryTimelineEvent[];
  claims: DamageClaim[];
}

export interface MarketingCampaign {
  id: string;
  campaign_name: string;
  channel: "whatsapp" | "email" | "katalog_web";
  trigger_source: "otomatis_surplus_panen" | "jadwal_panen_mingguan" | "promosi_olahan_umkm";
  target_segment: string;
  recipient_count: number;
  message_content: string;
  status: "aktif" | "terjadwal" | "terkirim" | "draft";
  sent_at?: string;
  open_rate_pct: number;
  response_rate_pct: number;
  converted_orders_kg: number;
  created_at: string;
}

export interface MarketingAutomationRule {
  id: string;
  rule_name: string;
  condition_description: string;
  action_description: string;
  channel: "whatsapp" | "email" | "katalog_web";
  is_active: boolean;
  total_triggered_count: number;
  last_triggered_at?: string;
}

export interface ClimateSyncLog {
  sync_id: string;
  synced_at: string;
  cycle_type: "weekly_dasarian" | "monthly";
  rainfall_recorded_mm: number;
  soil_status: string;
  detected_season: "rainy" | "dry";
  harvest_advisory: string;
  api_status: "success_200" | "cached";
}

export interface NextWeekForecast {
  week_code: string;
  date_range: string;
  weather_summary: string;
  rainfall_forecast_mm: number;
  rainfall_probability_pct: number;
  temperature_range: string;
  humidity_pct: number;
  soil_condition: string;
  soil_hardness: "gembur" | "sedang" | "keras_kering";
  harvest_feasibility: "sangat_optimal" | "optimal" | "waspada" | "sulit";
  harvest_feasibility_label: string;
  target_harvest_kg: number;
  recommended_buffer_save_kg: number;
  fresh_allocation_kg: number;
  action_guidance: string;
  bmkg_confidence_score: number;
}

export interface SeasonalTransitionPrediction {
  current_season: "rainy" | "dry";
  current_season_label: string;
  season_confidence_pct: number;
  rainfall_monthly_mm: number;
  soil_moisture_pct: number;
  peak_harvest_status: "active" | "approaching" | "ended";
  peak_harvest_window: string;
  next_season: "rainy" | "dry";
  next_season_label: string;
  transition_predicted_date: string;
  weeks_until_transition: number;
  climate_model_source: string;
  sync_interval_mode?: "weekly" | "monthly";
  next_scheduled_sync?: string;
  last_synced_at?: string;
  api_connection_status?: string;
  early_warning_title: string;
  early_warning_message: string;
  recommended_action: string;
  next_week_forecast?: NextWeekForecast;
  sync_history?: ClimateSyncLog[];
  weekly_climate_timeline: {
    week: string;
    date_range: string;
    season: "rainy" | "dry";
    rainfall_mm: number;
    harvest_feasibility: "sangat_tinggi" | "tinggi" | "sedang" | "rendah";
    soil_hardness: "gembur" | "sedang" | "keras_kering";
    action_cue: string;
  }[];
}


