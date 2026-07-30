/**
 * gallery-sessions.js — Galeri "Per Latihan" dari Google Sheets (bagian dari section #galeri)
 *
 * CARA KERJA (cetakan dari events.js — pola sama, sumber Sheet yang beda):
 * - Data disimpan di Google Sheet (GALLERY_SESSIONS_SHEET_ID di config.js), dibagikan
 *   "Anyone with the link: Viewer", dibaca lewat endpoint gviz Google (tanpa API key).
 * - KENAPA BUKAN GOOGLE DRIVE API seperti galeri Kategori (gdrive-gallery.js)? Karena foto
 *   tiap sesi latihan ada di folder Drive milik FOTOGRAFER yang berbeda-beda (bukan folder
 *   Drive PBJ), jadi tidak bisa dipindai otomatis lewat query "'{id}' in parents" seperti
 *   yang dipakai gdrive-gallery.js. Solusinya: admin kurasi manual — tempel link folder
 *   tiap fotografer ke satu baris Sheet, website tinggal menautkannya.
 * - Mode ini TIDAK BUTUH DRIVE_API_KEY SAMA SEKALI (beda dari galeri Kategori) — murni baca
 *   Sheet lalu link LANGSUNG ke folder Drive fotografer (buka tab baru), tanpa pernah
 *   memanggil Drive API.
 *
 * Kolom sheet (baris pertama = judul kolom, urutan bebas):
 *   Tanggal | Sesi | Fotografer | LinkDrive
 *   - Tanggal    : format YYYY-MM-DD (mis. "2026-07-14"), ditampilkan apa adanya sebagai teks.
 *   - Sesi       : nama sesi bebas, mis. "Latihan Pagi" atau "Race Day".
 *   - Fotografer : nama fotografer, jadi label tombol.
 *   - LinkDrive  : URL folder Google Drive milik fotografer itu (wajib diawali https://).
 *   SATU BARIS per LINK. Kalau satu sesi difoto 3 fotografer, isi 3 baris dengan
 *   Tanggal+Sesi yang SAMA — initGallerySessions() otomatis mengelompokkannya jadi SATU
 *   kartu berisi 3 tombol (satu tombol per fotografer).
 *
 * Dipanggil ON-DEMAND oleh gdrive-gallery.js (BUKAN DOMContentLoaded sendiri di sini) saat
 * pengunjung klik toggle "Per Latihan" — supaya Sheet tidak ikut ter-fetch kalau pengunjung
 * tidak pernah membuka tab itu. Selama GALLERY_SESSIONS_SHEET_ID kosong, sheet kosong, atau
 * fetch gagal, tampil kartu fallback ajakan lihat tab Kategori — galeri tidak pernah tampak
 * rusak.
 */

/* Cache sederhana: begitu berhasil diambil sekali, toggle bolak-balik "Kategori" <-> "Per
   Latihan" tidak fetch ulang ke Google Sheets tiap kali (hemat kuota & tidak flicker). */
let gallerySessionsCache = null

/**
 * initGallerySessions(container)
 * Titik masuk tunggal yang dipanggil gdrive-gallery.js. Urus fetch (kalau cache masih
 * kosong), lalu render ke `container`, dengan fallback di setiap jalur gagal.
 */
function initGallerySessions(container) {
  if (gallerySessionsCache) {
    renderGallerySessions(container, gallerySessionsCache)
    return
  }

  const isConfigured = typeof GALLERY_SESSIONS_SHEET_ID !== 'undefined' && GALLERY_SESSIONS_SHEET_ID
  if (!isConfigured) {
    renderGallerySessionsFallback(container)
    return
  }

  fetchGallerySessions()
    .then(rows => {
      const groups = groupSessionRows(rows)
      gallerySessionsCache = groups
      if (groups.length > 0) {
        renderGallerySessions(container, groups)
      } else {
        renderGallerySessionsFallback(container)
      }
    })
    .catch(error => {
      console.warn('Data galeri per latihan tidak dapat dimuat:', error)
      renderGallerySessionsFallback(container)
    })
}

/* ================================================================
   PENGAMBILAN & PARSING DATA SHEET (endpoint gviz — sama seperti events.js)
   ================================================================ */
