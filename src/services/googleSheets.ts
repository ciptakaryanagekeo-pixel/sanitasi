import Papa from 'papaparse';
import { IdentitasWilayah, SaranaSanitasi, GoogleSheetConfig, DashboardStats, JenisSarana, KondisiSarana, StatusKeberfungsian } from '../types/sanitasi';
import { INITIAL_WILAYAH, INITIAL_SARANA } from '../data/initialData';

const STORAGE_KEYS = {
  WILAYAH: 'sim_sanitasi_wilayah_clean_v2',
  SARANA: 'sim_sanitasi_sarana_clean_v2',
  CONFIG: 'sim_sanitasi_gsheet_config_v2',
  AUTH: 'sim_sanitasi_auth_session_v2',
};

// Default Google Sheet Config
export const DEFAULT_CONFIG: GoogleSheetConfig = {
  sheetUrl: '',
  appsScriptUrl: '',
  autoSync: false,
  status: 'disconnected',
};

// Check Auth Session
export function getSavedAuth(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  } catch {
    return false;
  }
}

export function saveAuth(isAuthenticated: boolean): void {
  try {
    if (isAuthenticated) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  } catch (e) {
    console.error('Failed to save auth to localStorage', e);
  }
}

// Extract Google Sheet ID from URL
export function extractSheetId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If user pasted raw ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(url.trim())) {
    return url.trim();
  }
  return null;
}

// Get saved data from LocalStorage (empty array if not set)
export function getSavedWilayah(): IdentitasWilayah[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WILAYAH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load wilayah from localStorage', e);
  }
  return INITIAL_WILAYAH;
}

export function saveWilayah(data: IdentitasWilayah[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WILAYAH, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save wilayah to localStorage', e);
  }
}

export function getSavedSarana(): SaranaSanitasi[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SARANA);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load sarana from localStorage', e);
  }
  return INITIAL_SARANA;
}

export function saveSarana(data: SaranaSanitasi[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SARANA, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save sarana to localStorage', e);
  }
}

export function getSavedConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load config from localStorage', e);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

// Calculate Dashboard Stats based on filters
export function calculateStats(
  wilayahList: IdentitasWilayah[],
  saranaList: SaranaSanitasi[],
  selectedKecamatan: string = '',
  selectedDesa: string = ''
): DashboardStats {
  const filteredWilayah = wilayahList.filter((w) => {
    if (selectedKecamatan && w.kecamatan.toLowerCase() !== selectedKecamatan.toLowerCase()) return false;
    if (selectedDesa && w.desaKelurahan.toLowerCase() !== selectedDesa.toLowerCase()) return false;
    return true;
  });

  const filteredSarana = saranaList.filter((s) => {
    if (selectedKecamatan && s.kecamatan.toLowerCase() !== selectedKecamatan.toLowerCase()) return false;
    if (selectedDesa && s.desaKelurahan.toLowerCase() !== selectedDesa.toLowerCase()) return false;
    return true;
  });

  const totalRumah = filteredWilayah.reduce((acc, curr) => acc + (Number(curr.jumlahRumah) || 0), 0);
  const totalKK = filteredWilayah.reduce((acc, curr) => acc + (Number(curr.jumlahKK) || 0), 0);

  const totalSarana = filteredSarana.length;
  const berfungsi = filteredSarana.filter((s) => s.status === 'Berfungsi').length;
  const rusak = filteredSarana.filter((s) => s.kondisi === 'Rusak Ringan' || s.kondisi === 'Rusak Berat' || s.status === 'Tidak Berfungsi').length;
  const kondisiBaik = filteredSarana.filter((s) => s.kondisi === 'Baik').length;
  const rusakRingan = filteredSarana.filter((s) => s.kondisi === 'Rusak Ringan').length;
  const rusakBerat = filteredSarana.filter((s) => s.kondisi === 'Rusak Berat').length;

  const memilikiSepticTank = filteredSarana.filter((s) => s.memilikiSepticTank).length;
  const belumMemilikiSepticTank = filteredSarana.filter((s) => !s.memilikiSepticTank).length;

  return {
    totalRumah,
    totalKK,
    totalSarana,
    berfungsi,
    rusak,
    kondisiBaik,
    rusakRingan,
    rusakBerat,
    memilikiSepticTank,
    belumMemilikiSepticTank,
  };
}

