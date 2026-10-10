import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Building2,
  MapPin,
  FileText,
  Menu,
  X,
  Plus,
  Droplets,
  LogOut,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddSarana: () => void;
  onLogout: () => void;
  isAutoSyncing?: boolean;
}

export default function Navbar({
  currentTab,
  onTabChange,
  onOpenAddSarana,
  onLogout,
  isAutoSyncing = false,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sarana', label: 'Data Sarana & Kerusakan', icon: Layers },
    { id: 'wilayah', label: 'Identitas Wilayah', icon: Building2 },
    { id: 'peta', label: 'Peta Spasial GIS', icon: MapPin },
    { id: 'laporan', label: 'Rekapitulasi Laporan', icon: FileText },
  ];

  const handleNavClick = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  SIM-SANITASI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  CK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Bidang Cipta Karya • Dinas PUPR
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & User Profile */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Auto-Sync Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold" title="Setiap data yang diinput otomatis terkirim langsung ke Google Sheet">
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isAutoSyncing ? 'animate-ping' : ''}`} />
              <span className="hidden md:inline">Auto-Sync Sheet</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddSarana}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Input Data</span>
            </button>

            {/* User Badge & Logout */}
            <div className="flex items-center pl-2 border-l border-slate-200 gap-1.5">
              <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>sanitasi</span>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Keluar dari Sistem (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {/* User info on mobile */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs mb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700">Petugas: sanitasi</span>
            </div>
            <button
              onClick={onLogout}
              className="text-rose-600 font-bold hover:underline text-[11px] flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Otomatis Tersinkron ke Google Sheet</span>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAddSarana();
              }}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 bg-blue-600 text-white shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Input Sarana Sanitasi Baru</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
