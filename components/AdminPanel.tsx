
import React, { useState } from 'react';
import { Employee, Site, CloudConfig } from '../types';
import { storageService } from '../services/storage';
import { geminiService } from '../services/gemini';
import { UserPlus, Trash2, Search, QrCode, Database, Link as LinkIcon, Code, Copy, Check, ExternalLink, Activity } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(storageService.getEmployees());
  const [sites] = useState<Site[]>(storageService.getSites());
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(storageService.getCloudConfig());
  const [search, setSearch] = useState('');
  const [newEmp, setNewEmp] = useState({ name: '', role: '', siteId: sites[0]?.site_id || '' });
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const filtered = employees.filter(e => 
    e.full_name.toLowerCase().includes(search.toLowerCase()) || 
    e.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveCloudConfig(cloudConfig);
    alert("Cloud Configuration Saved Successfully!");
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    const result = await geminiService.testConnection(cloudConfig.googleSheetUrl);
    alert(result.message);
    setIsTesting(false);
  };

  const addEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role) return;

    const empId = `E${Math.floor(1000 + Math.random() * 9000)}`;
    const employee: Employee = {
      employee_id: empId,
      full_name: newEmp.name,
      specialization: newEmp.role,
      assigned_site_id: newEmp.siteId,
      qr_code_value: btoa(JSON.stringify({ employee_id: empId, site_id: newEmp.siteId })),
      status: 'active'
    };

    const updated = [...employees, employee];
    setEmployees(updated);
    storageService.saveEmployees(updated);
    setShowAdd(false);
    setNewEmp({ name: '', role: '', siteId: sites[0]?.site_id || '' });
  };

  const removeEmployee = (id: string) => {
    const updated = employees.filter(e => e.employee_id !== id);
    setEmployees(updated);
    storageService.saveEmployees(updated);
  };

  const openQR = (emp: Employee) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${emp.qr_code_value}`;
    window.open(url, '_blank');
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    var records = contents.records;
    
    records.forEach(function(r) {
      sheet.appendRow([
        r.date, 
        r.employee_id, 
        r.employee_name, 
        r.specialization || r.employee_specialization, 
        r.site || r.site_name, 
        r.time_in, 
        r.time_out, 
        r.timekeeper_id, 
        r.scan_mode, 
        "SYNCED"
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("Bridge is active.");
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin Console</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAdd(!showAdd)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
            <UserPlus size={18} />
            <span>Register Employee</span>
          </button>
        </div>
      </div>

      {/* Cloud Settings Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Database size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Cloud Database Integration</h2>
            <p className="text-xs text-slate-500">Link this app to your Google Sheets database</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Google Apps Script Web App URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={cloudConfig.googleSheetUrl}
                    onChange={(e) => setCloudConfig({ googleSheetUrl: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
                  Save Endpoint
                </button>
                <button 
                  type="button" 
                  onClick={handleTestConnection}
                  disabled={isTesting || !cloudConfig.googleSheetUrl}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <Activity size={16} className={isTesting ? 'animate-pulse' : ''} />
                  <span>Test</span>
                </button>
              </div>
            </form>
            <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <ExternalLink size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Ensure you deploy as a <strong>Web App</strong> and set "Who has access" to <strong>Anyone</strong>. This allows the app to sync data without complex OAuth screens.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-2">
                <Code size={14} />
                Apps Script Code
              </h3>
              <button onClick={copyCode} className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy Snippet'}
              </button>
            </div>
            <pre className="text-[9px] font-mono text-slate-500 bg-white p-3 rounded-lg overflow-x-auto border border-slate-200 h-32">
              {appsScriptCode}
            </pre>
            <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
              1. Open your Sheet > Extensions > Apps Script <br/>
              2. Paste code & click "Deploy" > "New Deployment" <br/>
              3. Select "Web App" > "Anyone" can access <br/>
              4. Copy the URL into the field on the left.
            </p>
          </div>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={addEmployee} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Legal Name</label>
              <input type="text" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 outline-none" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Specialization</label>
              <input type="text" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 outline-none" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Primary Site</label>
              <select value={newEmp.siteId} onChange={e => setNewEmp({...newEmp, siteId: e.target.value})} className="w-full p-3 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 outline-none">
                {sites.map(s => <option key={s.site_id} value={s.site_id}>{s.site_name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-6 gap-3">
             <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20">Commit to Database</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Search Database..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all outline-none" />
           </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
              <th className="px-6 py-4">Employee ID</th>
              <th className="px-6 py-4">Full Name / Specialization</th>
              <th className="px-6 py-4">Site ID</th>
              <th className="px-6 py-4 text-center">Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(emp => (
              <tr key={emp.employee_id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{emp.employee_id}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-slate-800">{emp.full_name}</p>
                  <p className="text-xs text-slate-500">{emp.specialization}</p>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-600">{emp.assigned_site_id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openQR(emp)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><QrCode size={18} /></button>
                    <button onClick={() => removeEmployee(emp.employee_id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;