// Fetch data from Public Google Sheets using gviz CSV endpoint
export async function fetchFromGoogleSheet(sheetUrl: string): Promise<{
  wilayah?: IdentitasWilayah[];
  sarana?: SaranaSanitasi[];
  error?: string;
}> {
  const sheetId = extractSheetId(sheetUrl);
  if (!sheetId) {
    return { error: 'Link Google Spreadsheet tidak valid. Pastikan link memiliki format https://docs.google.com/spreadsheets/d/...' };
  }

  try {
    // Try reading sarana first (gid 0 or sheet named 'Sarana')
    const saranaUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Data_Sarana`;
    const fallbackUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

    let res = await fetch(saranaUrl);
    if (!res.ok) {
      res = await fetch(fallbackUrl);
    }

    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari Google Sheet (Status: ${res.status}). Pastikan spreadsheet disetel 'Siapa saja yang memiliki link: Pelihat (Viewer)'.`);
    }

    const csvText = await res.text();
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new Error('Format CSV tidak dapat dibaca atau tabel kosong.');
    }

    const parsedSarana: SaranaSanitasi[] = [];
    parsed.data.forEach((row, idx) => {
      // Find matching keys case-insensitively
      const getVal = (candidates: string[]): string => {
        for (const c of candidates) {
          for (const key of Object.keys(row)) {
            if (key.trim().toLowerCase() === c.toLowerCase()) {
              return (row[key] || '').trim();
            }
          }
        }
        return '';
      };

      const nama = getVal(['nama', 'nama pemilik', 'penerima', 'nama penerima', 'nama_pemilik']);
      if (!nama) return;

      const jenis = (getVal(['jenis sarana', 'jenis', 'jenis_sarana', 'sarana']) || 'Septic Tank Konvensional') as JenisSarana;
      const statusRaw = getVal(['status', 'keberfungsian', 'status_keberfungsian']);
      const kondisiRaw = getVal(['kondisi', 'kondisi sarana']);
      const septicRaw = getVal(['septic tank', 'memiliki septic tank', 'ada septic tank']);

      const lat = parseFloat(getVal(['lat', 'latitude', 'lintang']) || '-8.5724');
      const lng = parseFloat(getVal(['lng', 'long', 'longitude', 'bujur']) || '121.2891');

      parsedSarana.push({
        id: `gsheet-srn-${idx + 1}`,
        namaPemilik: nama,
        nik: getVal(['nik', 'no ktp']),
        noHp: getVal(['no hp', 'telepon', 'nohp', 'no_hp']),
        jumlahPengguna: parseInt(getVal(['jumlah pengguna', 'jiwa', 'pengguna', 'jml jiwa']) || '4', 10),
        alamatLengkap: getVal(['alamat', 'alamat lengkap', 'alamat_lengkap']),
        kecamatan: getVal(['kecamatan']) || 'Aesesa',
        desaKelurahan: getVal(['desa', 'kelurahan', 'desa/kelurahan', 'desa_kelurahan']) || 'Danga',
        dusun: getVal(['dusun']) || 'Dusun I',
        jenisSarana: jenis,
        memilikiSepticTank: septicRaw.toLowerCase().includes('ya') || septicRaw.toLowerCase().includes('ada') || septicRaw.toLowerCase().includes('true') || jenis.toLowerCase().includes('septic'),
        latitude: isNaN(lat) ? -8.5724 : lat,
        longitude: isNaN(lng) ? 121.2891 : lng,
        kondisi: (kondisiRaw.includes('Berat') ? 'Rusak Berat' : kondisiRaw.includes('Ringan') ? 'Rusak Ringan' : 'Baik') as KondisiSarana,
        status: (statusRaw.toLowerCase().includes('tidak') ? 'Tidak Berfungsi' : 'Berfungsi') as StatusKeberfungsian,
        fotoUrl: getVal(['foto', 'foto url', 'link foto', 'foto_url']),
        sumberDana: getVal(['sumber dana', 'dana', 'program', 'sumber_dana']) || 'DAK Sanitasi',
        tahunPembangunan: parseInt(getVal(['tahun', 'tahun pembangunan']) || '2024', 10),
        keteranganKerusakan: getVal(['keterangan', 'kerusakan', 'catatan']),
        tanggalSurvey: getVal(['tanggal', 'tgl survey', 'tanggal survey']) || new Date().toISOString().split('T')[0],
        surveyor: getVal(['surveyor', 'petugas', 'tfl']) || 'Petugas Cipta Karya',
      });
    });

    return { sarana: parsedSarana.length > 0 ? parsedSarana : undefined };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghubungi Google Sheet';
    return { error: message };
  }
}

