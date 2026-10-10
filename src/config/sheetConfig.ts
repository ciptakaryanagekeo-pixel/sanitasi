/**
 * =====================================================================================
 * PENGATURAN LINK GOOGLE SPREADSHEET (BACKEND SERVER SIM-SANITASI CK)
 * =====================================================================================
 *
 * TARUH LINK GOOGLE SPREADSHEET ANDA DI VARIABEL DI BAWAH INI:
 *
 * Contoh format:
 * 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
 *
 * Catatan Penting:
 * 1. Buka Google Sheet Anda.
 * 2. Klik tombol "Bagikan" (Share) di pojok kanan atas.
 * 3. Ubah Akses Umum menjadi: "Siapa saja yang memiliki link: Pelihat (Viewer)".
 * 4. Salin link tersebut dan tempelkan pada TARGET_GOOGLE_SHEET_URL di bawah ini.
 */

export const TARGET_GOOGLE_SHEET_URL = '';

/**
 * (Opsional) URL Web App Google Apps Script jika Anda ingin fitur simpan 2-arah otomatis:
 * Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
 */
export const TARGET_APPS_SCRIPT_URL = '';

/**
 * Opsi otomatis menarik data saat aplikasi pertama kali dibuka (true / false)
 */
export const AUTO_SYNC_ON_STARTUP = true;
