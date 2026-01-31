
export enum Role {
  ADMIN = 'ADMIN',
  TIMEKEEPER = 'TIMEKEEPER'
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED'
}

export enum ScanMode {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export interface CloudConfig {
  googleSheetUrl: string;
}

export interface Employee {
  employee_id: string; // Primary Key
  full_name: string;
  specialization: string;
  assigned_site_id: string; // Foreign Key to Sites
  qr_code_value: string; // Encrypted/Encoded string
  status: 'active' | 'inactive';
}

export interface Timekeeper {
  timekeeper_id: string; // Primary Key
  full_name: string;
  assigned_site_id: string; // Foreign Key to Sites
  login_username: string;
  hashed_password: string; // Simulated
  role: Role.TIMEKEEPER;
}

export interface Site {
  site_id: string; // Primary Key
  site_name: string;
  location: string;
}

export interface Attendance {
  attendance_id: string; // Primary Key
  employee_id: string; // Foreign Key to Employees
  employee_name: string; // Denormalized for fast UI
  employee_specialization: string; // Denormalized
  site_id: string; // Foreign Key to Sites
  site_name: string; // Denormalized
  timekeeper_id: string; // Foreign Key to Timekeepers
  date: string; // YYYY-MM-DD
  time_in: string | null; // ISO Timestamp
  time_out: string | null; // ISO Timestamp
  scan_mode: ScanMode;
  sync_status: SyncStatus;
  created_at: string; // System Timestamp
}

export interface UserSession {
  id: string;
  name: string;
  role: Role;
  assigned_site_id?: string;
}

export interface ScanResult {
  employee_id: string;
  name: string;
  site_id: string;
}
