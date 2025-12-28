
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanResult, AttendanceRecord, AttendanceType } from '../types';
import { storageService } from '../services/storage';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (record: AttendanceRecord) => void;
  timekeeperId: string;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, timekeeperId }) => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScan, onScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScan = (decodedText: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      // Expected format: Base64 JSON or plain JSON string
      // For this app we assume JSON: {"workerId": "W001", "name": "John Doe", "siteId": "S001"}
      let data: ScanResult;
      try {
        data = JSON.parse(decodedText);
      } catch {
        // Fallback: try base64
        data = JSON.parse(atob(decodedText));
      }

      if (!data.workerId || !data.siteId) throw new Error("Invalid QR Code Data");

      handleAttendance(data);
    } catch (err) {
      showFeedback('error', 'Invalid QR code. Please scan a valid worker badge.');
      setIsProcessing(false);
    }
  };

  const onScanError = (err: any) => {
    // Too many logs on errors (common while scanning) - skip
  };

  const handleAttendance = (data: ScanResult) => {
    const today = new Date().toISOString().split('T')[0];
    const attendance = storageService.getAttendance();
    const sites = storageService.getSites();
    const workers = storageService.getWorkers();

    const worker = workers.find(w => w.id === data.workerId);
    const site = sites.find(s => s.id === data.siteId);

    if (!worker || !site) {
      showFeedback('error', 'Worker or site not recognized.');
      setIsProcessing(false);
      return;
    }

    // Logic: Find record for worker today
    let record = attendance.find(r => r.workerId === data.workerId && r.date === today);
    const now = new Date().toISOString();

    if (record) {
      if (record.checkInTime && record.checkOutTime) {
        showFeedback('info', `${worker.name} already checked IN and OUT today.`);
        setIsProcessing(false);
        return;
      }
      
      // Perform Check OUT
      record.checkOutTime = now;
      record.status = 'PENDING';
      showFeedback('success', `Check OUT successful for ${worker.name}`);
    } else {
      // Perform Check IN
      record = {
        id: `ATT-${Date.now()}`,
        date: today,
        workerId: worker.id,
        workerName: worker.name,
        workerRole: worker.role,
        siteId: site.id,
        siteName: site.name,
        timekeeperId: timekeeperId,
        checkInTime: now,
        status: 'PENDING'
      };
      attendance.push(record);
      showFeedback('success', `Check IN successful for ${worker.name}`);
    }

    storageService.saveAttendance(attendance);
    onScanSuccess(record);
    
    // Reset scanner state after delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 2000);
  };

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 relative">
        <h2 className="text-xl font-bold mb-4 text-center">QR Attendance Scanner</h2>
        <p className="text-slate-500 text-sm text-center mb-6">Position the worker's QR code within the frame</p>
        
        <div id="qr-reader" className="overflow-hidden rounded-2xl border-4 border-slate-100"></div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-center space-x-3 animate-bounce ${
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

        <div className="mt-8 bg-slate-50 p-4 rounded-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Instructions</h3>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Ensure good lighting on the QR code</li>
            <li>• First scan of the day will mark "IN"</li>
            <li>• Second scan will mark "OUT"</li>
            <li>• System generates immutable timestamps</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
