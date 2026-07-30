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
   Nomor ini dipakai main.js & daftar-member-baru.html untuk mengisi
   otomatis:
     - Tombol WhatsApp di footer (ikon sosial & baris kontak)
     - Link WhatsApp yang terisi otomatis dari form pendaftaran
     - Setiap teks yang menampilkan nomor ini di FAQ (elemen
       <span data-wa-number> di index.html) dan di dalam JSON-LD FAQPage
       (placeholder teks __ADMIN_WA_NUMBER__ di index.html)

   SUMBER UTAMA sekarang sel ADMIN_WA_NUMBER di tab "Config" (lihat
   CONFIG_SHEET_GID di bawah) — admin ganti nomor lewat Sheet, TIDAK perlu
   redeploy. Nilai di baris ini HANYA fallback kalau tab Config belum
   diisi / fetch gagal — boleh dibiarkan usang, bukan tempat update rutin.
   Format: kode negara + nomor TANPA angka 0 di depan (contoh:
   628123456789, bukan 08123456789). */
const ADMIN_WA_NUMBER = '6285647357997'

/* ---------------- GOOGLE SHEETS (Config tersembunyi: nomor WA, dll.) ----------------
   Tab KEDUA di spreadsheet yang SAMA dengan SETTINGS_SHEET_ID (bukan
   spreadsheet baru) — sengaja dipisah dari tab "Registration" supaya bisa
   di-hide (klik kanan tab → Sembunyikan sheet) dari kolaborator yang cuma
   perlu toggle buka/tutup pendaftaran. Kolom sheet sama: Key | Value.
   Baris yang didukung saat ini: ADMIN_WA_NUMBER | 628xxxxxxxxxx
   1. Di spreadsheet SETTINGS_SHEET_ID, buat tab baru (klik "+" di kiri
      bawah), beri nama "Config", isi kolom Key | Value seperti di atas.
   2. Klik tab "Config" itu supaya aktif → lihat URL browser, ambil angka
      setelah "#gid=" (mis. .../edit#gid=987654321 → gid-nya 987654321).
   3. Tempel angka itu ke CONFIG_SHEET_GID.
   4. (Opsional) klik kanan tab "Config" → "Sembunyikan sheet" supaya
      tidak tampil ke kolaborator lain yang dibagikan akses edit.
   Selama nilai ini kosong, ADMIN_WA_NUMBER di atas yang dipakai. */
const CONFIG_SHEET_GID = '845332613'

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

/* ---------------- GOOGLE SHEETS (Pengaturan Situs: toggle + link Form) ----------------
   Dibaca oleh site-settings.js. Kolom sheet (baris pertama = judul kolom):
   Key | Value — DUA baris data:
     REGISTRATION_OPEN     | TRUE/FALSE  → buka/tutup pendaftaran member baru,
                                            ubah tombol "Daftar Sekarang" + FAQ
     REGISTRATION_FORM_URL | https://docs.google.com/forms/d/e/xxxxx/viewform
                                          → link publik Form yang di-iframe di
                                            daftar-member-baru.html. Ganti sel
                                            ini kapan pun form diganti/dibuat
                                            ulang — TIDAK butuh redeploy.
   1. Buat Google Sheet baru, isi 2 kolom + 2 baris di atas.
   2. File → Share → "Anyone with the link: Viewer".
   3. Salin ID sheet dari URL-nya (sama seperti EVENTS_SHEET_ID di atas)
      → tempel ke SETTINGS_SHEET_ID.
   Selama nilai ini kosong, situs tetap tampil default "tutup" (fallback aman). */
const SETTINGS_SHEET_ID = '1cm0iEcJnBNxUYto7mpyMz05SfDh_NwjW2KTUka6SO_o'

/* ---------------- GOOGLE FORM (Pendaftaran Member Baru) — FALLBACK ----------------
   Dipakai HANYA kalau baris REGISTRATION_FORM_URL di sheet di atas kosong /
   sheet belum dikonfigurasi / fetch ke sheet gagal (mis. Sheets sedang
   down) — supaya iframe di daftar-member-baru.html tidak pernah kosong.
   Sumber utama tetap sheet Pengaturan Situs (ganti form = edit sel Sheet,
   TANPA redeploy); nilai di sini cukup diselaraskan sesekali sebagai jaring
   pengaman, bukan tempat utama untuk update rutin. */
const REGISTRATION_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeQ7Ktjtp1oMo9ac7IsDKcsDXs0NopXxQmBy9VQGMEJsBzPIQ/viewform'

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
function adminSettingsSheetUrl() {
  return SETTINGS_SHEET_ID
    ? `https://docs.google.com/spreadsheets/d/${SETTINGS_SHEET_ID}/edit`
    : ''
}

/* ---------------- SIKLUS PENDAFTARAN MEMBER BARU ----------------
   Open member PBJ hanya berlangsung DUA KALI setahun: Periode I (Jan–Jun,
   dibuka akhir Desember tahun sebelumnya) dan Periode II (Jul–Des, dibuka
   akhir Juni). Kedua fungsi di bawah MENGHITUNG label dari tanggal SEKARANG
   (bukan hardcode tahun) supaya teks FAQ soal "kapan dibuka lagi" tidak
   pernah basi/butuh redeploy manual tiap semester. */
function getNextRegistrationOpeningLabel(now) {
  const date = now || new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month <= 6 ? `akhir Juni ${year}` : `akhir Desember ${year}`
}
function getActiveRegistrationPeriodLabel(now) {
  const date = now || new Date()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month <= 6 ? `Periode I ${year} (Januari–Juni)` : `Periode II ${year} (Juli–Desember)`
}
