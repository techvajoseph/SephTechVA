
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QRScanner from './components/QRScanner';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import { AttendanceRecord, User, Role } from './types';
import { storageService } from './services/storage';
import { geminiService } from './services/gemini';
import { format } from 'date-fns';
import { ClipboardList, Database, CheckCircle, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(storageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(storageService.getAttendance());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    storageService.setCurrentUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    storageService.setCurrentUser(null);
  };

  const handleSync = useCallback(async () => {
    if (!isOnline) return;

    const pending = attendance.filter(r => r.status === 'PENDING');
    if (pending.length === 0) return;

    const result = await geminiService.syncToCloud(pending);
    if (result.success) {
      const updated = attendance.map(r => 
        result.syncedIds.includes(r.id) ? { ...r, status: 'SYNCED' as const } : r
      );
      setAttendance(updated);
      storageService.saveAttendance(updated);
    }
  }, [attendance, isOnline]);

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            user={user} 
            isOnline={isOnline} 
            onSyncRequest={handleSync} 
            onNavigateToScanner={() => setActiveTab('scanner')} 
          />
        );
      case 'scanner':
        return user.role === Role.TIMEKEEPER ? (
          <QRScanner 
            timekeeperId={user.id} 
            onScanSuccess={(record) => {
              setAttendance(storageService.getAttendance());
            }} 
          />
        ) : null;
      case 'logs':
        return <AttendanceLogs records={attendance} />;
      case 'admin':
        return user.role === Role.ADMIN ? <AdminPanel /> : null;
      default:
        return (
          <Dashboard 
            user={user} 
            isOnline={isOnline} 
            onSyncRequest={handleSync} 
            onNavigateToScanner={() => setActiveTab('scanner')} 
          />
        );
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      isOnline={isOnline}
    >
      {renderContent()}
    </Layout>
  );
};

const AttendanceLogs: React.FC<{ records: AttendanceRecord[] }> = ({ records }) => {
  const sorted = [...records].sort((a, b) => new Date(b.checkInTime || 0).getTime() - new Date(a.checkInTime || 0).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance History</h1>
          <p className="text-slate-500">View and track all site activity logs</p>
        </div>
        <div className="flex space-x-2">
           <span className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium">
             <Database size={16} className="text-slate-400" />
             <span>{records.length} Total Records</span>
           </span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Worker / Role</th>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Check-Out</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {record.status === 'SYNCED' ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase">
                        <CheckCircle size={14} /> Synced
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase">
                        <Database size={14} /> Pending
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm">{record.workerName}</p>
                    <p className="text-xs text-slate-500">{record.workerRole}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-700">{record.siteName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono font-bold text-slate-900">
                      {record.checkInTime ? format(new Date(record.checkInTime), 'HH:mm:ss') : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono font-bold text-slate-900">
                      {record.checkOutTime ? format(new Date(record.checkOutTime), 'HH:mm:ss') : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500">{record.date}</p>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <ClipboardList size={48} className="text-slate-200 mb-4" />
                      <p className="text-slate-400 italic">No attendance records found yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
