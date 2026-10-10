import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import SaranaView from './components/SaranaView';
import WilayahView from './components/WilayahView';
import MapView from './components/MapView';
import LaporanView from './components/LaporanView';
import LoginView from './components/LoginView';
import {
  IdentitasWilayah,
  SaranaSanitasi,
} from './types/sanitasi';
import {
  getSavedWilayah,
  saveWilayah,
  getSavedSarana,
  saveSarana,
  calculateStats,
  getSavedAuth,
  saveAuth,
  fetchFromGoogleSheet,
  autoSyncToSheet,
  getSavedConfig,
} from './services/googleSheets';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getSavedAuth());

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Core Data
  const [wilayahList, setWilayahList] = useState<IdentitasWilayah[]>(() => getSavedWilayah());
  const [saranaList, setSaranaList] = useState<SaranaSanitasi[]>(() => getSavedSarana());

  // Auto-sync loading state for subtle UI pulse
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);

  // Filter States
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');

  // Selected Detail Modal
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

  // Auto-pull from embedded Google Sheet URL on startup if available
  useEffect(() => {
    const config = getSavedConfig();
    if (isAuthenticated && config.sheetUrl && saranaList.length === 0) {
      fetchFromGoogleSheet(config.sheetUrl).then((res) => {
        if (res.sarana && res.sarana.length > 0) {
          setSaranaList(res.sarana);
          showToast(`Otomatis memuat ${res.sarana.length} data dari Google Spreadsheet!`);
        }
      });
    }
  }, [isAuthenticated]);

  // Background Auto-sync dispatcher
  const triggerAutoSync = (updatedWilayah: IdentitasWilayah[], updatedSarana: SaranaSanitasi[]) => {
    setIsAutoSyncing(true);
    autoSyncToSheet(updatedWilayah, updatedSarana).then((res) => {
      setIsAutoSyncing(false);
      if (res.success) {
        showToast('Data tersimpan & otomatis terkirim ke Google Sheet!');
      }
    }).catch(() => {
      setIsAutoSyncing(false);
    });
  };

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

  // Wilayah CRUD with immediate auto-sync
  const handleAddWilayah = (data: Omit<IdentitasWilayah, 'id' | 'updatedAt'>) => {
    const newWilayah: IdentitasWilayah = {
      ...data,
      id: `wil-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const nextList = [newWilayah, ...wilayahList];
    setWilayahList(nextList);
    showToast(`Data wilayah ${data.desaKelurahan} berhasil ditambahkan!`);
    triggerAutoSync(nextList, saranaList);
  };

  const handleUpdateWilayah = (updated: IdentitasWilayah) => {
    const nextList = wilayahList.map((w) => (w.id === updated.id ? updated : w));
    setWilayahList(nextList);
    showToast(`Data wilayah ${updated.desaKelurahan} berhasil diperbarui!`);
    triggerAutoSync(nextList, saranaList);
  };

  const handleDeleteWilayah = (id: string) => {
    const nextList = wilayahList.filter((w) => w.id !== id);
    setWilayahList(nextList);
    showToast('Data wilayah berhasil dihapus.');
    triggerAutoSync(nextList, saranaList);
  };

  // Sarana CRUD with immediate auto-sync
  const handleAddSarana = (data: Omit<SaranaSanitasi, 'id'>) => {
    const newSarana: SaranaSanitasi = {
      ...data,
      id: `srn-${Date.now()}`,
    };
    const nextList = [newSarana, ...saranaList];
    setSaranaList(nextList);
    showToast(`Data sarana ${data.namaPemilik} tersimpan & langsung dikirim ke Sheet!`);
    triggerAutoSync(wilayahList, nextList);
  };

  const handleUpdateSarana = (updated: SaranaSanitasi) => {
    const nextList = saranaList.map((s) => (s.id === updated.id ? updated : s));
    setSaranaList(nextList);
    showToast(`Data sarana ${updated.namaPemilik} diperbarui & tersinkron ke Sheet!`);
    triggerAutoSync(wilayahList, nextList);
  };

  const handleDeleteSarana = (id: string) => {
    const nextList = saranaList.filter((s) => s.id !== id);
    setSaranaList(nextList);
    showToast('Data sarana berhasil dihapus.');
    triggerAutoSync(wilayahList, nextList);
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
        onOpenAddSarana={handleOpenAddSaranaModal}
        onLogout={handleLogout}
        isAutoSyncing={isAutoSyncing}
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
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            onSelectSaranaForDetail={(item) => setSelectedSaranaDetail(item)}
            isAutoSyncing={isAutoSyncing}
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
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Auto-Sync Google Sheet Aktif
            </span>
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
    </div>
  );
}
