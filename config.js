/**
 * config.js — Pusat Konfigurasi Integrasi Eksternal PBJ
 *
 * SEMUA pengaturan integrasi (Google Drive, Google Sheets) dikumpulkan
 * di file ini supaya admin cukup mengedit SATU tempat.
 * Website tetap berfungsi normal (mode fallback) selama nilai-nilai
 * di bawah masih kosong.
 *
 * ================================================================
 * PANDUAN SETUP (sekali saja, oleh 1 akun Google milik PBJ)
 * ================================================================
 *
 * A. GALERI DARI GOOGLE DRIVE
 *    1. Buat folder induk di Google Drive, misal "Galeri PBJ".
 *    2. Di dalamnya buat subfolder per kategori:
 *       "Latihan", "Lomba", "Prestasi" (bebas menambah kategori baru —
 *       nama subfolder otomatis menjadi tombol filter di website).
 *    3. Klik kanan folder induk → Share → "Anyone with the link: Viewer".
 *    4. Salin ID folder dari URL-nya:
 *       https://drive.google.com/drive/folders/<INI_ID_FOLDERNYA>
 *       → tempel ke DRIVE_GALLERY_FOLDER_ID.
 *    5. Buat API key gratis di https://console.cloud.google.com :
 *       buat project → "APIs & Services" → aktifkan "Google Drive API"
 *       → Credentials → Create credentials → API key.
 *       (Saran: restrict key ke Drive API + HTTP referrer domain web.)
 *       → tempel ke DRIVE_API_KEY.
 *    Setelah itu: upload foto/video ke subfolder = langsung tampil di web.
 *
 * B. EVENT / RACE DARI GOOGLE SHEETS
 *    1. Buat Google Sheet baru, baris pertama sebagai judul kolom:
 *       Nama | Tanggal | Lokasi | Kategori | Deskripsi | LinkInfo | LinkMedia | Status
 *       - Tanggal   : teks bebas, mis. "Minggu, 12 Juli 2026"
 *       - Kategori  : mis. "Race", "Fun Race", "Latber Akbar"
 *       - LinkInfo  : URL pendaftaran / poster / info event (opsional)
 *       - LinkMedia : URL folder foto & video event (opsional)
 *       - Status    : "upcoming" atau "selesai"
 *    2. File → Share → "Anyone with the link: Viewer".
 *    3. Salin ID sheet dari URL-nya:
 *       https://docs.google.com/spreadsheets/d/<INI_ID_SHEETNYA>/edit
 *       → tempel ke EVENTS_SHEET_ID.
 *    Setelah itu: tambah/edit/hapus baris di sheet = web ikut berubah.
 *    (Itulah "CRUD"-nya — lewat Google Sheets, tanpa server.)
 */

/* ---------------- GOOGLE DRIVE (Galeri) ---------------- */
const DRIVE_API_KEY = ''
const DRIVE_GALLERY_FOLDER_ID = ''

/* ---------------- GOOGLE SHEETS (Event) ---------------- */
const EVENTS_SHEET_ID = ''

/* ---------------- INSTAGRAM (feed Behold) ----------------
   Isi dengan URL feed JSON dari behold.so milik akun @pushbikejakarta
   (panduan di docs/PANDUAN-ADMIN.md, bagian Lampiran).
   SEMENTARA (TESTING): memakai file sample lokal berisi feed percobaan.
   Ganti dengan 'https://feeds.behold.so/...' saat siap production,
   atau kosongkan ('') untuk menampilkan kartu ajakan follow. */
const INSTAGRAM_FEED_URL = 'instagram-feed-sample.json'

/* ================================================================
   HELPER BERSAMA (dipakai instagram.js, events.js, gdrive-gallery.js)
   ================================================================ */

/* Batas tunggu request eksternal, supaya section tidak menggantung
   kosong saat koneksi ke Google/Behold macet */
const FETCH_TIMEOUT_MS = 8000

/**
 * fetchWithTimeout(url)
 * fetch dengan batas waktu; setelah lewat, promise ditolak sehingga
 * pemanggil bisa menampilkan fallback (bukan section kosong selamanya).
 */
function fetchWithTimeout(url) {
  const options = {}
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    options.signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
  }
  return fetch(url, options)
}

/**
 * escapeHtml(value) / escapeAttr(value)
 * Amankan teks dari sumber eksternal (Drive, Sheets, feed Instagram)
 * sebelum disisipkan ke HTML, mencegah XSS.
 */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

/* ---------------- LINK ADMIN (dipakai admin.html) ----------------
   Link cepat menuju "dashboard" pengelolaan. Terisi otomatis dari ID
   di atas; tidak perlu diubah manual. */
function adminDriveUrl() {
  return DRIVE_GALLERY_FOLDER_ID
    ? `https://drive.google.com/drive/folders/${DRIVE_GALLERY_FOLDER_ID}`
    : ''
}
function adminSheetUrl() {
  return EVENTS_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${EVENTS_SHEET_ID}/edit`
    : ''
}
