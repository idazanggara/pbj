/**
 * gdrive-gallery.js — Galeri dari Google Drive (section #galeri)
 *
 * CARA KERJA:
 * - Sumber foto/video mode "Kategori" adalah SATU folder induk Google Drive
 *   (DRIVE_GALLERY_FOLDER_ID di config.js). Subfolder = kategori.
 * - Dua mode tampilan (tombol toggle di atas filter):
 *   1. "Kategori"    : semua media digabung, difilter per kategori
 *                      (tombol filter dibangun otomatis dari nama subfolder Drive).
 *   2. "Per Latihan" : kartu per sesi latihan (Tanggal+Sesi), berisi tombol link
 *                      langsung ke folder Drive tiap fotografer. Sumbernya Google
 *                      SHEET (GALLERY_SESSIONS_SHEET_ID), BUKAN Drive API — logika
 *                      fetch/render-nya ada di gallery-sessions.js (initGallerySessions),
 *                      dipanggil dari sini secara on-demand. Alasan pakai Sheet:
 *                      foto tiap sesi ada di folder Drive milik fotografer yang
 *                      berbeda-beda (bukan folder Drive PBJ), jadi tidak bisa
 *                      dipindai otomatis lewat query "'{id}' in parents" seperti
 *                      mode Kategori.
 * - PENTING: mode "Per Latihan" TIDAK BUTUH DRIVE_API_KEY sama sekali (decoupled).
 *   Toggle tetap muncul selama SALAH SATU sumber (Drive ATAU Sheet sesi) terisi.
 *   Kalau DRIVE_API_KEY/DRIVE_GALLERY_FOLDER_ID kosong (atau fetch gagal), tab
 *   Kategori otomatis kembali ke galeri lokal bawaan (renderGallery di
 *   schedule.js) — web tidak pernah tampak rusak.
 *
 * Bergantung pada: config.js (konstanta + isSafeHttpUrl/escapeAttr/escapeHtml),
 * schedule.js (fallback galeri lokal), gallery-sessions.js (mode Per Latihan),
 * main.js (lightbox — item Drive memakai data-type "foto"/"drive-video").
 */

/* Jumlah maksimal file yang diambil per folder */
const DRIVE_PAGE_SIZE = 100

/**
 * Peta mode tampilan <-> hash URL, dipakai DUA ARAH:
 *   1. pengunjung klik toggle  → hash ditulis ke address bar, jadi URL-nya
 *      tinggal disalin & dibagikan ke grup WhatsApp member.
 *   2. link ber-hash dibuka    → tab yang sesuai otomatis aktif dan halaman
 *      scroll ke section galeri.
 * SATU hash saja per URL (aturan baku URL): '#galeri-perlatihan', BUKAN
 * '#galeri/#perlatihan' — tanda '#' kedua dianggap bagian dari teks hash
 * pertama, bukan anchor baru, jadi bentuk itu tidak akan pernah cocok.
 */
const GALLERY_VIEW_HASH = {
  kategori: 'galeri-kategori',
  sesi: 'galeri-perlatihan'
}

/* Jeda scroll ulang (ms) saat halaman dibuka lewat link ber-hash: isi galeri
   dimuat asinkron (Drive/Sheet), jadi tinggi halaman masih berubah setelah
   scroll pertama. Pola & alasan sama dengan mekanik FAQ di main.js. */
const GALLERY_SCROLL_RETRY_DELAYS = [600, 1800]

