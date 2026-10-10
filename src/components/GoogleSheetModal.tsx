import React, { useState } from 'react';
import { GoogleSheetConfig, SaranaSanitasi, IdentitasWilayah } from '../types/sanitasi';
import {
  FileSpreadsheet,
  Link,
  Code2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  HelpCircle,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import {
  extractSheetId,
  fetchFromGoogleSheet,
  syncToGoogleAppsScript,
  GOOGLE_APPS_SCRIPT_CODE,
  exportToCSV,
} from '../services/googleSheets';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (config: GoogleSheetConfig) => void;
  wilayahList: IdentitasWilayah[];
  saranaList: SaranaSanitasi[];
  onImportSarana: (sarana: SaranaSanitasi[]) => void;
}

export default function GoogleSheetModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  wilayahList,
  saranaList,
  onImportSarana,
}: GoogleSheetModalProps) {
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || '');
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl || '');
  const [activeTab, setActiveTab] = useState<'settings' | 'script' | 'template'>('settings');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedHeaders, setCopiedHeaders] = useState(false);

  // Sync state
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    const sheetId = extractSheetId(sheetUrl);
    const newConfig: GoogleSheetConfig = {
      ...config,
      sheetUrl,
      appsScriptUrl,
      status: sheetId || appsScriptUrl ? 'connected' : 'disconnected',
    };
    onSaveConfig(newConfig);
    setSyncStatus({
      type: 'success',
      message: 'Pengaturan Google Spreadsheet tersimpan!',
    });
  };

  // Pull data from Google Sheet link
  const handlePullData = async () => {
    if (!sheetUrl) {
      setSyncStatus({ type: 'error', message: 'Silakan masukkan link Google Spreadsheet Anda terlebih dahulu.' });
      return;
    }

    setIsLoading(true);
    setSyncStatus({ type: 'idle', message: 'Menghubungkan ke Google Spreadsheet...' });

    const result = await fetchFromGoogleSheet(sheetUrl);
    setIsLoading(false);

    if (result.error) {
      setSyncStatus({ type: 'error', message: result.error });
    } else if (result.sarana && result.sarana.length > 0) {
      onImportSarana(result.sarana);
      setSyncStatus({
        type: 'success',
        message: `Berhasil mengimpor ${result.sarana.length} data sarana dari Google Spreadsheet!`,
      });
      onSaveConfig({
        ...config,
        sheetUrl,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
        status: 'connected',
      });
    } else {
      setSyncStatus({
        type: 'error',
        message: 'Spreadsheet terhubung, namun tidak ditemukan baris data pada sheet "Data_Sarana". Silakan unduh template di tab Panduan Template.',
      });
    }
  };

  // Push data to Google Apps Script Web App
  const handlePushData = async () => {
    if (!appsScriptUrl) {
      setSyncStatus({
        type: 'error',
        message: 'Masukkan URL Web App Google Apps Script untuk mengirim data secara otomatis ke sheet.',
      });
      return;
    }

    setIsLoading(true);
    setSyncStatus({ type: 'idle', message: 'Mengirim data ke Google Spreadsheet...' });

    const result = await syncToGoogleAppsScript(appsScriptUrl, wilayahList, saranaList);
    setIsLoading(false);

    if (result.success) {
      setSyncStatus({ type: 'success', message: result.message });
      onSaveConfig({
        ...config,
        sheetUrl,
        appsScriptUrl,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
        status: 'connected',
      });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        ID: 'srn-001',
        'Nama Pemilik': 'Bpk. Yohanes Doe',
        NIK: '5316011234560001',
        'No HP': '081234567890',
        'Jumlah Jiwa': 4,
        'Alamat Lengkap': 'Jl. Kartini RT 02/RW 01',
        Kecamatan: 'Aesesa',
        'Desa/Kelurahan': 'Danga',
        Dusun: 'Dusun I',
        'Jenis Sarana': 'Septic Tank Konvensional',
        'Septic Tank': 'Ya',
        Latitude: -8.5724,
        Longitude: 121.2891,
        Kondisi: 'Baik',
        Status: 'Berfungsi',
        'Foto URL': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
        'Sumber Dana': 'DAK Sanitasi 2024',
        Tahun: 2024,
        'Keterangan Kerusakan': '',
        'Tanggal Survey': '2026-03-10',
        Surveyor: 'Petugas Cipta Karya',
      },
    ];
    exportToCSV('Template_GoogleSheet_SIM_Sanitasi_CK', templateRows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Integrasi Server Google Worksheet</h3>
              <p className="text-xs text-slate-500">
                Hubungkan basis data aplikasi dengan Google Spreadsheet pilihan Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link className="w-4 h-4" /> Hubungkan Link Sheet
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" /> Skrip Apps Script (2-Arah)
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'template'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Panduan & Template Sheet
          </button>
        </div>

        {/* Tab 1: Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            {/* Status indicator */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    config.status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className="font-semibold text-slate-700">
                  Status: {config.status === 'connected' ? 'Terhubung ke Google Sheet' : 'Belum Terhubung'}
                </span>
              </div>
              {config.lastSyncedAt && (
                <span className="text-[11px] text-slate-500">
                  Terakhir Sinkron: {config.lastSyncedAt}
                </span>
              )}
            </div>

            {/* Input Google Sheet Link */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Link Google Spreadsheet Anda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                💡 <b>Petunjuk:</b> Buka Google Sheet Anda, klik tombol <b>Bagikan (Share)</b> di pojok kanan atas, lalu ubah akses menjadi: <i>"Siapa saja yang memiliki link: Pelihat (Viewer)"</i>.
              </p>
            </div>

            {/* Input Apps Script URL for Two-Way write */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                URL Google Apps Script Web App (Opsional untuk Simpan Otomatis 2-Arah)
              </label>
              <input
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Gunakan jika Anda ingin aplikasi dapat langsung mengunggah & memperbarui sheet saat ada input baru. Lihat tab <b>Skrip Apps Script</b> di atas.
              </p>
            </div>

            {/* Status alerts */}
            {syncStatus.message && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 ${
                  syncStatus.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : syncStatus.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                {syncStatus.type === 'idle' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
                <p className="text-xs">{syncStatus.message}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition"
              >
                Simpan Pengaturan
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePullData}
                  disabled={isLoading}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4" /> Tarik Data dari Sheet
                </button>

                {appsScriptUrl && (
                  <button
                    type="button"
                    onClick={handlePushData}
                    disabled={isLoading}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" /> Kirim Data ke Sheet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Apps Script Code */}
        {activeTab === 'script' && (
          <div className="space-y-4 text-xs">
            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-blue-900">
              <h4 className="font-bold flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" /> Cara Memasang Skrip Apps Script (2 Menit Selesai):
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-800 pl-1">
                <li>Buka Google Spreadsheet Anda.</li>
                <li>Klik menu <b>Ekstensi</b> → <b>Apps Script</b>.</li>
                <li>Hapus kode yang ada, lalu klik tombol <b>Salin Skrip</b> di bawah dan tempelkan.</li>
                <li>Klik tombol biru <b>Terapkan (Deploy)</b> → <b>Penerapan Baru (New Deployment)</b>.</li>
                <li>Pilih jenis <b>Aplikasi Web (Web App)</b>, isi akses: <i>"Siapa saja (Anyone)"</i>.</li>
                <li>Salin link Web App yang berakhiran <code>/exec</code> dan tempelkan di form pengaturan aplikasi!</li>
              </ol>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-3 py-1.5 rounded-t-lg text-[11px]">
                <span className="font-mono">GoogleAppsScript_SIM_Sanitasi.js</span>
                <button
                  onClick={handleCopyScript}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedScript ? 'Tersalin!' : 'Salin Kode'}
                </button>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-b-lg font-mono text-[11px] overflow-x-auto max-h-60 leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Template Sheet */}
        {activeTab === 'template' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Struktur Kolom Header Google Spreadsheet</h4>
              <p className="text-slate-600 text-xs">
                Aplikasi SIM-SANITASI membaca sheet dengan nama tab <b>Data_Sarana</b> dan <b>Identitas_Wilayah</b>.
              </p>

              <div className="mt-3">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  1. Tab "Data_Sarana" (Wajib memiliki kolom):
                </span>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 overflow-x-auto">
                  Nama Pemilik | NIK | No HP | Jumlah Jiwa | Alamat Lengkap | Kecamatan | Desa/Kelurahan | Dusun | Jenis Sarana | Septic Tank | Latitude | Longitude | Kondisi | Status | Foto URL | Sumber Dana | Tahun | Keterangan Kerusakan | Tanggal Survey | Surveyor
                </div>
              </div>

              <div className="mt-3">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">
                  2. Tab "Identitas_Wilayah":
                </span>
                <div className="p-2.5 bg-white border border-slate-200 rounded-lg font-mono text-[11px] text-slate-700 overflow-x-auto">
                  ID | Kecamatan | Desa/Kelurahan | Dusun/Alamat | Jumlah Rumah | Jumlah KK | Catatan
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
                >
                  <DownloadCloud className="w-4 h-4" /> Unduh File Contoh Template Spreadsheet (.csv)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
