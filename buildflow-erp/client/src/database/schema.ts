import Dexie, { Table } from 'dexie';

export interface OfflineEntity {
  id?: string;
  serverId?: string;
  companyId: string;
  _syncStatus: 'synced' | 'pending' | 'conflict';
  _localId: string;
  updatedAt: string;
  createdAt: string;
}

export interface ChantierOffline extends OfflineEntity {
  name: string;
  code?: string;
  type: string;
  status: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  spentAmount: number;
  progress: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  responsable?: string;
}

export interface EmployeeOffline extends OfflineEntity {
  matricule?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  phoneCode: string;
  position?: string;
  department?: string;
  hireDate: string;
  contractType: string;
  salary: number;
  isActive: boolean;
}

export interface WorkerOffline extends OfflineEntity {
  firstName: string;
  lastName: string;
  phone?: string;
  phoneCode: string;
  specialty?: string;
  dailyRate: number;
  isActive: boolean;
}

export interface SupplierOffline extends OfflineEntity {
  name: string;
  contactName?: string;
  phone: string;
  phoneCode: string;
  email?: string;
  address?: string;
  category?: string;
  isActive: boolean;
}

export interface ClientOffline extends OfflineEntity {
  name: string;
  contactName?: string;
  phone: string;
  phoneCode: string;
  email?: string;
  address?: string;
  type?: string;
  isActive: boolean;
}

export interface StockItemOffline extends OfflineEntity {
  familyId?: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  quantity: number;
  minQuantity: number;
  location?: string;
  supplierId?: string;
}

export interface MaterialOffline extends OfflineEntity {
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchasePrice: number;
  currentValue: number;
  status: string;
  location?: string;
  isActive: boolean;
}

export interface VehicleOffline extends OfflineEntity {
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
  type?: string;
  fuelType?: string;
  status: string;
  currentMileage: number;
  isActive: boolean;
}

export interface PurchaseOffline extends OfflineEntity {
  supplierId?: string;
  chantierId?: string;
  reference: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  status: string;
  notes?: string;
  items?: any;
}

export interface ExpenseOffline extends OfflineEntity {
  chantierId?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface PresenceOffline extends OfflineEntity {
  employeeId?: string;
  workerId?: string;
  chantierId?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  hoursWorked?: number;
  overtime: number;
  notes?: string;
}

export interface DailyReportOffline extends OfflineEntity {
  chantierId: string;
  date: string;
  weather?: string;
  workersOnSite: number;
  workDone: string;
  issues?: string;
  tomorrowPlan?: string;
}

export interface SyncQueueItem {
  id?: number;
  entity: string;
  action: 'create' | 'update' | 'delete';
  localId: string;
  serverId?: string;
  data: any;
  timestamp: string;
  retries: number;
  status: 'pending' | 'processing' | 'failed';
}

export interface SyncJournalEntry {
  id?: number;
  timestamp: string;
  direction: 'push' | 'pull';
  entity: string;
  itemsSent: number;
  itemsReceived: number;
  status: 'success' | 'partial' | 'error';
  errors?: string;
}

export interface NetworkStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingItems: number;
}

class BuildFlowDatabase extends Dexie {
  chantiers!: Table<ChantierOffline>;
  employees!: Table<EmployeeOffline>;
  workers!: Table<WorkerOffline>;
  suppliers!: Table<SupplierOffline>;
  clients!: Table<ClientOffline>;
  stockItems!: Table<StockItemOffline>;
  materials!: Table<MaterialOffline>;
  vehicles!: Table<VehicleOffline>;
  purchases!: Table<PurchaseOffline>;
  expenses!: Table<ExpenseOffline>;
  presences!: Table<PresenceOffline>;
  dailyReports!: Table<DailyReportOffline>;
  syncQueue!: Table<SyncQueueItem>;
  syncJournal!: Table<SyncJournalEntry>;

  constructor() {
    super('BuildFlowERP');

    this.version(1).stores({
      chantiers: 'id, serverId, companyId, _syncStatus, name, status, type',
      employees: 'id, serverId, companyId, _syncStatus, firstName, lastName, phone',
      workers: 'id, serverId, companyId, _syncStatus, firstName, lastName',
      suppliers: 'id, serverId, companyId, _syncStatus, name',
      clients: 'id, serverId, companyId, _syncStatus, name',
      stockItems: 'id, serverId, companyId, _syncStatus, code, name, familyId',
      materials: 'id, serverId, companyId, _syncStatus, name, category',
      vehicles: 'id, serverId, companyId, _syncStatus, plateNumber, brand',
      purchases: 'id, serverId, companyId, _syncStatus, reference, date',
      expenses: 'id, serverId, companyId, _syncStatus, category, date',
      presences: 'id, serverId, companyId, _syncStatus, date, employeeId, workerId',
      dailyReports: 'id, serverId, companyId, _syncStatus, chantierId, date',
      syncQueue: '++id, entity, localId, status, timestamp',
      syncJournal: '++id, timestamp, entity, direction',
    });
  }
}

export const db = new BuildFlowDatabase();

export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
