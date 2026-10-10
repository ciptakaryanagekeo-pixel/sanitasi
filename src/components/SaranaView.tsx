import React, { useState } from 'react';
import { SaranaSanitasi, JenisSarana, KondisiSarana, StatusKeberfungsian, IdentitasWilayah } from '../types/sanitasi';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Camera,
  Navigation,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Crosshair,
  User,
  Home,
  Check,
  X,
  Layers,
  Phone,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  LayoutGrid,
  List,
} from 'lucide-react';
import { exportToCSV } from '../services/googleSheets';

interface SaranaViewProps {
  saranaList: SaranaSanitasi[];
  wilayahList: IdentitasWilayah[];
  onAddSarana: (data: Omit<SaranaSanitasi, 'id'>) => void;
  onUpdateSarana: (sarana: SaranaSanitasi) => void;
  onDeleteSarana: (id: string) => void;
  selectedSaranaForModal?: SaranaSanitasi | null;
  onCloseDetailModal?: () => void;
  onOpenDetailModal?: (sarana: SaranaSanitasi) => void;
}

const JENIS_SARANA_OPTIONS: JenisSarana[] = [
  'Septic Tank Konvensional',
  'Septic Tank Biofilter',
  'Jamban Tanpa Septic Tank',
  'Jamban Komunal',
  'MCK Umum',
  'Cubluk',
];

