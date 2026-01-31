
import React, { useEffect, useState } from 'react';
import { Attendance, Role, UserSession, SyncStatus } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/gemini';
import { RefreshCw, Users, CheckCircle2, Clock, MapPin, Sparkles, QrCode, Cloud, CloudOff } from 'lucide-react';

interface DashboardProps {
  user: UserSession;
  isOnline: boolean;
  onSyncRequest: () => Promise<void>;
  onNavigateToScanner: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, isOnline, onSyncRequest, onNavigateToScanner }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, present: 0 });
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const cloudUrl = storageService.getCloudConfig().googleSheetUrl;

  useEffect(() => {
    const attendance = storageService.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(r => r.date === today);
    
    setStats({
      total: todayRecords.length,
      pending: attendance.filter(r => r.sync_status === SyncStatus.PENDING).length,
      present: todayRecords.filter(r => r.time_in && !r.time_out).length
    });
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await onSyncRequest();
    setSyncing(false);
    const attendance = storageService.getAttendance();
    setStats(prev => ({ ...prev, pending: attendance.filter(r => r.sync_status === SyncStatus.PENDING).length }));
  };

  const generateAIInsight = async () => {
    setLoadingInsight(true);
    try {
      const attendance = storageService.getAttendance();
      const text = await geminiService.getAttendanceInsights(attendance as any);
      setInsight(text);
    } catch (err) {
      setInsight("Unable to generate insights.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Command Center</h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-slate-500 text-sm">Session: {user.name}</p>
             <span className="text-slate-300 text-xs">|</span>
             {cloudUrl ? (
               <div className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                 <Cloud size={12} /> Database Connected
               </div>
             ) : (
               <div className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase">
                 <CloudOff size={12} /> Cloud Disconnected
               </div>
             )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              syncing ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Push to Cloud'}</span>
          </button>
        </div>
      </div>

      {user.role === Role.TIMEKEEPER && (
        <button 
          onClick={onNavigateToScanner}
          className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] flex flex-col items-center justify-center space-y-3 shadow-2xl shadow-blue-500/40 active:scale-[0.98] transition-all hover:bg-blue-700"
        >
          <QrCode size={48} strokeWidth={2.5} />
          <div className="text-center">
            <span className="block text-2xl font-black uppercase tracking-widest">Scan Worker QR</span>
            <span className="text-blue-100 text-sm font-medium">Record Attendance Transaction</span>
          </div>
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-blue-500" />} label="Daily Transactions" value={stats.total.toString()} color="blue" />
        <StatCard icon={<Clock className="text-orange-500" />} label="Currently Active" value={stats.present.toString()} color="orange" />
        <StatCard icon={<RefreshCw className="text-amber-500" />} label="Pending Sync" value={stats.pending.toString()} color="amber" />
        <StatCard icon={<CheckCircle2 className="text-green-500" />} label="Network State" value={isOnline ? "Online" : "Offline"} color="green" />
      </div>

      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles size={20} className="text-blue-400" />
              <h2 className="text-lg font-bold">AI Labor Summary</h2>
            </div>
            <button onClick={generateAIInsight} disabled={loadingInsight} className="text-xs bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full font-bold transition-all">
              {insight ? 'Refresh Analysis' : 'Run Gemini Analysis'}
            </button>
          </div>
          {loadingInsight ? <div className="space-y-2 animate-pulse"><div className="h-2 bg-white/10 rounded w-full"></div><div className="h-2 bg-white/10 rounded w-5/6"></div></div> : <p className="text-sm leading-relaxed text-slate-300">{insight || 'Initiate Gemini analysis to see workforce efficiency patterns.'}</p>}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-slate-400" />
          Active Construction Sites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {storageService.getSites().map(site => (
            <div key={site.site_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-800">{site.site_name}</p>
                <p className="text-xs text-slate-500">{site.location}</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase">ID: {site.site_id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
    <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-4`}>{icon}</div>
    <p className="text-2xl font-black text-slate-900">{value}</p>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
  </div>
);

export default Dashboard;
