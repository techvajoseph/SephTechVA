
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QRScanner from './components/QRScanner';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import { Attendance, UserSession, Role, SyncStatus } from './types';
import { storageService } from './services/storage';
import { geminiService } from './services/gemini';
import { format } from 'date-fns';
import { ClipboardList, Database, CheckCircle, Smartphone, Globe, Filter, Download, Search, Calendar } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<UserSession | null>(storageService.getCurrentSession());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [attendance, setAttendance] = useState<Attendance[]>(storageService.getAttendance());
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

  const handleLogin = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    storageService.setCurrentSession(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    storageService.setCurrentSession(null);
  };

  const handleSync = useCallback(async () => {
    if (!isOnline) return;
    const pending = attendance.filter(r => r.sync_status === SyncStatus.PENDING);
    if (pending.length === 0) return;

    const result = await geminiService.syncToCloud(pending);
    if (result.success) {
      const updated = attendance.map(r => 
        result.syncedIds.includes(r.attendance_id) ? { ...r, sync_status: SyncStatus.SYNCED as const } : r
      );
      setAttendance(updated);
      storageService.saveAttendance(updated);
      alert(result.message);
    } else {
      alert("Sync Error: " + result.message);
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
            onScanSuccess={() => setAttendance(storageService.getAttendance())} 
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

const AttendanceLogs: React.FC<{ records: Attendance[] }> = ({ records }) => {
  const [filterText, setFilterText] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const sites = useMemo(() => Array.from(new Set(records.map(r => r.site_name))), [records]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchesText = r.employee_name.toLowerCase().includes(filterText.toLowerCase()) || 
                         r.employee_id.toLowerCase().includes(filterText.toLowerCase());
      const matchesSite = filterSite === '' || r.site_name === filterSite;
      const matchesDate = filterDate === '' || r.date === filterDate;
      return matchesText && matchesSite && matchesDate;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [records, filterText, filterSite, filterDate]);

  const exportCSV = () => {
    const headers = ["Date", "Employee ID", "Employee Name", "Specialization", "Site", "Time In", "Time Out", "Timekeeper ID", "Scan Mode", "Sync Status"];
    const rows = filtered.map(r => [
      r.date,
      r.employee_id,
      r.employee_name,
      r.employee_specialization,
      r.site_name,
      r.time_in ? format(new Date(r.time_in), 'HH:mm:ss') : '',
      r.time_out ? format(new Date(r.time_out), 'HH:mm:ss') : '',
      r.timekeeper_id,
      r.scan_mode,
      r.sync_status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_Export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance History</h1>
          <p className="text-slate-500">Google Sheets Managed Data</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
        >
          <Download size={18} />
          <span>Export to CSV</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Search Employee</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Name or ID..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
        <div className="w-full sm:w-auto min-w-[150px]">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Filter by Site</label>
          <select 
            value={filterSite}
            onChange={(e) => setFilterSite(e.target.value)}
            className="w-full p-2 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="">All Sites</option>
            {sites.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Filter by Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4">IN Time</th>
                <th className="px-6 py-4">OUT Time</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(record => (
                <tr key={record.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {record.sync_status === SyncStatus.SYNCED ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
                        <CheckCircle size={14} /> SYNCED
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px]">
                        <Database size={14} /> LOCAL
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm text-slate-800">{record.employee_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{record.employee_id}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{record.site_name}</td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono font-black text-slate-900">
                      {record.time_in ? format(new Date(record.time_in), 'HH:mm:ss') : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-mono font-black text-slate-900">
                      {record.time_out ? format(new Date(record.time_out), 'HH:mm:ss') : '--:--'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase">
                      {record.scan_mode === 'ONLINE' ? <Globe size={12} className="text-blue-500" /> : <Smartphone size={12} className="text-slate-400" />}
                      <span className={record.scan_mode === 'ONLINE' ? 'text-blue-500' : 'text-slate-400'}>{record.scan_mode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{record.date}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-24 text-center">
                    <ClipboardList size={64} className="mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-400 font-medium">No results found matching those filters.</p>
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