export default function SaranaView({
  saranaList,
  wilayahList,
  onAddSarana,
  onUpdateSarana,
  onDeleteSarana,
  selectedSaranaForModal,
  onCloseDetailModal,
  onOpenDetailModal,
}: SaranaViewProps) {
  // View mode: table or cards
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [filterDesa, setFilterDesa] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterKondisi, setFilterKondisi] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeptic, setFilterSeptic] = useState('');

  // Form State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaranaSanitasi | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Detail Modal local state
  const [detailSarana, setDetailSarana] = useState<SaranaSanitasi | null>(selectedSaranaForModal || null);

  const initialForm = {
    namaPemilik: '',
    nik: '',
    noHp: '',
    jumlahPengguna: 4,
    alamatLengkap: '',
    kecamatan: wilayahList[0]?.kecamatan || 'Aesesa',
    desaKelurahan: wilayahList[0]?.desaKelurahan || 'Danga',
    dusun: '',
    jenisSarana: 'Septic Tank Konvensional' as JenisSarana,
    memilikiSepticTank: true,
    latitude: -8.5724,
    longitude: 121.2891,
    kondisi: 'Baik' as KondisiSarana,
    status: 'Berfungsi' as StatusKeberfungsian,
    fotoUrl: '',
    sumberDana: 'DAK Sanitasi',
    tahunPembangunan: new Date().getFullYear(),
    keteranganKerusakan: '',
    tanggalSurvey: new Date().toISOString().split('T')[0],
    surveyor: 'Petugas TFL Cipta Karya',
  };

  const [formData, setFormData] = useState(initialForm);

  // Extract unique kecamatan & desa for filter
  const uniqueKecamatan = Array.from(new Set([...wilayahList.map((w) => w.kecamatan), ...saranaList.map((s) => s.kecamatan)])).filter(Boolean);
  const uniqueDesa = Array.from(
    new Set(
      [
        ...wilayahList
          .filter((w) => !filterKecamatan || w.kecamatan.toLowerCase() === filterKecamatan.toLowerCase())
          .map((w) => w.desaKelurahan),
        ...saranaList
          .filter((s) => !filterKecamatan || s.kecamatan.toLowerCase() === filterKecamatan.toLowerCase())
          .map((s) => s.desaKelurahan),
      ].filter(Boolean)
    )
  );

  // Filtered List
  const filteredSarana = saranaList.filter((item) => {
    if (filterKecamatan && item.kecamatan.toLowerCase() !== filterKecamatan.toLowerCase()) return false;
    if (filterDesa && item.desaKelurahan.toLowerCase() !== filterDesa.toLowerCase()) return false;
    if (filterJenis && item.jenisSarana !== filterJenis) return false;
    if (filterKondisi && item.kondisi !== filterKondisi) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterSeptic === 'ya' && !item.memilikiSepticTank) return false;
    if (filterSeptic === 'tidak' && item.memilikiSepticTank) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNama = item.namaPemilik.toLowerCase().includes(q);
      const matchNIK = item.nik?.toLowerCase().includes(q);
      const matchAlamat = item.alamatLengkap.toLowerCase().includes(q);
      const matchDusun = item.dusun.toLowerCase().includes(q);
      const matchKec = item.kecamatan.toLowerCase().includes(q);
      const matchDesa = item.desaKelurahan.toLowerCase().includes(q);
      return matchNama || matchNIK || matchAlamat || matchDusun || matchKec || matchDesa;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      ...initialForm,
      kecamatan: filterKecamatan || wilayahList[0]?.kecamatan || 'Aesesa',
      desaKelurahan: filterDesa || wilayahList[0]?.desaKelurahan || 'Danga',
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: SaranaSanitasi) => {
    setEditingItem(item);
    setFormData({
      namaPemilik: item.namaPemilik,
      nik: item.nik || '',
      noHp: item.noHp || '',
      jumlahPengguna: item.jumlahPengguna,
      alamatLengkap: item.alamatLengkap,
      kecamatan: item.kecamatan,
      desaKelurahan: item.desaKelurahan,
      dusun: item.dusun,
      jenisSarana: item.jenisSarana,
      memilikiSepticTank: item.memilikiSepticTank,
      latitude: item.latitude,
      longitude: item.longitude,
      kondisi: item.kondisi,
      status: item.status,
      fotoUrl: item.fotoUrl || '',
      sumberDana: item.sumberDana || 'DAK Sanitasi',
      tahunPembangunan: item.tahunPembangunan || new Date().getFullYear(),
      keteranganKerusakan: item.keteranganKerusakan || '',
      tanggalSurvey: item.tanggalSurvey || new Date().toISOString().split('T')[0],
      surveyor: item.surveyor || 'Petugas TFL Cipta Karya',
    });
    setIsFormModalOpen(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
      },
      (err) => {
        setIsLocating(false);
        alert(`Gagal mengambil koordinat: ${err.message}. Pastikan izin lokasi diaktifkan.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, fotoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaPemilik.trim() || !formData.kecamatan.trim() || !formData.desaKelurahan.trim()) {
      alert('Nama pemilik/penerima, Kecamatan, dan Desa wajib diisi!');
      return;
    }

    if (editingItem) {
      onUpdateSarana({
        ...editingItem,
        ...formData,
      });
    } else {
      onAddSarana(formData);
    }
    setIsFormModalOpen(false);
  };

  const handleExportCSV = () => {
    const rows = filteredSarana.map((s) => ({
      ID: s.id,
      'Nama Pemilik': s.namaPemilik,
      NIK: s.nik || '',
      'No HP': s.noHp || '',
      'Jumlah Pengguna (Jiwa)': s.jumlahPengguna,
      'Alamat Lengkap': s.alamatLengkap,
      Kecamatan: s.kecamatan,
      'Desa / Kelurahan': s.desaKelurahan,
      Dusun: s.dusun,
      'Jenis Sarana': s.jenisSarana,
      'Memiliki Septic Tank': s.memilikiSepticTank ? 'Ya' : 'Tidak',
      Latitude: s.latitude,
      Longitude: s.longitude,
      Kondisi: s.kondisi,
      Status: s.status,
      'Sumber Dana': s.sumberDana || '',
      'Tahun Pembangunan': s.tahunPembangunan || '',
      'Keterangan Kerusakan': s.keteranganKerusakan || '',
      'Tanggal Survey': s.tanggalSurvey,
      Surveyor: s.surveyor || '',
      'Foto URL': s.fotoUrl || '',
    }));
    exportToCSV(`Data_Sarana_Sanitasi_CK_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Data Sarana Sanitasi & Penerima Bantuan</h2>
              <p className="text-xs text-slate-500">
                Pencatatan jenis sarana (Septic Tank, Jamban), koordinat GPS, kondisi fisik, dan status keberfungsian
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-slate-600">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Input Data Sarana
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama penerima, NIK, alamat lengkap, atau nomor HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              value={filterKecamatan}
              onChange={(e) => {
                setFilterKecamatan(e.target.value);
                setFilterDesa('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Kecamatan</option>
              {uniqueKecamatan.map((k) => (
                <option key={k} value={k}>
                  Kec. {k}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-44">
            <select
              value={filterDesa}
              onChange={(e) => setFilterDesa(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Desa</option>
              {uniqueDesa.map((d) => (
                <option key={d} value={d}>
                  Desa {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium">Filter Detail:</span>

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
          >
            <option value="">Semua Jenis Sarana</option>
            {JENIS_SARANA_OPTIONS.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <select
            value={filterKondisi}
            onChange={(e) => setFilterKondisi(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
          >
            <option value="">Semua Kondisi</option>
            <option value="Baik">Baik</option>
            <option value="Rusak Ringan">Rusak Ringan</option>
            <option value="Rusak Berat">Rusak Berat</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
          >
            <option value="">Semua Status</option>
            <option value="Berfungsi">Berfungsi</option>
            <option value="Tidak Berfungsi">Tidak Berfungsi</option>
          </select>

          <select
            value={filterSeptic}
            onChange={(e) => setFilterSeptic(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
          >
            <option value="">Septic Tank (Semua)</option>
            <option value="ya">Memiliki Septic Tank</option>
            <option value="tidak">Belum Memiliki</option>
          </select>

          {(filterKecamatan || filterDesa || filterJenis || filterKondisi || filterStatus || filterSeptic || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterKecamatan('');
                setFilterDesa('');
                setFilterJenis('');
                setFilterKondisi('');
                setFilterStatus('');
                setFilterSeptic('');
              }}
              className="text-slate-500 hover:text-slate-700 underline text-xs ml-auto"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Cards */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">No</th>
                  <th className="py-3 px-3">Nama Pemilik / NIK</th>
                  <th className="py-3 px-3">Alamat & Wilayah</th>
                  <th className="py-3 px-3">Jenis Sarana</th>
                  <th className="py-3 px-3 text-center">Septic Tank</th>
                  <th className="py-3 px-3">Kondisi & Status</th>
                  <th className="py-3 px-3">Koordinat GPS</th>
                  <th className="py-3 px-3 text-center">Foto</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSarana.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-semibold text-slate-700 text-xs">Belum ada data sarana sanitasi</p>
                        <p className="text-[11px] text-slate-400">Silakan input data penerima bantuan atau tarik dari Google Spreadsheet.</p>
                        <button
                          onClick={handleOpenAdd}
                          className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Input Sarana Baru
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSarana.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 text-xs">{item.namaPemilik}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.nik ? `NIK: ${item.nik}` : `${item.jumlahPengguna} Jiwa`}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-slate-800 font-medium">{item.desaKelurahan}, Kec. {item.kecamatan}</div>
                        <div className="text-[11px] text-slate-500 max-w-[180px] truncate" title={item.alamatLengkap}>
                          {item.dusun} - {item.alamatLengkap}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{item.jenisSarana}</span>
                        <span className="text-[10px] text-slate-500">{item.sumberDana} ({item.tahunPembangunan || '-'})</span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.memilikiSepticTank ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3" /> Ada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            <ShieldAlert className="w-3 h-3" /> Belum
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              item.kondisi === 'Baik'
                                ? 'bg-emerald-500'
                                : item.kondisi === 'Rusak Ringan'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-800">{item.kondisi}</span>
                        </div>
                        <span className={`text-[11px] ${item.status === 'Berfungsi' ? 'text-emerald-700' : 'text-rose-700 font-medium'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] font-mono text-slate-600">
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                        >
                          <Navigation className="w-3 h-3" /> Peta
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {item.fotoUrl ? (
                          <button
                            onClick={() => {
                              if (onOpenDetailModal) onOpenDetailModal(item);
                              else setDetailSarana(item);
                            }}
                            className="relative group w-9 h-9 rounded-md overflow-hidden border border-slate-200 inline-block"
                          >
                            <img src={item.fotoUrl} alt={item.namaPemilik} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              if (onOpenDetailModal) onOpenDetailModal(item);
                              else setDetailSarana(item);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus data sarana penerima ${item.namaPemilik}?`)) {
                                onDeleteSarana(item.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View (Mobile / Tablet Friendly) */
        filteredSarana.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
            <div className="max-w-xs mx-auto space-y-2">
              <Layers className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700 text-xs">Belum ada data sarana sanitasi</p>
              <p className="text-[11px] text-slate-400">Silakan input data penerima bantuan atau tarik dari Google Spreadsheet.</p>
              <button
                onClick={handleOpenAdd}
                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Input Sarana Baru
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSarana.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="relative h-40 bg-slate-100 overflow-hidden">
                  {item.fotoUrl ? (
                    <img src={item.fotoUrl} alt={item.namaPemilik} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                      <Camera className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-xs">Foto belum tersedia</span>
                    </div>
                  )}

                  {/* Badges on top of photo */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs shadow-xs">
                      {item.jenisSarana}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        item.kondisi === 'Baik'
                          ? 'bg-emerald-600 text-white'
                          : item.kondisi === 'Rusak Ringan'
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {item.kondisi}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-2.5">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.namaPemilik}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.dusun}, Desa {item.desaKelurahan}, Kec. {item.kecamatan}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Status:</span>
                      <span className={`font-semibold ${item.status === 'Berfungsi' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Septic Tank:</span>
                      <span className="font-semibold text-slate-800">
                        {item.memilikiSepticTank ? '✅ Memiliki' : '❌ Belum Ada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Pengguna:</span>
                      <span className="font-medium text-slate-800">{item.jumlahPengguna} Jiwa</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Sumber Dana:</span>
                      <span className="font-medium text-slate-800 truncate block">{item.sumberDana || 'CK'}</span>
                    </div>
                  </div>

                  {item.keteranganKerusakan && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                      <span className="font-semibold">Kerusakan: </span>
                      {item.keteranganKerusakan}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
                <a
                  href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" /> Peta GPS
                </a>

                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      if (onOpenDetailModal) onOpenDetailModal(item);
                      else setDetailSarana(item);
                    }}
                    className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
                    title="Detail"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data ${item.namaPemilik}?`)) onDeleteSarana(item.id);
                    }}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      )}

      {/* DETAIL MODAL (Photo 2: Detail masing-masing sarana) */}
      {(detailSarana || selectedSaranaForModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          {(() => {
            const current = detailSarana || selectedSaranaForModal!;
            return (
              <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      Detail Sarana Sanitasi CK
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">{current.namaPemilik}</h3>
                    <p className="text-xs text-slate-500">
                      {current.dusun}, Desa {current.desaKelurahan}, Kec. {current.kecamatan}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDetailSarana(null);
                      if (onCloseDetailModal) onCloseDetailModal();
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Photo Preview */}
                {current.fotoUrl && (
                  <div className="w-full h-56 rounded-xl overflow-hidden mb-4 bg-slate-100 shadow-inner">
                    <img src={current.fotoUrl} alt={current.namaPemilik} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Detail Information Grid based on Photo 2 specs */}
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Nama Pemilik / Penerima</span>
                      <span className="font-bold text-slate-900 text-sm">{current.namaPemilik}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">NIK</span>
                      <span className="font-semibold text-slate-800">{current.nik || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jumlah Pengguna</span>
                      <span className="font-semibold text-slate-800">{current.jumlahPengguna} Jiwa</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">No Telepon / WA</span>
                      <span className="font-semibold text-slate-800">{current.noHp || '-'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[11px]">Alamat Lengkap</span>
                      <span className="font-semibold text-slate-800">
                        {current.alamatLengkap} ({current.dusun})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Jenis Sarana</span>
                      <span className="font-bold text-blue-700">{current.jenisSarana}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Memiliki Septic Tank</span>
                      <span className="font-semibold text-slate-800">
                        {current.memilikiSepticTank ? '✅ Ya, Memiliki Septic Tank' : '❌ Belum Memiliki Septic Tank'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Kondisi Sarana</span>
                      <span className={`font-bold inline-flex items-center gap-1 ${
                        current.kondisi === 'Baik'
                          ? 'text-emerald-700'
                          : current.kondisi === 'Rusak Ringan'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}>
                        {current.kondisi}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Status Keberfungsian</span>
                      <span className={`font-bold ${current.status === 'Berfungsi' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {current.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Sumber Dana & Tahun</span>
                      <span className="font-semibold text-slate-800">
                        {current.sumberDana || 'CK'} (Tahun {current.tahunPembangunan || '-'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Tanggal Survey & Petugas</span>
                      <span className="font-semibold text-slate-800">
                        {current.tanggalSurvey} ({current.surveyor || 'Petugas CK'})
                      </span>
                    </div>
                  </div>

                  {current.keteranganKerusakan && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-800">
                      <span className="font-bold block mb-1">Catatan Kerusakan & Analisa Fisik:</span>
                      <p>{current.keteranganKerusakan}</p>
                    </div>
                  )}

                  {/* GPS & Navigation Bar */}
                  <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Titik Koordinat GPS:</span>
                      <span className="font-mono font-bold text-slate-800">
                        Lat: {current.latitude}, Long: {current.longitude}
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${current.latitude},${current.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs transition"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Buka di Google Maps
                    </a>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setDetailSarana(null);
                      if (onCloseDetailModal) onCloseDetailModal();
                      handleOpenEdit(current);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Data
                  </button>
                  <button
                    onClick={() => {
                      setDetailSarana(null);
                      if (onCloseDetailModal) onCloseDetailModal();
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* FORM INPUT / EDIT MODAL (Photo 2 Specs) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Formulir Survey Sanitasi CK
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {editingItem ? 'Edit Data Sarana Sanitasi' : 'Input Data Sarana Sanitasi Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Section 1: Data Penerima */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  1. Data Pemilik / Penerima
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pemilik / Penerima <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap kepala keluarga"
                      value={formData.namaPemilik}
                      onChange={(e) => setFormData({ ...formData, namaPemilik: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NIK (Nomor Induk Kependudukan)</label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="16 digit NIK KTP"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jumlah Pengguna (Jiwa)</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.jumlahPengguna}
                      onChange={(e) => setFormData({ ...formData, jumlahPengguna: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">No HP / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="0812xxxx"
                      value={formData.noHp}
                      onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Identitas Lokasi */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  2. Lokasi & Wilayah Administrasi
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kecamatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Aesesa"
                      value={formData.kecamatan}
                      onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Desa / Kelurahan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Danga"
                      value={formData.desaKelurahan}
                      onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dusun / RT / RW</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dusun I RT 02"
                      value={formData.dusun}
                      onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap</label>
                  <input
                    type="text"
                    placeholder="Nama jalan, nomor rumah, atau patokan lokasi"
                    value={formData.alamatLengkap}
                    onChange={(e) => setFormData({ ...formData, alamatLengkap: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* GPS Coordinates & High-precision capture */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Koordinat GPS (Latitude & Longitude)</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={isLocating}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Crosshair className="w-3.5 h-3.5" />
                      {isLocating ? 'Mendeteksi Satelit...' : '📍 Ambil Koordinat GPS HP'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude (cth: -8.5724)"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude (cth: 121.2891)"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                      className="px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Detail Sarana Sanitasi */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  3. Spesifikasi Sarana & Kerusakan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Sarana Sanitasi</label>
                    <select
                      value={formData.jenisSarana}
                      onChange={(e) => {
                        const jenis = e.target.value as JenisSarana;
                        setFormData({
                          ...formData,
                          jenisSarana: jenis,
                          memilikiSepticTank: jenis.includes('Septic'),
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {JENIS_SARANA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Keberadaan Septic Tank</label>
                    <div className="flex gap-2 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="septic"
                          checked={formData.memilikiSepticTank}
                          onChange={() => setFormData({ ...formData, memilikiSepticTank: true })}
                        />
                        <span className="font-semibold text-emerald-700">Memiliki Septic Tank</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer ml-3">
                        <input
                          type="radio"
                          name="septic"
                          checked={!formData.memilikiSepticTank}
                          onChange={() => setFormData({ ...formData, memilikiSepticTank: false })}
                        />
                        <span className="font-semibold text-rose-700">Belum Memiliki</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kondisi Fisik Sarana</label>
                    <select
                      value={formData.kondisi}
                      onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as KondisiSarana })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Baik">Baik (Berfungsi Normal)</option>
                      <option value="Rusak Ringan">Rusak Ringan (Pintu/Kran retak, tangki utuh)</option>
                      <option value="Rusak Berat">Rusak Berat (Bocor/Ambles/Tersumbat parah)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status Keberfungsian</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusKeberfungsian })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Berfungsi">Berfungsi (Dapat Digunakan)</option>
                      <option value="Tidak Berfungsi">Tidak Berfungsi (Macet/Ditinggalkan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Kerusakan / Kendala Lapangan
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Tangki septik penuh, pipa buangan retak, kloset retak, atau tidak ada saluran resapan"
                    value={formData.keteranganKerusakan}
                    onChange={(e) => setFormData({ ...formData, keteranganKerusakan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Section 4: Foto & Survey */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
                  4. Dokumentasi Foto & Surveyor
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Upload Foto / Ambil Kamera</label>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {formData.fotoUrl && (
                      <div className="mt-2 w-28 h-20 rounded-md overflow-hidden border border-slate-200 relative group">
                        <img src={formData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoUrl: '' })}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Link URL Foto (Opsional)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.fotoUrl.startsWith('data:') ? '' : formData.fotoUrl}
                      onChange={(e) => setFormData({ ...formData, fotoUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sumber Dana Program</label>
                    <input
                      type="text"
                      placeholder="DAK Sanitasi, APBD, Swadaya, dll."
                      value={formData.sumberDana}
                      onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Petugas Survey / TFL</label>
                    <input
                      type="text"
                      placeholder="Nama surveyor lapangan"
                      value={formData.surveyor}
                      onChange={(e) => setFormData({ ...formData, surveyor: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  {editingItem ? 'Simpan Perubahan Sarana' : 'Simpan Data Sarana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