// Push to Google Apps Script Webhook
export async function syncToGoogleAppsScript(
  appsScriptUrl: string,
  wilayah: IdentitasWilayah[],
  sarana: SaranaSanitasi[]
): Promise<{ success: boolean; message: string }> {
  if (!appsScriptUrl || !appsScriptUrl.startsWith('https://script.google.com/')) {
    return {
      success: false,
      message: 'URL Google Apps Script tidak valid. Masukkan URL Web App (berakhir dengan /exec).',
    };
  }

  try {
    const payload = {
      action: 'syncData',
      wilayah,
      sarana,
      timestamp: new Date().toISOString(),
    };

    // Google Apps Script usually requires text/plain or no-cors / redirection handle
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return {
      success: true,
      message: result.message || 'Data berhasil dikirim dan disinkronkan ke Google Spreadsheet!',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kendala saat mengirim ke Apps Script';
    return {
      success: false,
      message: `${message}. Pastikan Web App disetel 'Who has access: Anyone'.`,
    };
  }
}

// Generate Apps Script Template for user to copy-paste
export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script untuk SIM-SANITASI CK (Cipta Karya)
 * Cara Pakai:
 * 1. Buka Google Sheet Anda
 * 2. Klik menu 'Ekstensi' -> 'Apps Script'
 * 3. Hapus semua kode, paste kode ini ke Editor
 * 4. Klik 'Terapkan' (Deploy) -> 'Penerapan Baru' (New Deployment)
 * 5. Pilih Jenis: 'Aplikasi Web' (Web App)
 * 6. Setel:
 *    - Jalankan sebagai: Saya (Email Anda)
 *    - Yang memiliki akses: Siapa Saja (Anyone)
 * 7. Salin URL Aplikasi Web (/exec) dan paste di aplikasi SIM-SANITASI!
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Simpan / Perbarui Sheet Data_Sarana
    var sheetSarana = ss.getSheetByName('Data_Sarana') || ss.insertSheet('Data_Sarana');
    if (data.sarana && data.sarana.length > 0) {
      sheetSarana.clearContents();
      // Header
      var headers = [
        'ID', 'Nama Pemilik', 'NIK', 'No HP', 'Jumlah Jiwa', 'Alamat Lengkap',
        'Kecamatan', 'Desa/Kelurahan', 'Dusun', 'Jenis Sarana', 'Septic Tank',
        'Latitude', 'Longitude', 'Kondisi', 'Status', 'Foto URL',
        'Sumber Dana', 'Tahun', 'Keterangan Kerusakan', 'Tanggal Survey', 'Surveyor'
      ];
      var rows = [headers];

      data.sarana.forEach(function(s) {
        rows.push([
          s.id || '',
          s.namaPemilik || '',
          s.nik || '',
          s.noHp || '',
          s.jumlahPengguna || 0,
          s.alamatLengkap || '',
          s.kecamatan || '',
          s.desaKelurahan || '',
          s.dusun || '',
          s.jenisSarana || '',
          s.memilikiSepticTank ? 'Ya' : 'Tidak',
          s.latitude || 0,
          s.longitude || 0,
          s.kondisi || '',
          s.status || '',
          s.fotoUrl || '',
          s.sumberDana || '',
          s.tahunPembangunan || '',
          s.keteranganKerusakan || '',
          s.tanggalSurvey || '',
          s.surveyor || ''
        ]);
      });
      sheetSarana.getRange(1, 1, rows.length, headers.length).setValues(rows);
      sheetSarana.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E2E8F0');
    }

    // 2. Simpan Sheet Identitas_Wilayah
    if (data.wilayah && data.wilayah.length > 0) {
      var sheetWilayah = ss.getSheetByName('Identitas_Wilayah') || ss.insertSheet('Identitas_Wilayah');
      sheetWilayah.clearContents();
      var wHeaders = ['ID', 'Kecamatan', 'Desa/Kelurahan', 'Dusun/Alamat', 'Jumlah Rumah', 'Jumlah KK', 'Catatan'];
      var wRows = [wHeaders];
      data.wilayah.forEach(function(w) {
        wRows.push([
          w.id || '',
          w.kecamatan || '',
          w.desaKelurahan || '',
          w.dusun || '',
          w.jumlahRumah || 0,
          w.jumlahKK || 0,
          w.catatanWilayah || ''
        ]);
      });
      sheetWilayah.getRange(1, 1, wRows.length, wHeaders.length).setValues(wRows);
      sheetWilayah.getRange(1, 1, 1, wHeaders.length).setFontWeight('bold').setBackground('#E2E8F0');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Berhasil menyinkronkan data ke Google Sheet (' + (data.sarana ? data.sarana.length : 0) + ' sarana)'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Backend Google Apps Script SIM-SANITASI CK Aktif'
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

// Export functions for CSV download
export function exportToCSV(filename: string, rows: Record<string, unknown>[]): void {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
