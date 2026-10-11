
CREATE TABLE forecast_runs (
	id VARCHAR(36) NOT NULL, 
	forecast_type VARCHAR(50) NOT NULL, 
	period_start DATE NOT NULL, 
	period_end DATE NOT NULL, 
	granularity VARCHAR(50) NOT NULL, 
	method_name VARCHAR(100) NOT NULL, 
	model_version VARCHAR(50) NOT NULL, 
	generated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	observations_count INTEGER NOT NULL, 
	metrics_json JSON, 
	quality_status VARCHAR(50) NOT NULL, 
	input_snapshot_json JSON, 
	notes TEXT, 
	PRIMARY KEY (id)
)

;

CREATE TABLE processing_options (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	input_unit VARCHAR(50) NOT NULL, 
	output_unit VARCHAR(50) NOT NULL, 
	yield_ratio NUMERIC(6, 4), 
	capacity_kg_per_day NUMERIC(12, 2), 
	labor_cost NUMERIC(12, 2) NOT NULL, 
	energy_cost NUMERIC(12, 2) NOT NULL, 
	packaging_cost NUMERIC(12, 2) NOT NULL, 
	distribution_cost NUMERIC(12, 2) NOT NULL, 
	other_cost NUMERIC(12, 2) NOT NULL, 
	expected_selling_price_per_unit NUMERIC(12, 2) NOT NULL, 
	food_safety_sop_reference VARCHAR(255), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE TABLE weather_observations (
	id VARCHAR(36) NOT NULL, 
	location_label VARCHAR(100) NOT NULL, 
	observation_date DATE NOT NULL, 
	rainfall_mm NUMERIC(8, 2), 
	source_name VARCHAR(100) NOT NULL, 
	source_updated_at TIMESTAMP WITH TIME ZONE, 
	data_origin VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
)

;

CREATE TABLE audit_logs (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36), 
	action VARCHAR(100) NOT NULL, 
	entity_type VARCHAR(100) NOT NULL, 
	entity_id VARCHAR(100) NOT NULL, 
	before_json JSON, 
	after_json JSON, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE buyers (
	id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36), 
	business_name VARCHAR(255) NOT NULL, 
	buyer_category VARCHAR(100) NOT NULL, 
	village_or_area VARCHAR(100) NOT NULL, 
	contact_phone VARCHAR(50), 
	max_quantity_kg NUMERIC(12, 2), 
	preferred_grade VARCHAR(20), 
	lead_time_days INTEGER, 
	is_verified BOOLEAN NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
)

;

CREATE TABLE farms (
	id VARCHAR(36) NOT NULL, 
	owner_user_id VARCHAR(36) NOT NULL, 
	group_name VARCHAR(255), 
	village VARCHAR(100) NOT NULL, 
	area_hectares NUMERIC(10, 2) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(owner_user_id) REFERENCES users (id)
)

;

CREATE TABLE forecast_points (
	id VARCHAR(36) NOT NULL, 
	forecast_run_id VARCHAR(36) NOT NULL, 
	period_start DATE NOT NULL, 
	period_end DATE NOT NULL, 
	predicted_quantity_kg NUMERIC(12, 2) NOT NULL, 
	lower_bound_kg NUMERIC(12, 2), 
	upper_bound_kg NUMERIC(12, 2), 
	actual_quantity_kg NUMERIC(12, 2), 
	baseline_quantity_kg NUMERIC(12, 2), 
	PRIMARY KEY (id), 
	FOREIGN KEY(forecast_run_id) REFERENCES forecast_runs (id)
)

;

CREATE TABLE buyer_needs (
	id VARCHAR(36) NOT NULL, 
	buyer_id VARCHAR(36) NOT NULL, 
	needed_from DATE NOT NULL, 
	needed_until DATE NOT NULL, 
	quantity_kg NUMERIC(12, 2) NOT NULL, 
	minimum_grade VARCHAR(20), 
	target_price_per_kg NUMERIC(12, 2), 
	status VARCHAR(50) NOT NULL, 
	data_origin VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(buyer_id) REFERENCES buyers (id)
)

