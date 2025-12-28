
import { AttendanceRecord, Worker, Site, User, Role } from '../types';

const STORAGE_KEYS = {
  ATTENDANCE: 'sitescan_attendance',
  WORKERS: 'sitescan_workers',
  SITES: 'sitescan_sites',
  CURRENT_USER: 'sitescan_user',
  PENDING_SYNC: 'sitescan_pending'
};

// Initial Data Seed
const DEFAULT_SITES: Site[] = [
  { id: 'S001', name: 'Downtown High-Rise', location: 'Manhattan, NY' },
  { id: 'S002', name: 'Bridge Renovation', location: 'Brooklyn, NY' }
];

const DEFAULT_WORKERS: Worker[] = [
  { id: 'W001', name: 'John Doe', role: 'Carpenter', assignedSiteId: 'S001' },
  { id: 'W002', name: 'Jane Smith', role: 'Electrician', assignedSiteId: 'S001' },
  { id: 'W003', name: 'Mike Johnson', role: 'Mason', assignedSiteId: 'S002' }
];

export const storageService = {
  getAttendance: (): AttendanceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return data ? JSON.parse(data) : [];
  },

  saveAttendance: (records: AttendanceRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(records));
  },

  getWorkers: (): Worker[] => {
    const data = localStorage.getItem(STORAGE_KEYS.WORKERS);
    return data ? JSON.parse(data) : DEFAULT_WORKERS;
  },

  saveWorkers: (workers: Worker[]) => {
    localStorage.setItem(STORAGE_KEYS.WORKERS, JSON.stringify(workers));
  },

  getSites: (): Site[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SITES);
    return data ? JSON.parse(data) : DEFAULT_SITES;
  },

  saveSites: (sites: Site[]) => {
    localStorage.setItem(STORAGE_KEYS.SITES, JSON.stringify(sites));
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }
};
