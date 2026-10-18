// =============================================================
// DATABASE SCHEMA TYPES
// Designed for Supabase PostgreSQL
// =============================================================

// --- ENUMS ---

export type ExpenseCategory =
  | "fuel"
  | "preventive_maintenance"
  | "regular_maintenance"
  | "improvements"
  | "repairs";

export type EntryType =
  | "fuel"
  | "maintenance_expense"
  | "maintenance_done";

export type MaintenanceItemStatus =
  | "upcoming"
  | "due_soon"
  | "overdue"
  | "completed";

export type TodoStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TodoPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

// --- TABLES ---

export interface Car {
  id: string;
  name: string;                    // user-friendly name (e.g., "Daily Driver")
  make: string;                    // e.g., "Toyota"
  model: string;                   // e.g., "Camry"
  year: number;
  vin: string | null;
  color: string | null;
  license_plate: string | null;
  current_mileage: number;         // latest odometer reading
  mileage_as_of_date: string;      // ISO date of the most recent mileage reading
  mileage_check_interval_days: number; // how often to prompt for a mileage update
  fuel_tank_capacity: number | null; // in gallons
  fuel_type: string | null;        // e.g., "gasoline", "diesel", "electric"
  total_fuel_spent: number;        // running total $
  total_maintenance_spent: number; // running total $
  total_improvements_spent: number;
  total_repairs_spent: number;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  car_id: string;
  entry_type: EntryType;
  date: string;                    // ISO date string
  mileage: number;                 // odometer at time of entry
  // -- Fuel-specific --
  fuel_gallons: number | null;
  fuel_price_per_gallon: number | null;
  fuel_total_cost: number | null;
  fuel_station: string | null;
  fuel_octane: string | null;
  was_full_tank: boolean | null;
  fuel_level_before: number | null;
  // -- Maintenance/Expense fields --
  expense_category: ExpenseCategory | null;
  expense_amount: number | null;
  description: string | null;
  vendor: string | null;
  parts_replaced: string | null;   // comma-separated or JSON
  // -- Link to maintenance schedule --
  maintenance_item_id: string | null;
  // -- Link to todo --
  todo_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceScheduleItem {
  id: string;
  car_id: string;
  name: string;                    // e.g., "Oil Change", "Tire Rotation"
  description: string | null;
  interval_miles: number;          // e.g., 7500
  interval_months: number | null;  // e.g., 6
  last_done_mileage: number | null;
  last_done_date: string | null;
  next_due_mileage: number | null;
  next_due_date: string | null;
  status: MaintenanceItemStatus;
  estimated_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoItem {
  id: string;
  car_id: string;
  title: string;
  description: string | null;
  priority: TodoPriority;
  status: TodoStatus;
  category: ExpenseCategory | null;
  estimated_cost: number | null;
  linked_entry_id: string | null;   // entry that completed this todo
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// --- SQL SCHEMA (for reference / migration) ---
/*
-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  vin VARCHAR(17),
  color VARCHAR(50),
  license_plate VARCHAR(20),
  current_mileage NUMERIC(10, 1) NOT NULL DEFAULT 0,
  fuel_tank_capacity NUMERIC(5, 1),
  fuel_type VARCHAR(30) DEFAULT 'gasoline',
  total_fuel_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_maintenance_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_improvements_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_repairs_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE entry_type AS ENUM ('fuel', 'maintenance_expense', 'maintenance_done');
CREATE TYPE expense_category AS ENUM ('fuel', 'preventive_maintenance', 'regular_maintenance', 'improvements', 'repairs');

CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  entry_type entry_type NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mileage NUMERIC(10, 1) NOT NULL,
  fuel_gallons NUMERIC(7, 3),
  fuel_price_per_gallon NUMERIC(6, 3),
  fuel_total_cost NUMERIC(10, 2),
  fuel_station VARCHAR(255),
  fuel_octane VARCHAR(20),
  was_full_tank BOOLEAN DEFAULT true,
  fuel_level_before SMALLINT CHECK (fuel_level_before BETWEEN 0 AND 100),
  expense_category expense_category,
  expense_amount NUMERIC(12, 2),
  description TEXT,
  vendor VARCHAR(255),
  parts_replaced TEXT,
  maintenance_item_id UUID REFERENCES maintenance_schedule_items(id) ON DELETE SET NULL,
  todo_id UUID REFERENCES todo_items(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE maintenance_item_status AS ENUM ('upcoming', 'due_soon', 'overdue', 'completed');

CREATE TABLE maintenance_schedule_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  interval_miles NUMERIC(10, 1) NOT NULL,
  interval_months INTEGER,
  last_done_mileage NUMERIC(10, 1),
  last_done_date DATE,
  next_due_mileage NUMERIC(10, 1),
  next_due_date DATE,
  status maintenance_item_status NOT NULL DEFAULT 'upcoming',
  estimated_cost NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TYPE todo_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE todo_priority AS ENUM ('low', 'medium', 'high', 'urgent');

CREATE TABLE todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority todo_priority NOT NULL DEFAULT 'medium',
  status todo_status NOT NULL DEFAULT 'pending',
  category expense_category,
  estimated_cost NUMERIC(10, 2),
  linked_entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_entries_car_id ON entries(car_id);
CREATE INDEX idx_entries_date ON entries(date);
CREATE INDEX idx_entries_entry_type ON entries(entry_type);
CREATE INDEX idx_maintenance_schedule_car_id ON maintenance_schedule_items(car_id);
CREATE INDEX idx_maintenance_schedule_status ON maintenance_schedule_items(status);
CREATE INDEX idx_todo_items_car_id ON todo_items(car_id);
CREATE INDEX idx_todo_items_status ON todo_items(status);
*/