;

CREATE TABLE crop_plans (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	crop_name VARCHAR(100) NOT NULL, 
	variety VARCHAR(100), 
	planting_date DATE, 
	expected_harvest_date DATE NOT NULL, 
	area_hectares NUMERIC(10, 2) NOT NULL, 
	expected_yield_kg NUMERIC(12, 2), 
	status VARCHAR(50) NOT NULL, 
	data_origin VARCHAR(50) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id)
)

;

CREATE TABLE transactions (
	id VARCHAR(36) NOT NULL, 
	buyer_id VARCHAR(36) NOT NULL, 
	farmer_id VARCHAR(36), 
	transaction_date DATE NOT NULL, 
	order_date DATE NOT NULL, 
	fulfilled_date DATE, 
	quantity_ordered_kg NUMERIC(12, 2) NOT NULL, 
	quantity_fulfilled_kg NUMERIC(12, 2) NOT NULL, 
	unit_price NUMERIC(12, 2) NOT NULL, 
	delivery_cost NUMERIC(12, 2), 
	status VARCHAR(50) NOT NULL, 
	data_origin VARCHAR(50) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(buyer_id) REFERENCES buyers (id), 
	FOREIGN KEY(farmer_id) REFERENCES users (id)
)

;

CREATE TABLE harvest_records (
	id VARCHAR(36) NOT NULL, 
	crop_plan_id VARCHAR(36), 
	farm_id VARCHAR(36) NOT NULL, 
	harvest_date DATE NOT NULL, 
	quantity_kg NUMERIC(12, 2) NOT NULL, 
	quality_grade VARCHAR(20), 
	rejected_quantity_kg NUMERIC(12, 2) NOT NULL, 
	data_origin VARCHAR(50) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(crop_plan_id) REFERENCES crop_plans (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id)
)

;

CREATE TABLE inventory_batches (
	id VARCHAR(36) NOT NULL, 
	farm_id VARCHAR(36) NOT NULL, 
	harvest_record_id VARCHAR(36), 
	batch_code VARCHAR(100) NOT NULL, 
	harvest_date DATE NOT NULL, 
	initial_quantity_kg NUMERIC(12, 2) NOT NULL, 
	available_quantity_kg NUMERIC(12, 2) NOT NULL, 
	reserved_quantity_kg NUMERIC(12, 2) NOT NULL, 
	quality_grade VARCHAR(20), 
	condition_notes VARCHAR(255), 
	status VARCHAR(50) NOT NULL, 
	handling_deadline DATE, 
	data_origin VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(farm_id) REFERENCES farms (id), 
	FOREIGN KEY(harvest_record_id) REFERENCES harvest_records (id)
)

;

CREATE TABLE stock_recommendations (
	id VARCHAR(36) NOT NULL, 
	recommendation_type VARCHAR(50) NOT NULL, 
	batch_id VARCHAR(36), 
	period_start DATE NOT NULL, 
	period_end DATE NOT NULL, 
	quantity_kg NUMERIC(12, 2), 
	reason TEXT NOT NULL, 
	assumptions_json JSON, 
	estimated_cost NUMERIC(12, 2), 
	estimated_value NUMERIC(12, 2), 
	status VARCHAR(50) NOT NULL, 
	created_by_system_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	reviewed_by_user_id VARCHAR(36), 
	reviewed_at TIMESTAMP WITH TIME ZONE, 
	review_notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(batch_id) REFERENCES inventory_batches (id), 
	FOREIGN KEY(reviewed_by_user_id) REFERENCES users (id)
)

;

CREATE TABLE transaction_allocations (
	id VARCHAR(36) NOT NULL, 
	transaction_id VARCHAR(36) NOT NULL, 
	inventory_batch_id VARCHAR(36) NOT NULL, 
	allocated_quantity_kg NUMERIC(12, 2) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(transaction_id) REFERENCES transactions (id), 
	FOREIGN KEY(inventory_batch_id) REFERENCES inventory_batches (id)
)

;