/* State galeri Drive (satu objek supaya mudah dilacak) */
const driveGalleryState = {
  folders: [],          // [{ id, name }]
  filesByFolder: {},    // { folderId: [file, ...] }
  viewMode: 'kategori', // 'kategori' | 'sesi'
  activeFilter: 'all',  // filter kategori aktif (khusus mode kategori)
  driveReady: false     // true setelah folder & file Drive berhasil diambil
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('galleryGrid')
  if (!grid) return

  const isDriveConfigured =
    typeof DRIVE_API_KEY !== 'undefined' && DRIVE_API_KEY &&
    typeof DRIVE_GALLERY_FOLDER_ID !== 'undefined' && DRIVE_GALLERY_FOLDER_ID
  const isSessionsConfigured =
    typeof GALLERY_SESSIONS_SHEET_ID !== 'undefined' && GALLERY_SESSIONS_SHEET_ID

  // Toggle "Kategori | Per Latihan" berguna begitu SALAH SATU sumber aktif — mode
  // "Per Latihan" berdiri sendiri (baca Google Sheet), sama sekali tidak butuh Drive.
  if (isDriveConfigured || isSessionsConfigured) {
    buildDriveViewToggle()

    // Halaman dibuka lewat link share ber-hash → langsung buka tab yang dimaksud.
    // updateHash true = kembalikan hash ke address bar (script di <head> sengaja
    // membuangnya lebih dulu agar browser tidak scroll native), supaya URL yang
    // terlihat pengunjung tetap URL yang bisa dibagikan lagi.
    restoreGalleryViewFromHash(window.__initialHash, { updateHash: true })

    // Hash berubah TANPA reload — mis. pengunjung menempel link '#galeri-perlatihan'
    // ke address bar saat sudah membuka halaman ini, atau klik link internal.
    window.addEventListener('hashchange', () => restoreGalleryViewFromHash(location.hash))
  }

  if (!isDriveConfigured) return // Tab Kategori tetap pakai galeri lokal fallback (schedule.js)

  initDriveGallery().catch(error => {
    console.warn('Galeri Google Drive tidak dapat dimuat:', error)
    // Biarkan galeri lokal (fallback) yang sudah dirender tetap tampil
  })
})

/* ================================================================
   INISIALISASI
   ================================================================ */
async function initDriveGallery() {
  const folders = await driveFetchSubfolders()
  if (folders.length === 0) return

  const filesLists = await Promise.all(folders.map(f => driveFetchFiles(f.id)))

  driveGalleryState.folders = folders
  folders.forEach((folder, index) => {
    driveGalleryState.filesByFolder[folder.id] = filesLists[index]
  })
  driveGalleryState.driveReady = true

  buildDriveFilterBar()
  renderDriveGallery()
}

/* ================================================================
   PENGAMBILAN DATA DARI DRIVE API
   ================================================================ */

/** Daftar subfolder (= kategori) di dalam folder induk. */
async function driveFetchSubfolders() {
  const query = `'${DRIVE_GALLERY_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const data = await driveApi(query, 'files(id,name)')
  return (data.files || []).sort((a, b) => a.name.localeCompare(b.name, 'id'))
}

/** Daftar file foto/video di dalam satu folder. */
async function driveFetchFiles(folderId) {
  const query = `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')`
  const data = await driveApi(query, 'files(id,name,mimeType,description)', 'createdTime desc')
  return data.files || []
}

/**
 * Pemanggil Drive API v3 files.list dengan penanganan error eksplisit.
 * Mengikuti nextPageToken sehingga folder berisi lebih dari
 * DRIVE_PAGE_SIZE file tetap terambil semua (tidak terpotong diam-diam).
 */
async function driveApi(query, fields, orderBy) {
  const allFiles = []
  let pageToken = ''

  do {
    const params = new URLSearchParams({
      q: query,
      fields: `nextPageToken,${fields}`,
      key: DRIVE_API_KEY,
      pageSize: String(DRIVE_PAGE_SIZE)
    })
    if (orderBy) params.set('orderBy', orderBy)
    if (pageToken) params.set('pageToken', pageToken)

    const response = await fetchWithTimeout(`https://www.googleapis.com/drive/v3/files?${params}`)
    if (!response.ok) {
      throw new Error(`Drive API merespons status ${response.status}`)
    }
    const data = await response.json()
    allFiles.push(...(data.files || []))
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return { files: allFiles }
}

/* ================================================================
   PEMBANGUN UI — toggle mode & filter kategori
   ================================================================ */

/** Tampilkan tombol toggle "Kategori | Per Latihan" (tersembunyi by default). */
function buildDriveViewToggle() {
  const toggle = document.getElementById('galleryViewToggle')
  if (!toggle) return
  toggle.hidden = false

  toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    // updateHash: true → address bar ikut berubah begitu tab diklik, jadi URL
    // yang terlihat pengunjung SELALU URL yang benar untuk di-share.
    btn.addEventListener('click', () => applyGalleryView(btn.dataset.view, { updateHash: true }))
  })

  initGalleryCopyLinkButton()
}

/**
 * initGalleryCopyLinkButton()
 * Tombol "Salin link tab ini". Di HP, menyalin URL dari address bar merepotkan,
 * padahal justru dari HP admin membagikan link ke grup WhatsApp member.
 *
 * Link dibangun dari galleryShareUrl() saat DIKLIK (bukan saat dipasang) supaya
 * selalu mengikuti tab yang sedang aktif, termasuk kalau pengunjung berpindah
 * tab beberapa kali lebih dulu.
 */
