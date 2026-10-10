import React, { useState } from 'react';
import { IdentitasWilayah, SaranaSanitasi } from '../types/sanitasi';
import { Printer, Download, Filter, FileText, CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { exportToCSV } from '../services/googleSheets';

interface LaporanViewProps {
  wilayahList: IdentitasWilayah[];
  saranaList: SaranaSanitasi[];
}

export default function LaporanView({ wilayahList, saranaList }: LaporanViewProps) {
  const [filterKecamatan, setFilterKecamatan] = useState('');

  const uniqueKecamatan = Array.from(new Set([...wilayahList.map((w) => w.kecamatan), ...saranaList.map((s) => s.kecamatan)])).filter(Boolean);

  // Group by Kecamatan and Desa
  const groupedData: Record<
    string,
    {
      kecamatan: string;
      desa: string;
      totalRumah: number;
      totalKK: number;
      totalSarana: number;
      berfungsi: number;
      rusakRingan: number;
      rusakBerat: number;
      memilikiSepticTank: number;
      belumMemilikiSepticTank: number;
    }
  > = {};

  // Initialize from wilayah
  wilayahList.forEach((w) => {
    const key = `${w.kecamatan}__${w.desaKelurahan}`;
    if (!groupedData[key]) {
      groupedData[key] = {
        kecamatan: w.kecamatan,
        desa: w.desaKelurahan,
        totalRumah: 0,
        totalKK: 0,
        totalSarana: 0,
        berfungsi: 0,
        rusakRingan: 0,
        rusakBerat: 0,
        memilikiSepticTank: 0,
        belumMemilikiSepticTank: 0,
      };
    }
    groupedData[key].totalRumah += Number(w.jumlahRumah) || 0;
    groupedData[key].totalKK += Number(w.jumlahKK) || 0;
  });

  // Aggregate sarana
  saranaList.forEach((s) => {
    const key = `${s.kecamatan}__${s.desaKelurahan}`;
    if (!groupedData[key]) {
      groupedData[key] = {
        kecamatan: s.kecamatan,
        desa: s.desaKelurahan,
        totalRumah: 0,
        totalKK: 0,
        totalSarana: 0,
        berfungsi: 0,
        rusakRingan: 0,
        rusakBerat: 0,
        memilikiSepticTank: 0,
        belumMemilikiSepticTank: 0,
      };
    }
    groupedData[key].totalSarana += 1;
    if (s.status === 'Berfungsi') groupedData[key].berfungsi += 1;
    if (s.kondisi === 'Rusak Ringan') groupedData[key].rusakRingan += 1;
    if (s.kondisi === 'Rusak Berat' || s.status === 'Tidak Berfungsi') groupedData[key].rusakBerat += 1;
    if (s.memilikiSepticTank) groupedData[key].memilikiSepticTank += 1;
    else groupedData[key].belumMemilikiSepticTank += 1;
  });

  const reportRows = Object.values(groupedData).filter((item) => {
    if (filterKecamatan && item.kecamatan.toLowerCase() !== filterKecamatan.toLowerCase()) return false;
    return true;
  });

  // Grand totals
  const totalRumahAll = reportRows.reduce((a, b) => a + b.totalRumah, 0);
  const totalKKAll = reportRows.reduce((a, b) => a + b.totalKK, 0);
  const totalSaranaAll = reportRows.reduce((a, b) => a + b.totalSarana, 0);
  const berfungsiAll = reportRows.reduce((a, b) => a + b.berfungsi, 0);
  const rusakRinganAll = reportRows.reduce((a, b) => a + b.rusakRingan, 0);
  const rusakBeratAll = reportRows.reduce((a, b) => a + b.rusakBerat, 0);
  const septicAll = reportRows.reduce((a, b) => a + b.memilikiSepticTank, 0);
  const belumSepticAll = reportRows.reduce((a, b) => a + b.belumMemilikiSepticTank, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const rows = reportRows.map((r, i) => ({
      No: i + 1,
      Kecamatan: r.kecamatan,
      'Desa / Kelurahan': r.desa,
      'Total Rumah': r.totalRumah,
      'Total KK': r.totalKK,
      'Total Sarana Terdata': r.totalSarana,
      'Sarana Berfungsi': r.berfungsi,
      'Rusak Ringan': r.rusakRingan,
      'Rusak Berat': r.rusakBerat,
      'Memiliki Septic Tank': r.memilikiSepticTank,
      'Belum Memiliki Septic Tank': r.belumMemilikiSepticTank,
      'Persentase Akses Layak (%)': r.totalSarana > 0 ? Math.round((r.memilikiSepticTank / r.totalSarana) * 100) : 0,
    }));
    exportToCSV(`Rekapitulasi_Sanitasi_CiptaKarya_${new Date().toISOString().split('T')[0]}`, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Laporan Rekapitulasi Data Sanitasi Bidang CK</h2>
              <p className="text-xs text-slate-500">
                Format Berita Acara & Rekapitulasi Tingkat Kecamatan dan Desa / Kelurahan
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-48">
            <select
              value={filterKecamatan}
              onChange={(e) => setFilterKecamatan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Kecamatan</option>
              {uniqueKecamatan.map((k) => (
                <option key={k} value={k}>
                  Kec. {k}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Official Letterhead / Kop Laporan */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
          <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900">
            PEMERINTAH KABUPATEN NAGEKEO
          </h2>
          <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-800">
            DINAS PEKERJAAN UMUM DAN PENATAAN RUANG (PUPR)
          </h3>
          <h4 className="text-xs sm:text-sm font-semibold uppercase text-blue-800">
            BIDANG CIPTA KARYA - SEKSI PENYEHATAN LINGKUNGAN PERMUKIMAN (PLP)
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Laporan Rekapitulasi Data Sarana Sanitasi, Penerima Bantuan, dan Analisis Kondisi Fisik
          </p>
          <div className="mt-2 text-xs font-medium text-slate-600">
            Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Table Rekapitulasi */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                <th className="p-2 border border-slate-300 w-10">No</th>
                <th className="p-2 border border-slate-300 text-left">Kecamatan</th>
                <th className="p-2 border border-slate-300 text-left">Desa / Kelurahan</th>
                <th className="p-2 border border-slate-300">Total Rumah</th>
                <th className="p-2 border border-slate-300">Total KK</th>
                <th className="p-2 border border-slate-300">Total Sarana</th>
                <th className="p-2 border border-slate-300 text-emerald-800">Berfungsi</th>
                <th className="p-2 border border-slate-300 text-amber-800">Rusak Ringan</th>
                <th className="p-2 border border-slate-300 text-rose-800">Rusak Berat</th>
                <th className="p-2 border border-slate-300 text-blue-800">Memiliki Septic Tank</th>
                <th className="p-2 border border-slate-300 text-rose-800">Belum Memiliki Septic Tank</th>
                <th className="p-2 border border-slate-300">% Layak</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r, i) => {
                const pct = r.totalSarana > 0 ? Math.round((r.memilikiSepticTank / r.totalSarana) * 100) : 0;
                return (
                  <tr key={`${r.kecamatan}-${r.desa}`} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-300 text-center text-slate-500">{i + 1}</td>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">{r.kecamatan}</td>
                    <td className="p-2 border border-slate-300 font-medium text-slate-800">{r.desa}</td>
                    <td className="p-2 border border-slate-300 text-right">{r.totalRumah}</td>
                    <td className="p-2 border border-slate-300 text-right">{r.totalKK}</td>
                    <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">{r.totalSarana}</td>
                    <td className="p-2 border border-slate-300 text-right text-emerald-700 font-semibold">{r.berfungsi}</td>
                    <td className="p-2 border border-slate-300 text-right text-amber-700">{r.rusakRingan}</td>
                    <td className="p-2 border border-slate-300 text-right text-rose-700 font-semibold">{r.rusakBerat}</td>
                    <td className="p-2 border border-slate-300 text-right text-blue-700 font-semibold">{r.memilikiSepticTank}</td>
                    <td className="p-2 border border-slate-300 text-right text-amber-800">{r.belumMemilikiSepticTank}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${pct >= 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 text-slate-900 font-extrabold border-t-2 border-slate-400">
                <td colSpan={3} className="p-2.5 border border-slate-300 text-center uppercase">
                  Jumlah Total
                </td>
                <td className="p-2.5 border border-slate-300 text-right">{totalRumahAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right">{totalKKAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right">{totalSaranaAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right text-emerald-800">{berfungsiAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right text-amber-800">{rusakRinganAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right text-rose-800">{rusakBeratAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right text-blue-800">{septicAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-right text-amber-900">{belumSepticAll.toLocaleString('id-ID')}</td>
                <td className="p-2.5 border border-slate-300 text-center">
                  {totalSaranaAll > 0 ? `${Math.round((septicAll / totalSaranaAll) * 100)}%` : '0%'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Area for Berita Acara */}
        <div className="mt-12 pt-4 grid grid-cols-2 text-xs text-center text-slate-800">
          <div>
            <p className="text-slate-500 mb-16">Mengetahui,<br /><b>Kepala Bidang Cipta Karya</b></p>
            <p className="font-bold underline text-slate-900">( .................................................... )</p>
            <p className="text-[11px] text-slate-500">NIP. ........................................</p>
          </div>
          <div>
            <p className="text-slate-500 mb-16">Petugas Verifikasi Lapangan / TFL Sanitasi,<br /><b>Koordinator Sanitasi Lingkungan</b></p>
            <p className="font-bold underline text-slate-900">( .................................................... )</p>
            <p className="text-[11px] text-slate-500">NIP / ID Fasilitator: .....................</p>
          </div>
        </div>
      </div>
    </div>
  );
}
