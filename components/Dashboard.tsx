
import React, { useEffect, useState } from 'react';
import { AttendanceRecord, Role, User } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/gemini';
import { RefreshCw, Users, CheckCircle2, Clock, MapPin, Sparkles, QrCode } from 'lucide-react';

interface DashboardProps {
  user: User;
  isOnline: boolean;
  onSyncRequest: () => Promise<void>;
  onNavigateToScanner: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, isOnline, onSyncRequest, onNavigateToScanner }) => {
  const [stats, setStats] = useState({ total: 0, pending: 0, present: 0 });
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const attendance = storageService.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter(r => r.date === today);
    
    setStats({
      total: todayRecords.length,
      pending: attendance.filter(r => r.status === 'PENDING').length,
      present: todayRecords.filter(r => r.checkInTime && !r.checkOutTime).length
    });
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await onSyncRequest();
    setSyncing(false);
    
    // Refresh local stats
    const attendance = storageService.getAttendance();
    setStats(prev => ({ ...prev, pending: attendance.filter(r => r.status === 'PENDING').length }));
  };

  const generateAIInsight = async () => {
    setLoadingInsight(true);
    try {
      const attendance = storageService.getAttendance();
      const text = await geminiService.getAttendanceInsights(attendance);
      setInsight(text);
    } catch (err) {
      setInsight("Unable to generate insights at this moment.");
    } finally {
      setLoadingInsight(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Overview</h1>
          <p className="text-slate-500">Welcome back, {user.name}</p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleManualSync}
            disabled={syncing || !isOnline}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              syncing ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Primary Action Button - Large for Outdoor Use */}
      {user.role === Role.TIMEKEEPER && (
        <button 
          onClick={onNavigateToScanner}
          className="w-full py-6 bg-blue-600 text-white rounded-[2rem] flex flex-col items-center justify-center space-y-2 shadow-2xl shadow-blue-500/40 active:scale-[0.98] transition-all hover:bg-blue-700 group"
        >
          <div className="p-4 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
            <QrCode size={40} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black uppercase tracking-wider">Scan Worker QR</span>
          <span className="text-blue-100 text-sm font-medium">Record IN / OUT Attendance</span>
        </button>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="text-blue-500" />} 
          label="Today's Check-ins" 
          value={stats.total.toString()} 
          color="blue"
        />
        <StatCard 
          icon={<Clock className="text-orange-500" />} 
          label="Currently On-Site" 
          value={stats.present.toString()} 
          color="orange"
        />
        <StatCard 
          icon={<RefreshCw className="text-amber-500" />} 
          label="Pending Sync" 
          value={stats.pending.toString()} 
          color="amber"
        />
        <StatCard 
          icon={<CheckCircle2 className="text-green-500" />} 
          label="Sync Health" 
          value={isOnline ? "Good" : "Offline"} 
          color="green"
        />
      </div>

      {/* AI Insight Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-amber-300" />
            <h2 className="text-lg font-bold">Gemini Site Analysis</h2>
          </div>
          <button 
            onClick={generateAIInsight}
            disabled={loadingInsight}
            className="text-xs bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-full font-medium"
          >
            {insight ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
        
        {loadingInsight ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-3 py-1">
              <div className="h-2 bg-white/20 rounded"></div>
              <div className="h-2 bg-white/20 rounded"></div>
              <div className="h-2 bg-white/20 rounded"></div>
            </div>
          </div>
        ) : insight ? (
          <p className="text-sm leading-relaxed text-indigo-100">{insight}</p>
        ) : (
          <p className="text-sm text-indigo-100 italic">Click generate to get an AI summary of workforce trends and site activity.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-slate-400" />
            Site Status
          </h2>
          <div className="space-y-4">
            {storageService.getSites().map(site => (
              <div key={site.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-semibold text-sm">{site.name}</p>
                  <p className="text-xs text-slate-500">{site.location}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg uppercase">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-bold mb-4">Sync Instructions</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
              <p>Scans are saved locally immediately upon recognition.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
              <p>When internet is available, use the "Sync Data" button to upload to Google Sheets.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
              <p>Admin generates QR codes for new workers in the Worker Manager.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-2xl bg-${color}-50`}>
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

export default Dashboard;
