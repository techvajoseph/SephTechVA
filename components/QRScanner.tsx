
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanResult, Attendance, ScanMode, SyncStatus } from '../types';
import { storageService } from '../services/storage';
import { CheckCircle, XCircle, AlertTriangle, Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (record: Attendance) => void;
  timekeeperId: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, timekeeperId }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScan, onScanError);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner clear fail", err));
        scannerRef.current = null;
      }
    };
  }, [isScanning]);

  const onScan = (decodedText: string) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      let data: any;
      try {
        data = JSON.parse(decodedText);
      } catch {
        data = JSON.parse(atob(decodedText));
      }
      
      const employee_id = data.employee_id || data.workerId;
      const site_id = data.site_id || data.siteId;

      if (!employee_id || !site_id) throw new Error("Invalid Format");
      handleAttendanceLogic(employee_id, site_id);
    } catch (err) {
      showFeedback('error', 'Invalid QR code.');
      setIsProcessing(false);
    }
  };

  const onScanError = () => {};

  const handleAttendanceLogic = (empId: string, siteId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const attendanceRecords = storageService.getAttendance();
    const employees = storageService.getEmployees();
    const sites = storageService.getSites();

    const employee = employees.find(e => e.employee_id === empId);
    const site = sites.find(s => s.site_id === siteId);

    if (!employee || employee.status !== 'active') {
      showFeedback('error', 'Employee not found or inactive.');
      setIsProcessing(false);
      return;
    }

    // Constraint: One IN and one OUT per employee per day
    let record = attendanceRecords.find(r => r.employee_id === empId && r.date === today);
    const now = new Date().toISOString();
    const mode = navigator.onLine ? ScanMode.ONLINE : ScanMode.OFFLINE;

    if (record) {
      if (record.time_in && record.time_out) {
        showFeedback('info', `${employee.full_name} has already completed IN and OUT for today.`);
        setIsProcessing(false);
        return;
      }
      
      // Update OUT time
      record.time_out = now;
      record.sync_status = SyncStatus.PENDING;
      record.scan_mode = mode;
      showFeedback('success', `Check OUT successful: ${employee.full_name}`);
    } else {
      // Create new IN record
      record = {
        attendance_id: `ATT-${Date.now()}-${empId}`,
        employee_id: empId,
        employee_name: employee.full_name,
        employee_specialization: employee.specialization,
        site_id: siteId,
        site_name: site?.site_name || 'Unknown',
        timekeeper_id: timekeeperId,
        date: today,
        time_in: now,
        time_out: null,
        scan_mode: mode,
        sync_status: SyncStatus.PENDING,
        created_at: now
      };
      attendanceRecords.push(record);
      showFeedback('success', `Check IN successful: ${employee.full_name}`);
    }

    storageService.saveAttendance(attendanceRecords);
    onScanSuccess(record);
    
    setTimeout(() => setIsProcessing(false), 2000);
  };

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 relative">
        <h2 className="text-xl font-bold mb-2 text-center">QR Attendance Scanner</h2>
        <p className="text-slate-500 text-sm text-center mb-6">Attendance Database Protocol v2</p>
        
        {!isScanning ? (
          <div className="flex flex-col items-center py-10 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Camera size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Ready to Scan?</h3>
            <p className="text-slate-500 text-sm text-center mb-8">Initiate scan for Employee Badge.</p>
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center space-x-3"
            >
              <Camera size={24} strokeWidth={2.5} />
              <span>Scan QR</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div id="qr-reader" className="overflow-hidden rounded-2xl border-4 border-slate-100 shadow-inner"></div>
            <button 
              onClick={() => setIsScanning(false)}
              className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 flex items-center justify-center space-x-2 transition-colors"
            >
              <X size={18} />
              <span>Cancel Scanning</span>
            </button>
          </div>
        )}

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {feedback.type === 'success' && <CheckCircle className="shrink-0" />}
            {feedback.type === 'error' && <XCircle className="shrink-0" />}
            {feedback.type === 'info' && <AlertTriangle className="shrink-0" />}
            <span className="font-medium text-sm">{feedback.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
