
import React, { useState } from 'react';
import { Worker, Site } from '../types';
import { storageService } from '../services/storage';
import { UserPlus, Download, Trash2, Search, QrCode } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>(storageService.getWorkers());
  const [sites] = useState<Site[]>(storageService.getSites());
  const [search, setSearch] = useState('');
  const [newWorker, setNewWorker] = useState({ name: '', role: '', siteId: sites[0]?.id || '' });
  const [showAdd, setShowAdd] = useState(false);

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    w.role.toLowerCase().includes(search.toLowerCase())
  );

  const addWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name || !newWorker.role) return;

    const worker: Worker = {
      id: `W${Math.floor(1000 + Math.random() * 9000)}`,
      name: newWorker.name,
      role: newWorker.role,
      assignedSiteId: newWorker.siteId
    };

    const updated = [...workers, worker];
    setWorkers(updated);
    storageService.saveWorkers(updated);
    setNewWorker({ name: '', role: '', siteId: sites[0]?.id || '' });
    setShowAdd(false);
  };

  const removeWorker = (id: string) => {
    const updated = workers.filter(w => w.id !== id);
    setWorkers(updated);
    storageService.saveWorkers(updated);
  };

  const downloadQR = (worker: Worker) => {
    // Generate QR data as JSON
    const data = {
      workerId: worker.id,
      name: worker.name,
      siteId: worker.assignedSiteId
    };
    const qrString = btoa(JSON.stringify(data));
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrString}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.target = "_blank";
    link.download = `QR_${worker.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Worker Manager</h1>
          <p className="text-slate-500">Manage site personnel and QR credentials</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-semibold shadow-lg"
        >
          <UserPlus size={18} />
          <span>Add Worker</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addWorker} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text" 
                value={newWorker.name}
                onChange={e => setNewWorker({...newWorker, name: e.target.value})}
                placeholder="e.g. John Miller"
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Job Title</label>
              <input 
                type="text" 
                value={newWorker.role}
                onChange={e => setNewWorker({...newWorker, role: e.target.value})}
                placeholder="e.g. Electrician"
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Assign Site</label>
              <select 
                value={newWorker.siteId}
                onChange={e => setNewWorker({...newWorker, siteId: e.target.value})}
                className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              >
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-6 space-x-3">
            <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2.5 text-slate-500 font-medium hover:text-slate-800">Cancel</button>
            <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">Create Worker</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Worker Details</th>
                <th className="px-6 py-4">Site</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map(worker => (
                <tr key={worker.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{worker.id}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-sm">{worker.name}</p>
                    <p className="text-xs text-slate-500">{worker.role}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-lg">
                      {sites.find(s => s.id === worker.assignedSiteId)?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => downloadQR(worker)}
                        title="Generate QR Badge"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <QrCode size={18} />
                      </button>
                      <button 
                        onClick={() => removeWorker(worker.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No workers found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
