import { createMockDataAccess } from "@/lib/db/mock/data-access";
import { getCarStatsFromDataAccess, getDashboardStatsFromDataAccess } from "@/lib/db/stats-service";
import type { EntryType } from "@/lib/db/schema";
import type {
  CreateCarInput,
  CreateEntryInput,
  CreateMaintenanceItemInput,
  CreateTodoInput,
  UpdateCarInput,
  UpdateMaintenanceItemInput,
  UpdateTodoInput,
} from "@/lib/db/types";

const mockDataAccess = createMockDataAccess();

export async function getCars() {
  return mockDataAccess.cars.list();
}

export async function getCarById(id: string) {
  return mockDataAccess.cars.getById(id);
}

export async function createCar(input: CreateCarInput) {
  return mockDataAccess.cars.create(input);
}

export async function updateCar(id: string, updates: UpdateCarInput) {
  return mockDataAccess.cars.update(id, updates);
}

export async function deleteCar(id: string) {
  return mockDataAccess.cars.delete(id);
}

export async function getEntriesByCarId(carId: string, entryType?: EntryType) {
  return mockDataAccess.entries.listByCarId(carId, entryType);
}

export async function getRecentEntries(limit = 10) {
  return mockDataAccess.entries.listRecent(limit);
}

export async function createEntry(input: CreateEntryInput) {
  return mockDataAccess.entries.create(input);
}

export async function getMaintenanceByCarId(carId: string) {
  return mockDataAccess.maintenance.listByCarId(carId);
}

export async function getAllUpcomingMaintenance() {
  return mockDataAccess.maintenance.listUpcoming();
}

export async function createMaintenanceItem(input: CreateMaintenanceItemInput) {
  return mockDataAccess.maintenance.create(input);
}

export async function updateMaintenanceItem(
  id: string,
  updates: Partial<UpdateMaintenanceItemInput>
) {
  return mockDataAccess.maintenance.update(id, updates);
}

export async function getTodosByCarId(carId: string) {
  return mockDataAccess.todos.listByCarId(carId);
}

export async function getAllTodos() {
  return mockDataAccess.todos.listAll();
}

export async function createTodo(input: CreateTodoInput) {
  return mockDataAccess.todos.create(input);
}

export async function updateTodo(id: string, updates: UpdateTodoInput) {
  return mockDataAccess.todos.update(id, updates);
}

export async function getCarStats(carId: string) {
  return getCarStatsFromDataAccess(mockDataAccess, carId);
}

export async function getDashboardStats() {
  return getDashboardStatsFromDataAccess(mockDataAccess);
}
