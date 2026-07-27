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
 *       "Latihan", "Race", "Prestasi" (bebas menambah kategori baru —
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

/* ---------------- WHATSAPP ADMIN ----------------
   SATU-SATUNYA tempat nomor WA admin/sekretaris PBJ ditulis di seluruh
   proyek. Format: kode negara + nomor TANPA angka 0 di depan
   (contoh: 628123456789, bukan 08123456789).

   Nomor ini dipakai main.js untuk mengisi otomatis:
     - Tombol WhatsApp di footer (ikon sosial & baris kontak)
     - Link WhatsApp yang terisi otomatis dari form pendaftaran
     - Setiap teks yang menampilkan nomor ini di FAQ (elemen
       <span data-wa-number> di index.html) dan di dalam JSON-LD FAQPage
       (placeholder teks __ADMIN_WA_NUMBER__ di index.html)

   GANTI NOMOR? Cukup ubah nilai di baris ini SAJA (mis. kalau nomor WA
   admin berganti tiap tahun) — main.js otomatis menyebarkannya ke semua
   link & teks di atas saat halaman dimuat. TIDAK PERLU cari-ganti manual
   di index.html. */
const ADMIN_WA_NUMBER = '6285691530710'

/* ---------------- GOOGLE DRIVE (Galeri) ---------------- */
const DRIVE_API_KEY = 'AIzaSyBtHNF8yJw7cMN6rjKslp6-Wvj_QXJGz5E'
const DRIVE_GALLERY_FOLDER_ID = '1FRvqquhu045ksHXsN1wFHLrb0R1QU6xR'

/* ---------------- GOOGLE SHEETS (Event & Race) ---------------- */
const EVENTS_SHEET_ID = '140ah0IgNFHR05216BuHFrVH90OWEX-_mK5S6S9H0ql8'

/* ---------------- GOOGLE SHEETS (Galeri per Latihan) ----------------
   Dibaca oleh gallery-sessions.js untuk mode tampilan "Per Latihan" di
   section Galeri — BEDA dari galeri Kategori (baca folder Google Drive
   PBJ sendiri). Kolom sheet (baris pertama = judul kolom):
     Tanggal | Sesi | Fotografer | LinkDrive
   - Tanggal     : format YYYY-MM-DD (mis. "2026-07-14"), ditampilkan
                   apa adanya sebagai teks di kartu.
   - Sesi        : nama sesi bebas, mis. "Latihan Pagi" atau "Race Day".
   - Fotografer  : nama fotografer/pemilik folder foto, jadi label tombol.
   - LinkDrive   : URL folder Google Drive milik fotografer tsb (folder
                   ITU SENDIRI yang dibagikan publik oleh fotografer,
                   BUKAN folder Drive PBJ) — wajib diawali https://
   SATU BARIS per LINK. Kalau satu sesi punya 3 fotografer, isi 3 baris
   dengan Tanggal+Sesi yang SAMA — website otomatis mengelompokkannya
   jadi satu kartu berisi 3 tombol. Kenapa lewat Sheet, bukan Drive API
   seperti galeri Kategori? Karena foto tiap sesi tersebar di folder
   Drive milik fotografer yang berbeda-beda (di luar Drive PBJ), jadi
   tidak bisa dipindai otomatis lewat query "'{id}' in parents". */
const GALLERY_SESSIONS_SHEET_ID = '1LOVfycAscUlDoIo9OUABnhhRYBYQr1_M_kjux6oESn8'

/* ---------------- INSTAGRAM (feed Behold) ----------------
   Isi dengan URL feed JSON dari behold.so milik akun @pushbikejakarta
   (panduan di docs/PANDUAN-ADMIN.md, bagian Lampiran).
   SEMENTARA (TESTING): memakai file sample lokal berisi feed percobaan.
   Ganti dengan 'https://feeds.behold.so/...' saat siap production,
   atau kosongkan ('') untuk menampilkan kartu ajakan follow. */
const INSTAGRAM_FEED_URL = 'data/instagram-feed-sample.json'

/* ================================================================
   HELPER BERSAMA
   (dipakai instagram.js, events.js, gdrive-gallery.js, gallery-sessions.js)
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

/**
 * isSafeHttpUrl(url)
 * Hanya izinkan URL yang benar-benar diawali http:// atau https://.
 * Dipakai untuk SEMUA link yang datang dari data eksternal (baris Google
 * Sheets, deskripsi file Drive, dll.) sebelum ditaruh sebagai href —
 * mencegah skema berbahaya seperti "javascript:..." ikut tersisip kalau
 * ada yang iseng (atau salah ketik) mengisi kolom link di Sheet.
 * (Sebelumnya bernama isSafeEventUrl dan hanya hidup di events.js;
 * sekarang di sini supaya bisa dipakai bersama events.js & gallery-sessions.js.)
 */
function isSafeHttpUrl(url) {
  return /^https?:\/\//i.test(url)
}

/**
 * normalizeHttpUrl(raw)
 * Mengubah URL "polos" dari admin menjadi URL http(s) yang aman, ATAU ''
 * kalau tidak valid. Latar belakang: admin non-teknis sering menempel link
 * TANPA "https://" (mis. "bit.ly/xxx" atau "www.instagram.com/..") — kalau
 * langsung dipakai, isSafeHttpUrl menolaknya dan tombol/link malah hilang.
 * Aturan:
 *   - sudah diawali http:// atau https://        → dipakai apa adanya
 *   - skema berbahaya (javascript:, data:, dst.)  → DITOLAK ('')
 *   - tanpa skema tapi seperti domain ("bit.ly/x")→ ditambah "https://"
 *   - selain itu (teks biasa tanpa domain)        → DITOLAK ('')
 * Dengan begini kolom link di Google Sheet boleh diisi tanpa https:// dan
 * tetap aman dari skema berbahaya.
 */
function normalizeHttpUrl(raw) {
  const value = String(raw ?? '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  // Skema yang tidak boleh jadi href tombol → tolak
  if (/^(javascript|data|vbscript|file|mailto|tel|blob):/i.test(value)) return ''
  // Tanpa skema tapi seperti domain (ada "titik-domain") → anggap https
  if (/^[\w-]+(\.[\w-]+)+([/:?#]|$)/.test(value)) return 'https://' + value
  return ''
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