async function fetchGallerySessions() {
  // &gid= eksplisit — GALLERY_SESSIONS_SHEET_ID sekarang 1 spreadsheet gabungan
  // (4 tab), TANPA gid endpoint gviz bisa salah baca tab lain kalau urutan tab
  // berubah (insiden nyata 2026-07-30, lihat komentar di config.js).
  const gidParam = typeof GALLERY_SESSIONS_SHEET_GID !== 'undefined' && GALLERY_SESSIONS_SHEET_GID
    ? `&gid=${GALLERY_SESSIONS_SHEET_GID}` : ''
  const url = `https://docs.google.com/spreadsheets/d/${GALLERY_SESSIONS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1${gidParam}`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Google Sheets merespons status ${response.status}`)
  }

  // Respons gviz dibungkus "google.visualization.Query.setResponse(...)"
  // sehingga JSON-nya harus diekstrak dulu dari dalam tanda kurung.
  const text = await response.text()
  const start = text.indexOf('(')
  const end = text.lastIndexOf(')')
  if (start === -1 || end === -1) {
    throw new Error('Format respons gviz tidak dikenali')
  }
  const payload = JSON.parse(text.slice(start + 1, end))

  // Header dinormalisasi (huruf kecil, TANPA spasi) supaya 'Link Drive',
  // 'LinkDrive', maupun 'linkdrive' semuanya dikenali
  const cols = (payload.table.cols || []).map(col => (col.label || '').toLowerCase().replace(/\s+/g, ''))
  const rows = payload.table.rows || []

  return rows
    .map(row => rowToSessionLink(row, cols))
    // Baris tanpa tanggal/sesi/link dianggap kosong (mis. baris kosong di akhir sheet)
    .filter(link => link.tanggal && link.sesi && link.linkDrive)
}

/** Ubah satu baris sheet menjadi objek link foto, dipetakan lewat judul kolom. */
function rowToSessionLink(row, cols) {
  const valueOf = (label) => {
    const index = cols.indexOf(label)
    if (index === -1 || !row.c || !row.c[index]) return ''
    const cell = row.c[index]
    // .f = nilai terformat (mis. tanggal), .v = nilai mentah
    return String(cell.f ?? cell.v ?? '').trim()
  }

  return {
    tanggal: valueOf('tanggal'),
    sesi: valueOf('sesi'),
    fotografer: valueOf('fotografer'),
    linkDrive: valueOf('linkdrive')
  }
}

/* ================================================================
   PENGELOMPOKAN — baris dengan Tanggal+Sesi sama digabung jadi SATU kartu
   ================================================================ */

/**
 * groupSessionRows(rows)
 * Kelompokkan baris-baris link (satu baris = satu fotografer) menjadi array kartu sesi
 * (satu kartu = satu sesi, bisa berisi beberapa fotografer). Immutable: tidak mengubah
 * array `rows` asli maupun objek di dalamnya — semua hasil adalah array & objek BARU.
 */
function groupSessionRows(rows) {
  const groupMap = new Map()

  rows.forEach(row => {
    const key = `${row.tanggal}|${row.sesi}`
    const existingGroup = groupMap.get(key)
    const links = existingGroup ? [...existingGroup.links, row] : [row]
    groupMap.set(key, { tanggal: row.tanggal, sesi: row.sesi, links })
  })

  // Urutkan dari tanggal terbaru dulu, paling kiri/atas. Dibaca lewat parseTanggalId
  // (dari config.js, sama dengan events.js) karena teks Tanggal bisa ISO ("2026-07-06")
  // MAUPUN sudah diformat ulang Google Sheets jadi teks Indonesia ("Senin, 6 Juli 2026")
  // kalau kolomnya bertipe Date — membandingkan sebagai string mentah (localeCompare)
  // salah untuk format Indonesia (mis. "26 Juli" < "6 Juli" secara alfabet).
  return Array.from(groupMap.values())
    .sort((a, b) => {
      const ta = parseTanggalId(a.tanggal)
      const tb = parseTanggalId(b.tanggal)
      const ka = isNaN(ta) ? -Infinity : ta
      const kb = isNaN(tb) ? -Infinity : tb
      return kb - ka
    })
}

/* ================================================================
   RENDERER
   ================================================================ */
function renderGallerySessions(container, groups) {
  container.innerHTML = groups.map(group => {
    const buttons = group.links
      // isSafeHttpUrl: buang link yang bukan http/https (mis. salah tempel/typo di Sheet)
      // supaya tidak bikin tombol rusak atau berpotensi berbahaya.
      .filter(link => isSafeHttpUrl(link.linkDrive))
      .map(link => `
        <a class="btn btn--ghost session-card__btn" href="${escapeAttr(link.linkDrive)}" target="_blank" rel="noopener">
          <i class="fa-solid fa-camera-retro"></i> ${escapeHtml(link.fotografer || 'Lihat Foto')}
        </a>`).join('')

    return `
      <article class="session-card">
        <div class="session-card__header">
          <i class="fa-solid fa-calendar-days session-card__icon"></i>
          <div>
            <p class="session-card__tanggal">${escapeHtml(group.tanggal)}</p>
            <p class="session-card__sesi">${escapeHtml(group.sesi)}</p>
          </div>
        </div>
        <div class="session-card__actions">
          ${buttons || '<p class="session-card__empty">Link foto belum tersedia.</p>'}
        </div>
      </article>`
  }).join('')
}

/** Placeholder saat sheet belum dikonfigurasi / kosong / gagal dimuat. */
function renderGallerySessionsFallback(container) {
  container.innerHTML = `
    <div class="events-fallback">
      <i class="fa-solid fa-images events-fallback__icon" aria-hidden="true"></i>
      <p class="events-fallback__title">Dokumentasi per sesi latihan belum tersedia.</p>
      <p class="events-fallback__text">
        Lihat tab <strong>Kategori</strong> untuk foto &amp; video kegiatan PBJ, atau pantau
        Instagram
        <a href="https://www.instagram.com/pushbikejakarta/" target="_blank" rel="noopener">@pushbikejakarta</a>.
      </p>
    </div>`
}

/* escapeHtml/escapeAttr/isSafeHttpUrl/fetchWithTimeout dipakai dari config.js (helper bersama) */
