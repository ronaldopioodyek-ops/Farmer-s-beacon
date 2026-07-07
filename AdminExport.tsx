import React, { useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  CheckCircle, 
  Database,
  Users,
  MessageSquare,
  AlertCircle
} from "lucide-react";

interface AdminExportProps {
  isAdmin: boolean;
}

export default function AdminExport({ isAdmin }: AdminExportProps) {
  const [exportingType, setExportingType] = useState<"registrations" | "consultations" | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isAdmin) return null;

  // Utility to escape CSV values correctly
  const escapeCSV = (val: any): string => {
    if (val === undefined || val === null) return "";
    let str = String(val);
    // Replace all double quotes with two double quotes
    str = str.replace(/"/g, '""');
    // If value contains comma, double quote, newline, or carriage return, wrap in double quotes
    if (/[",\r\n]/.test(str)) {
      str = `"${str}"`;
    }
    return str;
  };

  const triggerDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRegistrations = async () => {
    setExportingType("registrations");
    setStatusMsg(null);
    try {
      // Fetch registrations from Firestore
      const q = query(collection(db, "training_registrations"), orderBy("registeredAt", "desc"));
      const snapshot = await getDocs(q);
      const rows: any[] = [];
      
      snapshot.forEach((doc) => {
        rows.push({ id: doc.id, ...doc.data() });
      });

      if (rows.length === 0) {
        setStatusMsg({ text: "No training sign-ups found to export.", isError: true });
        setExportingType(null);
        return;
      }

      // Generate CSV headers and rows
      const headers = ["Registration ID", "Training ID", "Training Title", "Farmer Name", "Email Address", "Phone Number", "Registration Date"];
      const csvLines = [
        headers.join(","),
        ...rows.map(row => [
          escapeCSV(row.id),
          escapeCSV(row.trainingId),
          escapeCSV(row.trainingTitle),
          escapeCSV(row.name),
          escapeCSV(row.email),
          escapeCSV(row.phone),
          escapeCSV(row.registeredAt ? new Date(row.registeredAt).toLocaleString() : "")
        ].join(","))
      ];

      const csvContent = "\uFEFF" + csvLines.join("\n"); // Prepend UTF-8 BOM for Excel compatibility
      const dateStr = new Date().toISOString().split('T')[0];
      triggerDownload(csvContent, `agro_training_signups_${dateStr}.csv`);

      setStatusMsg({ text: `Successfully exported ${rows.length} training registration(s).`, isError: false });
    } catch (err) {
      console.error("Export registrations error:", err);
      try {
        handleFirestoreError(err, OperationType.LIST, "training_registrations");
      } catch (e) {
        // Suppress or catch the error to display in UI
      }
      setStatusMsg({ text: "Failed to load registrations from the database.", isError: true });
    } finally {
      setExportingType(null);
    }
  };

  const handleExportConsultations = async () => {
    setExportingType("consultations");
    setStatusMsg(null);
    try {
      // Fetch consultations from Firestore
      const q = query(collection(db, "consultations"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const rows: any[] = [];

      snapshot.forEach((doc) => {
        rows.push({ id: doc.id, ...doc.data() });
      });

      if (rows.length === 0) {
        setStatusMsg({ text: "No consultation requests found to export.", isError: true });
        setExportingType(null);
        return;
      }

      // Generate CSV headers and rows
      const headers = ["Consultation ID", "Farmer Name", "Email Address", "Category", "Query", "Status", "Response", "Submission Date", "Resolution Date"];
      const csvLines = [
        headers.join(","),
        ...rows.map(row => [
          escapeCSV(row.id),
          escapeCSV(row.name),
          escapeCSV(row.email),
          escapeCSV(row.category),
          escapeCSV(row.query),
          escapeCSV(row.status),
          escapeCSV(row.responseText || ""),
          escapeCSV(row.createdAt ? new Date(row.createdAt).toLocaleString() : ""),
          escapeCSV(row.repliedAt ? new Date(row.repliedAt).toLocaleString() : "")
        ].join(","))
      ];

      const csvContent = "\uFEFF" + csvLines.join("\n"); // Prepend UTF-8 BOM
      const dateStr = new Date().toISOString().split('T')[0];
      triggerDownload(csvContent, `agro_consultations_${dateStr}.csv`);

      setStatusMsg({ text: `Successfully exported ${rows.length} consultation request(s).`, isError: false });
    } catch (err) {
      console.error("Export consultations error:", err);
      try {
        handleFirestoreError(err, OperationType.LIST, "consultations");
      } catch (e) {
        // Suppress or catch the error to display in UI
      }
      setStatusMsg({ text: "Failed to load consultations from the database.", isError: true });
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div id="admin-export-container" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Expert Administration Controls</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs">
            Download raw database registries in structured CSV format for offline backups and compliance auditing.
          </p>
        </div>
        <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
      </div>

      {statusMsg && (
        <div className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
          statusMsg.isError 
            ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30" 
            : "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30"
        }`}>
          {statusMsg.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Training Registrations Button */}
        <button
          onClick={handleExportRegistrations}
          disabled={exportingType !== null}
          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-2xl text-left transition-all disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Training Sign-ups</span>
              <span className="text-[10px] text-slate-400">Class rosters, contact, dates</span>
            </div>
          </div>
          {exportingType === "registrations" ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
          ) : (
            <Download className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" />
          )}
        </button>

        {/* Export Consultations Button */}
        <button
          onClick={handleExportConsultations}
          disabled={exportingType !== null}
          className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/40 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-2xl text-left transition-all disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Inquiry Registry</span>
              <span className="text-[10px] text-slate-400">Consultation chats, logs, resolutions</span>
            </div>
          </div>
          {exportingType === "consultations" ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
          ) : (
            <Download className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
}
