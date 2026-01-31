
import { Attendance, Employee, Site, Timekeeper, UserSession, Role, CloudConfig } from '../types';

const STORAGE_KEYS = {
  ATTENDANCE: 'sitescan_attendance_v2',
  EMPLOYEES: 'sitescan_employees_v2',
  SITES: 'sitescan_sites_v2',
  TIMEKEEPERS: 'sitescan_timekeepers_v2',
  CURRENT_SESSION: 'sitescan_session',
  CLOUD_CONFIG: 'sitescan_cloud_config'
};

const DEFAULT_SITES: Site[] = [
  { site_id: 'S001', site_name: 'Downtown High-Rise', location: 'Manhattan, NY' },
  { site_id: 'S002', site_name: 'Bridge Renovation', location: 'Brooklyn, NY' }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { 
    employee_id: 'W001', 
    full_name: 'John Doe', 
    specialization: 'Carpenter', 
    assigned_site_id: 'S001', 
    qr_code_value: btoa(JSON.stringify({employee_id: 'W001', site_id: 'S001'})),
    status: 'active'
  },
  { 
    employee_id: 'W002', 
    full_name: 'Jane Smith', 
    specialization: 'Electrician', 
    assigned_site_id: 'S001', 
    qr_code_value: btoa(JSON.stringify({employee_id: 'W002', site_id: 'S001'})),
    status: 'active'
  }
];

const DEFAULT_TIMEKEEPERS: Timekeeper[] = [
  {
    timekeeper_id: 'TK001',
    full_name: 'Robert Smith',
    assigned_site_id: 'S001',
    login_username: 'tk01',
    hashed_password: 'password', // Simulation
    role: Role.TIMEKEEPER
  }
];

export const storageService = {
  getAttendance: (): Attendance[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  saveAttendance: (records: Attendance[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : DEFAULT_EMPLOYEES;
  },

  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getSites: (): Site[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SITES);
    return data ? JSON.parse(data) : DEFAULT_SITES;
  },

  saveSites: (sites: Site[]) => {
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
  },

  getTimekeepers: (): Timekeeper[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TIMEKEEPERS);
    return data ? JSON.parse(data) : DEFAULT_TIMEKEEPERS;
  },

  getCloudConfig: (): CloudConfig => {
    const data = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
    return data ? JSON.parse(data) : { googleSheetUrl: '' };
  },

  saveCloudConfig: (config: CloudConfig) => {
    localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));
  },

  setCurrentSession: (user: UserSession | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  },

  getCurrentSession: (): UserSession | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    return data ? JSON.parse(data) : null;
  }
};