function initGalleryCopyLinkButton() {
  const copyButton = document.getElementById('galleryCopyLinkBtn')
  if (!copyButton) return

  copyButton.hidden = false
  copyButton.addEventListener('click', () => {
    copyTextToClipboard(galleryShareUrl()).then(() => showCopyFeedback(copyButton))
  })
}

/**
 * galleryShareUrl()
 * URL absolut menuju tab galeri yang sedang aktif — inilah yang disalin tombol
 * di atas. Memakai location.origin + pathname (bukan location.href) supaya hash
 * lama tidak ikut terbawa dua kali.
 */
function galleryShareUrl() {
  const hash = GALLERY_VIEW_HASH[driveGalleryState.viewMode] || GALLERY_VIEW_HASH.kategori
  return `${location.origin}${location.pathname}#${hash}`
}

/**
 * applyGalleryView(view, options)
 * Satu-satunya tempat mode tampilan galeri diubah — dipakai bersama oleh klik
 * toggle DAN oleh pemulihan dari hash URL, supaya kedua jalur tidak pernah
 * berbeda perilaku.
 *
 * @param {'kategori'|'sesi'} view Mode yang ingin diaktifkan.
 * @param {{ updateHash?: boolean }} [options] updateHash true = tulis hash ke
 *        address bar. Dipakai replaceState (bukan pushState) supaya tombol
 *        "back" browser tetap membawa pengunjung ke halaman sebelumnya, bukan
 *        memutar ulang riwayat klik tab.
 */
function applyGalleryView(view, options = {}) {
  const toggle = document.getElementById('galleryViewToggle')
  // View tak dikenal (mis. hash iseng / data-view typo) diabaikan diam-diam
  if (!toggle || !GALLERY_VIEW_HASH[view]) return

  toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.classList.toggle('view-toggle-btn--active', btn.dataset.view === view)
  })

  driveGalleryState.viewMode = view

  // Filter kategori hanya relevan di mode kategori
  const filterBar = document.querySelector('#galeri .filter-bar')
  if (filterBar) filterBar.style.display = view === 'kategori' ? '' : 'none'

  if (options.updateHash) {
    history.replaceState(null, '', `${location.pathname}${location.search}#${GALLERY_VIEW_HASH[view]}`)
  }

  renderDriveGallery()
}

/**
 * galleryViewFromHash(rawHash)
 * Terjemahkan hash URL menjadi nama mode tampilan. Mengembalikan '' kalau hash
 * bukan milik galeri (mis. '#faq-usia' atau hash acak) — pencocokan dilakukan
 * lewat GALLERY_VIEW_HASH, jadi hanya dua nilai yang mungkin diterima.
 */
function galleryViewFromHash(rawHash) {
  const hashId = decodeURIComponent(String(rawHash || '').replace(/^#/, ''))
  const match = Object.entries(GALLERY_VIEW_HASH).find(([, hash]) => hash === hashId)
  return match ? match[0] : ''
}

/**
 * scrollToGallerySection()
 * Bawa pengunjung ke section #galeri. Diulang beberapa kali karena galeri &
 * konten lain dimuat asinkron sehingga posisi section bisa bergeser setelah
 * scroll pertama (offset navbar diurus section[id] { scroll-margin-top } di css/base.css).
 */
function scrollToGallerySection() {
  const section = document.getElementById('galeri')
  if (!section) return

  const scrollToSection = () => section.scrollIntoView({ behavior: 'smooth', block: 'start' })

  scrollToSection()
  GALLERY_SCROLL_RETRY_DELAYS.forEach(delay => setTimeout(scrollToSection, delay))
}

/**
 * restoreGalleryViewFromHash(rawHash, options)
 * Aktifkan tab galeri sesuai hash lalu scroll ke situ. `rawHash` dibaca dari
 * window.__initialHash saat halaman pertama dimuat (hash aslinya sudah dibuang
 * dari address bar oleh script di <head> index.html — lihat komentar di sana),
 * atau dari location.hash saat hash berubah tanpa reload.
 */
function restoreGalleryViewFromHash(rawHash, options = {}) {
  const view = galleryViewFromHash(rawHash)
  if (!view) return // hash bukan milik galeri → biarkan mekanik lain menanganinya

  applyGalleryView(view, options)
  scrollToGallerySection()
}

/**
 * Bangun ulang tombol filter dari nama subfolder Drive.
 * Mengganti tombol filter statis (Latihan/Race/Prestasi) sehingga
 * kategori baru di Drive otomatis muncul tanpa mengubah kode.
 */
function buildDriveFilterBar() {
  const filterBar = document.querySelector('#galeri .filter-bar')
  if (!filterBar) return

  const folderButtons = driveGalleryState.folders.map(folder => `
    <button class="filter-btn" data-filter="${escapeAttr(folder.id)}">
      ${escapeHtml(folder.name)}
    </button>`).join('')

  filterBar.innerHTML = `
    <button class="filter-btn filter-btn--active" data-filter="all">Semua</button>
    ${folderButtons}`

  filterBar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')
      driveGalleryState.activeFilter = btn.dataset.filter
      renderDriveGallery()
    })
  })
}

