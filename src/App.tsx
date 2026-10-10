import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import SaranaView from './components/SaranaView';
import WilayahView from './components/WilayahView';
import MapView from './components/MapView';
import LaporanView from './components/LaporanView';
import GoogleSheetModal from './components/GoogleSheetModal';
import LoginView from './components/LoginView';
import {
  IdentitasWilayah,
  SaranaSanitasi,
  GoogleSheetConfig,
} from './types/sanitasi';
import {
  getSavedWilayah,
  saveWilayah,
  getSavedSarana,
  saveSarana,
  getSavedConfig,
  saveConfig,
  calculateStats,
  getSavedAuth,
  saveAuth,
  fetchFromGoogleSheet,
} from './services/googleSheets';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getSavedAuth());

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Data (Initial clean/empty state)
  const [wilayahList, setWilayahList] = useState<IdentitasWilayah[]>(() => getSavedWilayah());
  const [saranaList, setSaranaList] = useState<SaranaSanitasi[]>(() => getSavedSarana());
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => getSavedConfig());

  // Filter States
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');

  // Modals
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [selectedSaranaDetail, setSelectedSaranaDetail] = useState<SaranaSanitasi | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    saveWilayah(wilayahList);
  }, [wilayahList]);

  useEffect(() => {
    saveSarana(saranaList);
  }, [saranaList]);

  useEffect(() => {
    saveConfig(sheetConfig);
  }, [sheetConfig]);

  // Auto-sync from embedded Google Sheet URL on startup if configured
  useEffect(() => {
    if (isAuthenticated && sheetConfig.sheetUrl && sheetConfig.autoSync && saranaList.length === 0) {
      fetchFromGoogleSheet(sheetConfig.sheetUrl).then((res) => {
        if (res.sarana && res.sarana.length > 0) {
          setSaranaList(res.sarana);
          showToast(`Otomatis memuat ${res.sarana.length} data dari Google Spreadsheet!`);
        }
      });
    }
  }, [isAuthenticated, sheetConfig.sheetUrl, sheetConfig.autoSync]);

  // Derived Dashboard Stats
  const stats = useMemo(() => {
    return calculateStats(wilayahList, saranaList, selectedKecamatan, selectedDesa);
  }, [wilayahList, saranaList, selectedKecamatan, selectedDesa]);

  // Auth handlers
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    saveAuth(true);
    showToast('Selamat datang, Petugas Sanitasi Cipta Karya!');
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      setIsAuthenticated(false);
      saveAuth(false);
      showToast('Anda telah keluar dari sistem.');
    }
  };

  // Wilayah CRUD
  const handleAddWilayah = (data: Omit<IdentitasWilayah, 'id' | 'updatedAt'>) => {
    const newWilayah: IdentitasWilayah = {
      ...data,
      id: `wil-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setWilayahList((prev) => [newWilayah, ...prev]);
    showToast(`Data wilayah ${data.desaKelurahan} berhasil ditambahkan!`);
  };

  const handleUpdateWilayah = (updated: IdentitasWilayah) => {
    setWilayahList((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    showToast(`Data wilayah ${updated.desaKelurahan} berhasil diperbarui!`);
  };

  const handleDeleteWilayah = (id: string) => {
    setWilayahList((prev) => prev.filter((w) => w.id !== id));
    showToast('Data wilayah berhasil dihapus.');
  };

  // Sarana CRUD
  const handleAddSarana = (data: Omit<SaranaSanitasi, 'id'>) => {
    const newSarana: SaranaSanitasi = {
      ...data,
      id: `srn-${Date.now()}`,
    };
    setSaranaList((prev) => [newSarana, ...prev]);
    showToast(`Data sarana sanitasi atas nama ${data.namaPemilik} berhasil disimpan!`);
  };

  const handleUpdateSarana = (updated: SaranaSanitasi) => {
    setSaranaList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`Data sarana ${updated.namaPemilik} berhasil diperbarui!`);
  };

  const handleDeleteSarana = (id: string) => {
    setSaranaList((prev) => prev.filter((s) => s.id !== id));
    showToast('Data sarana berhasil dihapus.');
  };

  const handleImportSaranaFromSheet = (importedSarana: SaranaSanitasi[]) => {
    setSaranaList(importedSarana);
    showToast(`Berhasil menyinkronkan ${importedSarana.length} data dari Google Spreadsheet!`);
  };

  const handleOpenAddSaranaModal = () => {
    setCurrentTab('sarana');
  };

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
        onOpenAddSarana={handleOpenAddSaranaModal}
        onLogout={handleLogout}
        config={sheetConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            wilayahList={wilayahList}
            saranaList={saranaList}
            stats={stats}
            selectedKecamatan={selectedKecamatan}
            selectedDesa={selectedDesa}
            onSelectKecamatan={setSelectedKecamatan}
            onSelectDesa={setSelectedDesa}
            onOpenAddSarana={handleOpenAddSaranaModal}
            onOpenGoogleSheetModal={() => setIsGoogleSheetModalOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onSelectSaranaForDetail={(item) => setSelectedSaranaDetail(item)}
          />
        )}

        {currentTab === 'sarana' && (
          <SaranaView
            saranaList={saranaList}
            wilayahList={wilayahList}
            onAddSarana={handleAddSarana}
            onUpdateSarana={handleUpdateSarana}
            onDeleteSarana={handleDeleteSarana}
            selectedSaranaForModal={selectedSaranaDetail}
            onCloseDetailModal={() => setSelectedSaranaDetail(null)}
            onOpenDetailModal={(item) => setSelectedSaranaDetail(item)}
          />
        )}

        {currentTab === 'wilayah' && (
          <WilayahView
            wilayahList={wilayahList}
            onAddWilayah={handleAddWilayah}
            onUpdateWilayah={handleUpdateWilayah}
            onDeleteWilayah={handleDeleteWilayah}
          />
        )}

        {currentTab === 'peta' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Peta Spasial GIS Sanitasi Cipta Karya</h2>
                <p className="text-xs text-slate-500">
                  Visualisasi sebaran koordinat titik sarana septik tank, kondisi fisik, dan status operasional
                </p>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Total Titik Terpetakan: <span className="font-bold text-blue-600">{saranaList.length}</span>
              </div>
            </div>

            <div className="h-[620px]">
              <MapView
                saranaList={saranaList}
                selectedKecamatan={selectedKecamatan}
                selectedDesa={selectedDesa}
                onSelectSarana={(item) => setSelectedSaranaDetail(item)}
              />
            </div>
          </div>
        )}

        {currentTab === 'laporan' && (
          <LaporanView wilayahList={wilayahList} saranaList={saranaList} />
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-700">SIM-SANITASI CK</span> • Sistem Informasi Manajemen Data Sanitasi Bidang Cipta Karya
          </div>
          <div className="flex items-center gap-4">
            <span>Dinas PUPR</span>
            <span>•</span>
            <button
              onClick={() => setIsGoogleSheetModalOpen(true)}
              className="hover:text-blue-600 underline font-medium cursor-pointer"
            >
              Koneksi Google Spreadsheet
            </button>
            <span>•</span>
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 font-medium cursor-pointer"
            >
              Keluar (Logout)
            </button>
          </div>
        </div>
      </footer>

      {/* Google Sheet Integration Modal */}
      <GoogleSheetModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={(cfg) => setSheetConfig(cfg)}
        wilayahList={wilayahList}
        saranaList={saranaList}
        onImportSarana={handleImportSaranaFromSheet}
      />
    </div>
  );
}
