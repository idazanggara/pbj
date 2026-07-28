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
   URL feed JSON LIVE dari behold.so untuk akun @pushbikejakarta.
   Behold menarik postingan dari Instagram & memperbarui feed ini otomatis
   sesuai jadwal refresh-nya — jadi postingan baru muncul di website TANPA
   perlu ubah kode / deploy ulang. Endpoint ber-CORS ('*') & di-cache CDN.
   Kalau feed gagal dimuat, instagram.js otomatis fallback ke kartu follow.
   Untuk menonaktifkan sementara, kosongkan (''). Sample lokal lama tetap
   ada di data/instagram-feed-sample.json sebagai referensi (tidak dipakai). */
const INSTAGRAM_FEED_URL = 'https://feeds.behold.so/Mi3fM4qqyz3HTuV4V2R2'

/* ================================================================
   HELPER BERSAMA
   (dipakai instagram.js, events.js, gdrive-gallery.js, gallery-sessions.js)
   ================================================================ */

/* Batas tunggu request eksternal, supaya section tidak menggantung
   kosong saat koneksi ke Google/Behold macet */
const FETCH_TIMEOUT_MS = 8000

// Nama bulan Indonesia → indeks bulan JavaScript (0 = Januari), dipakai parseTanggalId
const BULAN_ID = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
}

/**
 * parseTanggalId(text) → timestamp (ms) atau NaN
 * Kolom "Tanggal" di Sheet (event maupun galeri per latihan) bisa berisi teks ISO
 * ("2026-07-12"), "12/07/2026", ATAU teks Indonesia ("12 Juli 2026" / "Senin, 6 Juli
 * 2026" — muncul otomatis kalau kolom Sheet-nya bertipe Date, Google Sheets memformat
 * ulang jadi teks lokal). Dipakai untuk MENGURUTKAN tanggal secara kronologis — JANGAN
 * bandingkan teks tanggal sebagai string mentah (localeCompare), karena untuk format
 * Indonesia hasilnya salah (mis. "26 Juli" < "6 Juli" secara alfabet padahal 6 lebih
 * awal). Kalau tak dikenali → NaN (pemanggil menaruhnya paling belakang).
 */
function parseTanggalId(text) {
  const s = String(text || '').toLowerCase()
  const id = s.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/)
  if (id && BULAN_ID[id[2]] !== undefined) {
    return new Date(Number(id[3]), BULAN_ID[id[2]], Number(id[1])).getTime()
  }
  const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime()
  const dmy = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime()
  return NaN
}

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
function adminGallerySessionsSheetUrl() {
  return GALLERY_SESSIONS_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${GALLERY_SESSIONS_SHEET_ID}/edit`
    : ''
}
