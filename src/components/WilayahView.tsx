import React, { useState } from 'react';
import { IdentitasWilayah } from '../types/sanitasi';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Building2,
  Home,
  Users,
  MapPin,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { exportToCSV } from '../services/googleSheets';

interface WilayahViewProps {
  wilayahList: IdentitasWilayah[];
  onAddWilayah: (data: Omit<IdentitasWilayah, 'id' | 'updatedAt'>) => void;
  onUpdateWilayah: (wilayah: IdentitasWilayah) => void;
  onDeleteWilayah: (id: string) => void;
}

export default function WilayahView({
  wilayahList,
  onAddWilayah,
  onUpdateWilayah,
  onDeleteWilayah,
}: WilayahViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKecamatan, setFilterKecamatan] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IdentitasWilayah | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    kecamatan: '',
    desaKelurahan: '',
    dusun: '',
    jumlahRumah: 0,
    jumlahKK: 0,
    catatanWilayah: '',
  });

  const uniqueKecamatan = Array.from(new Set(wilayahList.map((w) => w.kecamatan))).filter(Boolean);

  // Filtered List
  const filteredWilayah = wilayahList.filter((item) => {
    if (filterKecamatan && item.kecamatan.toLowerCase() !== filterKecamatan.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchKec = item.kecamatan.toLowerCase().includes(q);
      const matchDesa = item.desaKelurahan.toLowerCase().includes(q);
      const matchDusun = item.dusun.toLowerCase().includes(q);
      return matchKec || matchDesa || matchDusun;
    }
    return true;
  });

  // Calculate totals
  const totalRumah = filteredWilayah.reduce((acc, curr) => acc + (Number(curr.jumlahRumah) || 0), 0);
  const totalKK = filteredWilayah.reduce((acc, curr) => acc + (Number(curr.jumlahKK) || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      kecamatan: '',
      desaKelurahan: '',
      dusun: '',
      jumlahRumah: 0,
      jumlahKK: 0,
      catatanWilayah: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: IdentitasWilayah) => {
    setEditingItem(item);
    setFormData({
      kecamatan: item.kecamatan,
      desaKelurahan: item.desaKelurahan,
      dusun: item.dusun,
      jumlahRumah: item.jumlahRumah,
      jumlahKK: item.jumlahKK,
      catatanWilayah: item.catatanWilayah || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kecamatan.trim() || !formData.desaKelurahan.trim() || !formData.dusun.trim()) {
      alert('Kecamatan, Desa/Kelurahan, dan Dusun wajib diisi!');
      return;
    }

    if (editingItem) {
      onUpdateWilayah({
        ...editingItem,
        ...formData,
        jumlahRumah: Number(formData.jumlahRumah) || 0,
        jumlahKK: Number(formData.jumlahKK) || 0,
        updatedAt: new Date().toISOString().split('T')[0],
      });
    } else {
      onAddWilayah({
        ...formData,
        jumlahRumah: Number(formData.jumlahRumah) || 0,
        jumlahKK: Number(formData.jumlahKK) || 0,
      });
    }
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const rows = filteredWilayah.map((w) => ({
      ID: w.id,
      Kecamatan: w.kecamatan,
      'Desa / Kelurahan': w.desaKelurahan,
      'Dusun (Alamat Lengkap)': w.dusun,
      'Jumlah Rumah': w.jumlahRumah,
      'Jumlah KK': w.jumlahKK,
      Catatan: w.catatanWilayah || '',
      'Terakhir Diperbarui': w.updatedAt,
    }));
    exportToCSV(`Identitas_Wilayah_Sanitasi_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Identitas Wilayah Administrasi</h2>
              <p className="text-xs text-slate-500">
                Pencatatan data wilayah kerja: Kecamatan, Desa/Kelurahan, Dusun, Jumlah Rumah, & Jumlah KK
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Tambah Wilayah
          </button>
        </div>
      </div>

      {/* Summary KPI Counters for Wilayah */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Titik Wilayah</span>
            <span className="text-xl font-bold text-slate-800">{filteredWilayah.length} Wilayah / Dusun</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Jumlah Rumah</span>
            <span className="text-xl font-bold text-slate-800">{totalRumah.toLocaleString('id-ID')} Rumah</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Total Jumlah KK</span>
            <span className="text-xl font-bold text-slate-800">{totalKK.toLocaleString('id-ID')} KK</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kecamatan, desa, atau nama dusun..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={filterKecamatan}
            onChange={(e) => setFilterKecamatan(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kecamatan</option>
            {uniqueKecamatan.map((k) => (
              <option key={k} value={k}>
                Kecamatan {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Kecamatan</th>
                <th className="py-3 px-4">Desa / Kelurahan</th>
                <th className="py-3 px-4">Dusun (Alamat Lengkap)</th>
                <th className="py-3 px-4 text-right">Jumlah Rumah</th>
                <th className="py-3 px-4 text-right">Jumlah KK</th>
                <th className="py-3 px-4">Catatan Wilayah</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWilayah.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="font-semibold text-slate-700 text-xs">Belum ada data identitas wilayah</p>
                      <p className="text-[11px] text-slate-400">Silakan input kecamatan dan desa pertama Anda untuk memulai pendataan.</p>
                      <button
                        onClick={handleOpenAdd}
                        className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Input Wilayah Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWilayah.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.kecamatan}</td>
                    <td className="py-3 px-4 font-medium text-blue-700">{item.desaKelurahan}</td>
                    <td className="py-3 px-4 text-slate-700">{item.dusun}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {item.jumlahRumah.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {item.jumlahKK.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={item.catatanWilayah}>
                      {item.catatanWilayah || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Wilayah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Yakin ingin menghapus data wilayah ${item.desaKelurahan} - ${item.dusun}?`)) {
                              onDeleteWilayah(item.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Hapus Wilayah"
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

        {/* Mobile View Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredWilayah.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">Tidak ada data wilayah</div>
          ) : (
            filteredWilayah.map((item) => (
              <div key={item.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Kec. {item.kecamatan}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Desa {item.desaKelurahan}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {item.dusun}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-slate-100 text-blue-600 rounded-md"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus wilayah ${item.desaKelurahan}?`)) onDeleteWilayah(item.id);
                      }}
                      className="p-1.5 bg-slate-100 text-rose-600 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Jumlah Rumah:</span>
                    <span className="font-bold text-slate-800">{item.jumlahRumah} Rumah</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Jumlah KK:</span>
                    <span className="font-bold text-slate-800">{item.jumlahKK} KK</span>
                  </div>
                </div>

                {item.catatanWilayah && (
                  <p className="text-xs text-slate-500 italic bg-amber-50/50 p-2 rounded">
                    "{item.catatanWilayah}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add / Edit Wilayah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                {editingItem ? 'Edit Identitas Wilayah' : 'Input Data Wilayah Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aesesa, Boawae, Mauponggo"
                  value={formData.kecamatan}
                  onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Danga, Marapokot, Nataweru"
                  value={formData.desaKelurahan}
                  onChange={(e) => setFormData({ ...formData, desaKelurahan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dusun (Alamat Lengkap) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dusun I RT 02 / RW 01"
                  value={formData.dusun}
                  onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Rumah</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.jumlahRumah || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahRumah: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah KK</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.jumlahKK || ''}
                    onChange={(e) => setFormData({ ...formData, jumlahKK: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Wilayah / Topografi</label>
                <textarea
                  rows={2}
                  placeholder="Karakteristik tanah, kendala sanitasi, dll."
                  value={formData.catatanWilayah}
                  onChange={(e) => setFormData({ ...formData, catatanWilayah: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Data Wilayah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
