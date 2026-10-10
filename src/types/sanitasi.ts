export type JenisSarana =
  | 'Septic Tank Konvensional'
  | 'Septic Tank Biofilter'
  | 'Jamban Tanpa Septic Tank'
  | 'Jamban Komunal'
  | 'MCK Umum'
  | 'Cubluk';

export type KondisiSarana = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export type StatusKeberfungsian = 'Berfungsi' | 'Tidak Berfungsi';

export interface IdentitasWilayah {
  id: string;
  kecamatan: string;
  desaKelurahan: string;
  dusun: string; // Alamat lengkap
  jumlahRumah: number;
  jumlahKK: number;
  catatanWilayah?: string;
  updatedAt: string;
}

export interface SaranaSanitasi {
  id: string;
  namaPemilik: string;
  nik?: string;
  noHp?: string;
  jumlahPengguna: number; // Jumlah jiwa
  alamatLengkap: string;
  kecamatan: string;
  desaKelurahan: string;
  dusun: string;
  jenisSarana: JenisSarana;
  memilikiSepticTank: boolean;
  latitude: number;
  longitude: number;
  kondisi: KondisiSarana;
  status: StatusKeberfungsian;
  fotoUrl?: string;
  sumberDana?: string; // DAK Sanitasi, APBD, Swadaya, dll
  tahunPembangunan?: number;
  keteranganKerusakan?: string;
  tanggalSurvey: string;
  surveyor?: string;
}

export interface DashboardStats {
  totalRumah: number;
  totalKK: number;
  totalSarana: number;
  berfungsi: number;
  rusak: number;
  kondisiBaik: number;
  rusakRingan: number;
  rusakBerat: number;
  memilikiSepticTank: number;
  belumMemilikiSepticTank: number;
}

export interface GoogleSheetConfig {
  sheetUrl: string;
  appsScriptUrl: string;
  lastSyncedAt?: string;
  autoSync: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  errorMessage?: string;
}
