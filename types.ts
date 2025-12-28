
export enum Role {
  ADMIN = 'ADMIN',
  TIMEKEEPER = 'TIMEKEEPER'
}

export enum AttendanceType {
  IN = 'IN',
  OUT = 'OUT'
}

export interface Site {
  id: string;
  name: string;
  location: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  assignedSiteId: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  workerId: string;
  workerName: string;
  workerRole: string;
  siteId: string;
  siteName: string;
  timekeeperId: string;
  checkInTime?: string; // ISO Time
  checkOutTime?: string; // ISO Time
  status: 'PENDING' | 'SYNCED';
}

export interface User {
  id: string;
  name: string;
  role: Role;
  assignedSites: string[]; // Site IDs
}

export interface ScanResult {
  workerId: string;
  name: string;
  siteId: string;
}
