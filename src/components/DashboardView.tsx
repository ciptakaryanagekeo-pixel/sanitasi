import React from 'react';
import { IdentitasWilayah, SaranaSanitasi, DashboardStats } from '../types/sanitasi';
import {
  Home,
  Users,
  Layers,
  CheckCircle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Filter,
  RotateCcw,
  Plus,
  FileSpreadsheet,
  MapPin,
  TrendingUp,
  Activity,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
  Clock,
  Sparkles,
  Inbox,
  UploadCloud,
} from 'lucide-react';
import MapView from './MapView';

interface DashboardViewProps {
  wilayahList: IdentitasWilayah[];
  saranaList: SaranaSanitasi[];
  stats: DashboardStats;
  selectedKecamatan: string;
  selectedDesa: string;
  onSelectKecamatan: (kec: string) => void;
  onSelectDesa: (desa: string) => void;
  onOpenAddSarana: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectSaranaForDetail: (sarana: SaranaSanitasi) => void;
  isAutoSyncing?: boolean;
}

export default function DashboardView({
  wilayahList,
  saranaList,
  stats,
  selectedKecamatan,
  selectedDesa,
  onSelectKecamatan,
  onSelectDesa,
  onOpenAddSarana,
  onNavigateToTab,
  onSelectSaranaForDetail,
  isAutoSyncing = false,
}: DashboardViewProps) {
  // Extract unique kecamatan
  const uniqueKecamatan = Array.from(
    new Set([...wilayahList.map((w) => w.kecamatan), ...saranaList.map((s) => s.kecamatan)])
  ).filter(Boolean);

  // Extract desa based on selected kecamatan
  const uniqueDesa = Array.from(
    new Set(
      [
        ...wilayahList
          .filter((w) => !selectedKecamatan || w.kecamatan.toLowerCase() === selectedKecamatan.toLowerCase())
          .map((w) => w.desaKelurahan),
        ...saranaList
          .filter((s) => !selectedKecamatan || s.kecamatan.toLowerCase() === selectedKecamatan.toLowerCase())
          .map((s) => s.desaKelurahan),
      ].filter(Boolean)
    )
  );

  // Calculate percentages
  const pctBerfungsi = stats.totalSarana > 0 ? Math.round((stats.berfungsi / stats.totalSarana) * 100) : 0;
  const pctRusak = stats.totalSarana > 0 ? Math.round((stats.rusak / stats.totalSarana) * 100) : 0;
  const pctSeptic = stats.totalSarana > 0 ? Math.round((stats.memilikiSepticTank / stats.totalSarana) * 100) : 0;
  const pctBelumSeptic = stats.totalSarana > 0 ? Math.round((stats.belumMemilikiSepticTank / stats.totalSarana) * 100) : 0;

  // Breakdown by sarana type
  const saranaByType: Record<string, number> = {};
  saranaList
    .filter((s) => {
      if (selectedKecamatan && s.kecamatan.toLowerCase() !== selectedKecamatan.toLowerCase()) return false;
      if (selectedDesa && s.desaKelurahan.toLowerCase() !== selectedDesa.toLowerCase()) return false;
      return true;
    })
    .forEach((s) => {
      saranaByType[s.jenisSarana] = (saranaByType[s.jenisSarana] || 0) + 1;
    });

  // Recent surveys
  const recentSurveys = [...saranaList]
    .filter((s) => {
      if (selectedKecamatan && s.kecamatan.toLowerCase() !== selectedKecamatan.toLowerCase()) return false;
      if (selectedDesa && s.desaKelurahan.toLowerCase() !== selectedDesa.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => new Date(b.tanggalSurvey).getTime() - new Date(a.tanggalSurvey).getTime())
    .slice(0, 5);

  const isEmptyDatabase = saranaList.length === 0 && wilayahList.length === 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-2.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Sistem Informasi Sanitasi Bidang Cipta Karya (CK)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Executive Dashboard Sanitasi & Kelayakan
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Monitoring indikator akses sanitasi layak, kondisi kerusakan fisik sarana, dan penerima bantuan infrastruktur terpadu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 rounded-xl text-xs font-semibold backdrop-blur-sm">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isAutoSyncing ? 'animate-ping' : ''}`} />
              <span>Auto-Sync Sheet Aktif</span>
            </div>
            <button
              onClick={onOpenAddSarana}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-700/30 transition transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Input Data Sarana
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY DATABASE CALL-TO-ACTION (When app is completely clean) */}
      {isEmptyDatabase && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Basis Data Siap Digunakan
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Data yang Anda input akan <b>otomatis langsung terkirim ke Google Spreadsheet</b> di background tanpa perlu tombol kirim manual!
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={onOpenAddSarana}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Input Sarana Sanitasi Baru
            </button>
            <button
              onClick={() => onNavigateToTab('wilayah')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-indigo-600" /> Input Identitas Wilayah
            </button>
          </div>
        </div>
      )}

      {/* FILTER SECTION (Photo 1 Requirement: Filter Kecamatan, Desa/Kelurahan) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Filter Wilayah Kerja</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {selectedKecamatan ? `Kec. ${selectedKecamatan}` : 'Seluruh Wilayah Kabupaten'}
              {selectedDesa ? ` → Desa ${selectedDesa}` : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Kecamatan */}
          <div className="flex-1 sm:flex-none min-w-[170px]">
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                onSelectKecamatan(e.target.value);
                onSelectDesa('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kecamatan ({uniqueKecamatan.length})</option>
              {uniqueKecamatan.map((kec) => (
                <option key={kec} value={kec}>
                  Kecamatan {kec}
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Desa/Kelurahan */}
          <div className="flex-1 sm:flex-none min-w-[170px]">
            <select
              value={selectedDesa}
              onChange={(e) => onSelectDesa(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Desa / Kelurahan ({uniqueDesa.length})</option>
              {uniqueDesa.map((desa) => (
                <option key={desa} value={desa}>
                  Desa/Kel. {desa}
                </option>
              ))}
            </select>
          </div>

          {(selectedKecamatan || selectedDesa) && (
            <button
              onClick={() => {
                onSelectKecamatan('');
                onSelectDesa('');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* KARTU INFORMASI INDIKATOR (Photo 1 Requirement) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Kartu Informasi Indikator Sanitasi (Photo 1)
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Rekapitulasi Data Terverifikasi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Rumah */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Rumah</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900">
                {stats.totalRumah.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-blue-600 font-semibold">Unit Bangunan</span> di wilayah terpilih
              </p>
            </div>
          </div>

          {/* Card 2: Total KK */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total KK</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900">
                {stats.totalKK.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-purple-600 font-semibold">Kepala Keluarga</span> terdaftar
              </p>
            </div>
          </div>

          {/* Card 3: Total Sarana Sanitasi */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Sarana Sanitasi</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900">
                {stats.totalSarana.toLocaleString('id-ID')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Titik sarana fisik terverifikasi
              </p>
            </div>
          </div>

          {/* Card 4: Berfungsi */}
          <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/20 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Berfungsi</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-emerald-700">
                  {stats.berfungsi.toLocaleString('id-ID')}
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                  {pctBerfungsi}%
                </span>
              </div>
              <p className="text-[11px] text-emerald-700/80 mt-1">
                Sarana layak digunakan normal
              </p>
            </div>
          </div>

          {/* Card 5: Rusak */}
          <div className="bg-white rounded-xl p-4 border border-rose-200 bg-rose-50/20 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Rusak / Tidak Berfungsi</span>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-rose-700">
                  {stats.rusak.toLocaleString('id-ID')}
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-full">
                  {pctRusak}%
                </span>
              </div>
              <p className="text-[11px] text-rose-700/80 mt-1">
                Rusak Ringan: <span className="font-bold">{stats.rusakRingan}</span> | Rusak Berat: <span className="font-bold">{stats.rusakBerat}</span>
              </p>
            </div>
          </div>

          {/* Card 6: Memiliki Septic Tank */}
          <div className="bg-white rounded-xl p-4 border border-blue-200 bg-blue-50/20 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Memiliki Septic Tank</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-blue-800">
                  {stats.memilikiSepticTank.toLocaleString('id-ID')}
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full">
                  {pctSeptic}%
                </span>
              </div>
              <p className="text-[11px] text-blue-700/80 mt-1">
                Tangki kedap penampung tinja
              </p>
            </div>
          </div>

          {/* Card 7: Belum Memiliki Septic Tank */}
          <div className="bg-white rounded-xl p-4 border border-amber-200 bg-amber-50/20 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Belum Memiliki Septic Tank</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-amber-700">
                  {stats.belumMemilikiSepticTank.toLocaleString('id-ID')}
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                  {pctBelumSeptic}%
                </span>
              </div>
              <p className="text-[11px] text-amber-700/80 mt-1">
                Prioritas intervensi DAK / APBD
              </p>
            </div>
          </div>

          {/* Card 8: Indeks Kelayakan SPM Sanitasi */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Akses Sanitasi Layak</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {pctSeptic}% <span className="text-xs font-semibold text-emerald-600">Aman</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pctSeptic}%` }}
                />
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
              <span>Target SPM: 100%</span>
              <button onClick={() => onNavigateToTab('laporan')} className="text-blue-600 font-semibold hover:underline">
                Rekapitulasi →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCED CHARTS & KPI VISUALIZATION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Donut Visualization of Septic Tank Ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-blue-600" /> Rasio Keberadaan Septic Tank
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{stats.totalSarana} Total</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Proporsi sarana yang memenuhi standar penampungan kedap</p>

            {/* SVG Donut Chart */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="3.8"
                  />
                  {/* Arc Memiliki Septic Tank */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#2563EB"
                    strokeWidth="3.8"
                    strokeDasharray={`${pctSeptic} ${100 - pctSeptic}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                  {/* Arc Belum Memiliki */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="3.8"
                    strokeDasharray={`${pctBelumSeptic} ${100 - pctBelumSeptic}`}
                    strokeDashoffset={`-${pctSeptic}`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute text-center">
                  <span className="text-xl font-extrabold text-slate-900 block leading-none">{pctSeptic}%</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Septic Tank</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />
                <span className="text-slate-700 font-medium">Memiliki Septic Tank</span>
              </div>
              <span className="font-bold text-slate-900">{stats.memilikiSepticTank} unit ({pctSeptic}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-slate-700 font-medium">Belum Memiliki Septic Tank</span>
              </div>
              <span className="font-bold text-slate-900">{stats.belumMemilikiSepticTank} unit ({pctBelumSeptic}%)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Kondisi Fisik Sarana (Bar Chart Breakdown) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600" /> Analisa Kerusakan & Kondisi Fisik
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">TFL Survey</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Klasifikasi tingkat kelayakan infrastruktur sarana</p>

            <div className="space-y-4">
              {/* Baik */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Kondisi Baik (Berfungsi Sempurna)
                  </span>
                  <span className="text-emerald-700 font-bold">
                    {stats.kondisiBaik} ({stats.totalSarana > 0 ? Math.round((stats.kondisiBaik / stats.totalSarana) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.totalSarana > 0 ? (stats.kondisiBaik / stats.totalSarana) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rusak Ringan */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Rusak Ringan (Keran/Tutup Retak)
                  </span>
                  <span className="text-amber-700 font-bold">
                    {stats.rusakRingan} ({stats.totalSarana > 0 ? Math.round((stats.rusakRingan / stats.totalSarana) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.totalSarana > 0 ? (stats.rusakRingan / stats.totalSarana) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Rusak Berat */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Rusak Berat (Ambles / Buntu / Bocor)
                  </span>
                  <span className="text-rose-700 font-bold">
                    {stats.rusakBerat} ({stats.totalSarana > 0 ? Math.round((stats.rusakBerat / stats.totalSarana) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stats.totalSarana > 0 ? (stats.rusakBerat / stats.totalSarana) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Standar Teknis Permen PUPR</span>
            <span className="font-semibold text-rose-600">
              {stats.rusakBerat} Unit Perlu Rehabilitasi
            </span>
          </div>
        </div>

        {/* Chart 3: Distribusi Jenis Sarana Sanitasi */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" /> Jenis Sarana Sanitasi (Photo 2B)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">{Object.keys(saranaByType).length} Tipe</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">Pengelompokan teknologi sanitasi di lapangan</p>

            <div className="space-y-3">
              {Object.keys(saranaByType).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs space-y-1">
                  <Inbox className="w-8 h-8 mx-auto opacity-40 mb-1" />
                  <p>Belum ada data sarana yang tercatat</p>
                  <p className="text-[10px]">Klik "Input Data Sarana" untuk menambahkan</p>
                </div>
              ) : (
                Object.entries(saranaByType).map(([jenis, count]) => {
                  const pct = stats.totalSarana > 0 ? Math.round((count / stats.totalSarana) * 100) : 0;
                  return (
                    <div key={jenis} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-700 truncate pr-2">{jenis}</span>
                        <span className="text-slate-900 font-bold">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            jenis.includes('Septic')
                              ? 'bg-blue-600'
                              : jenis.includes('Komunal')
                              ? 'bg-purple-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Kategori DAK Sanitasi & Swadaya</span>
            <button onClick={() => onNavigateToTab('sarana')} className="text-blue-600 font-semibold hover:underline">
              Semua Jenis →
            </button>
          </div>
        </div>
      </div>

      {/* MAP & RECENT SURVEY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive GIS Map Preview */}
        <div className="lg:col-span-2 flex flex-col">
          <MapView
            saranaList={saranaList}
            selectedKecamatan={selectedKecamatan}
            selectedDesa={selectedDesa}
            onSelectSarana={onSelectSaranaForDetail}
          />
        </div>

        {/* Recent Survey Activity */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" /> Verifikasi Lapangan Terkini
              </h3>
              <span className="text-[11px] text-slate-400">{recentSurveys.length} Terbaru</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Daftar penerima yang baru diverifikasi</p>

            <div className="space-y-2.5">
              {recentSurveys.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <p>Belum ada rekaman survey lapangan</p>
                </div>
              ) : (
                recentSurveys.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectSaranaForDetail(item)}
                    className="p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.namaPemilik}</div>
                      <div className="text-[11px] text-slate-500">
                        Desa {item.desaKelurahan} • {item.jenisSarana}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.kondisi === 'Baik'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.kondisi === 'Rusak Ringan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.kondisi}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.tanggalSurvey}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateToTab('sarana')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              Lihat Seluruh Data Sarana ({saranaList.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
