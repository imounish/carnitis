import type { Car, Entry, EntryType, MaintenanceScheduleItem, TodoItem } from "@/lib/db/schema";
import type {
  CreateCarInput,
  CreateEntryInput,
  CreateMaintenanceItemInput,
  CreateTodoInput,
  UpdateCarInput,
  UpdateMaintenanceItemInput,
  UpdateTodoInput,
} from "@/lib/db/types";

export interface CarsRepository {
  list(): Promise<Car[]>;
  getById(id: string): Promise<Car | null>;
  create(input: CreateCarInput): Promise<Car>;
  update(id: string, updates: UpdateCarInput): Promise<Car | null>;
  delete(id: string): Promise<boolean>;
}

export interface EntriesRepository {
  listByCarId(carId: string, entryType?: EntryType): Promise<Entry[]>;
  listRecent(limit?: number): Promise<Array<Entry & { car?: Car }>>;
  create(input: CreateEntryInput): Promise<Entry>;
}

export interface MaintenanceRepository {
  listByCarId(carId: string): Promise<MaintenanceScheduleItem[]>;
  getById(id: string): Promise<MaintenanceScheduleItem | null>;
  listUpcoming(): Promise<Array<MaintenanceScheduleItem & { car?: Car }>>;
  create(input: CreateMaintenanceItemInput): Promise<MaintenanceScheduleItem>;
  update(
    id: string,
    updates: Partial<UpdateMaintenanceItemInput>
  ): Promise<MaintenanceScheduleItem | null>;
  delete(id: string): Promise<boolean>;
}

export interface TodosRepository {
  listByCarId(carId: string): Promise<TodoItem[]>;
  listAll(): Promise<Array<TodoItem & { car?: Car }>>;
  create(input: CreateTodoInput): Promise<TodoItem>;
  update(id: string, updates: UpdateTodoInput): Promise<TodoItem | null>;
}

export interface DataAccess {
  cars: CarsRepository;
  entries: EntriesRepository;
  maintenance: MaintenanceRepository;
  todos: TodosRepository;
}

export interface RepositoryContext {
  userId: string;
}