/* ================================================================
   RENDERER
   ================================================================ */

/**
 * renderDriveGallery()
 * Dispatcher utama: pilih renderer sesuai `driveGalleryState.viewMode`.
 * - 'sesi'     → serahkan ke gallery-sessions.js (baca Google Sheet, tidak
 *               peduli status Drive sama sekali).
 * - 'kategori' → kalau Drive belum/tidak siap (driveReady masih false —
 *               mis. DRIVE_API_KEY kosong, atau fetch gagal), JANGAN render
 *               grid Drive yang kosong; biarkan galeri lokal fallback dari
 *               schedule.js (sudah dirender main.js saat load) tetap tampil.
 */
function renderDriveGallery() {
  const grid = document.getElementById('galleryGrid')
  if (!grid) return

  if (driveGalleryState.viewMode === 'sesi') {
    initGallerySessions(grid)
    return
  }

  if (!driveGalleryState.driveReady) {
    if (typeof renderGallery === 'function') renderGallery('all')
    return
  }

  renderDriveKategoriGrid(grid)
}

/** Mode Kategori: gabungan semua media, difilter per subfolder. */
function renderDriveKategoriGrid(grid) {
  const { folders, filesByFolder, activeFilter } = driveGalleryState

  const items = folders
    .filter(folder => activeFilter === 'all' || folder.id === activeFilter)
    .flatMap(folder => filesByFolder[folder.id].map(file => driveCardHtml(file, folder.name)))

  grid.innerHTML = items.length > 0 ? items.join('') : driveEmptyHtml('Belum ada dokumentasi untuk kategori ini.')
}

/* ================================================================
   KARTU MEDIA — memakai markup & CSS galeri yang sudah ada
   ================================================================ */
function driveCardHtml(file, categoryName) {
  const isVideo = file.mimeType.startsWith('video/')
  // Thumbnail publik Google Drive (tanpa API key, cukup file publik)
  const thumbUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`
  // Lightbox: foto = gambar besar; video = iframe preview Drive (main.js)
  const lightboxSrc = isVideo
    ? file.id
    : `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`
  const caption = file.description || driveFileNameToCaption(file.name)

  return `
    <figure class="gallery-item" data-type="${isVideo ? 'drive-video' : 'foto'}"
            data-src="${escapeAttr(lightboxSrc)}"
            role="button" tabindex="0" aria-label="Lihat ${escapeAttr(caption)}">
      <div class="gallery-media">
        <img src="${thumbUrl}" alt="${escapeAttr(caption)}" loading="lazy" />
        ${isVideo ? '<span class="gallery-play"><i class="fa-solid fa-play"></i></span>' : ''}
        <span class="gallery-tag">${escapeHtml(categoryName)}</span>
      </div>
      <figcaption class="gallery-caption">${escapeHtml(caption)}</figcaption>
    </figure>`
}

/* ================================================================
   UTILITAS
   ================================================================ */

/** "race-jis-01.jpg" → "race jis 01" (caption dari nama file). */
function driveFileNameToCaption(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')      // buang ekstensi
    .replace(/[-_]+/g, ' ')       // strip/underscore → spasi
    .trim()
}

function driveEmptyHtml(message) {
  return `
    <div style="grid-column:1/-1;width:100%;text-align:center;padding:48px;color:var(--clr-text-muted);">
      <i class="fa-solid fa-camera-retro" style="font-size:2rem;margin-bottom:12px;display:block;"></i>
      ${message}
    </div>`
}

/* escapeHtml/escapeAttr dipakai dari config.js (helper bersama) */
