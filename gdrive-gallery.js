/**
 * gdrive-gallery.js — Galeri dari Google Drive (section #galeri)
 *
 * CARA KERJA:
 * - Sumber foto/video adalah SATU folder induk Google Drive
 *   (DRIVE_GALLERY_FOLDER_ID di config.js). Subfolder = kategori.
 * - Dua mode tampilan (tombol toggle di atas filter):
 *   1. "Kategori" : semua media digabung, difilter per kategori
 *                   (tombol filter dibangun otomatis dari nama subfolder).
 *   2. "Folder"   : menampilkan kartu folder; klik folder → isi foldernya.
 * - Selama DRIVE_API_KEY / DRIVE_GALLERY_FOLDER_ID kosong (atau fetch
 *   gagal), galeri lokal bawaan (renderGallery di schedule.js) tetap
 *   dipakai dan toggle disembunyikan — web tidak pernah tampak rusak.
 *
 * Bergantung pada: config.js (konstanta), schedule.js (fallback),
 * main.js (lightbox — item Drive memakai data-type "foto"/"drive-video").
 */

/* Jumlah maksimal file yang diambil per folder */
const DRIVE_PAGE_SIZE = 100

/* State galeri Drive (satu objek supaya mudah dilacak) */
const driveGalleryState = {
  folders: [],          // [{ id, name }]
  filesByFolder: {},    // { folderId: [file, ...] }
  viewMode: 'kategori', // 'kategori' | 'folder'
  activeFilter: 'all',  // filter kategori aktif
  openFolderId: null    // folder yang sedang dibuka pada mode folder
}

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('galleryGrid')
  if (!grid) return

  const isConfigured =
    typeof DRIVE_API_KEY !== 'undefined' && DRIVE_API_KEY &&
    typeof DRIVE_GALLERY_FOLDER_ID !== 'undefined' && DRIVE_GALLERY_FOLDER_ID

  if (!isConfigured) return // Fallback: galeri lokal dari schedule.js

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

  buildDriveViewToggle()
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

/** Tampilkan tombol toggle "Kategori | Folder" (tersembunyi by default). */
function buildDriveViewToggle() {
  const toggle = document.getElementById('galleryViewToggle')
  if (!toggle) return
  toggle.hidden = false

  toggle.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toggle.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('view-toggle-btn--active'))
      btn.classList.add('view-toggle-btn--active')
      driveGalleryState.viewMode = btn.dataset.view
      driveGalleryState.openFolderId = null
      // Filter kategori hanya relevan di mode kategori
      const filterBar = document.querySelector('#galeri .filter-bar')
      if (filterBar) filterBar.style.display = driveGalleryState.viewMode === 'kategori' ? '' : 'none'
      renderDriveGallery()
    })
  })
}

/**
 * Bangun ulang tombol filter dari nama subfolder Drive.
 * Mengganti tombol filter statis (Latihan/Lomba/Prestasi) sehingga
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
function renderDriveGallery() {
  const grid = document.getElementById('galleryGrid')
  if (!grid) return

  if (driveGalleryState.viewMode === 'folder') {
    if (driveGalleryState.openFolderId) {
      renderDriveFolderContents(grid, driveGalleryState.openFolderId)
    } else {
      renderDriveFolderList(grid)
    }
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

/** Mode Folder: daftar kartu folder yang terdaftar di Drive. */
function renderDriveFolderList(grid) {
  const cards = driveGalleryState.folders.map(folder => {
    const count = driveGalleryState.filesByFolder[folder.id].length
    return `
      <button class="drive-folder-card" data-folder="${escapeAttr(folder.id)}">
        <i class="fa-solid fa-folder drive-folder-card__icon"></i>
        <span class="drive-folder-card__name">${escapeHtml(folder.name)}</span>
        <span class="drive-folder-card__count">${count} media</span>
      </button>`
  }).join('')

  grid.innerHTML = cards || driveEmptyHtml('Belum ada folder galeri yang terdaftar.')

  grid.querySelectorAll('.drive-folder-card').forEach(card => {
    card.addEventListener('click', () => {
      driveGalleryState.openFolderId = card.dataset.folder
      renderDriveGallery()
    })
  })
}

/** Mode Folder → isi salah satu folder + tombol kembali. */
function renderDriveFolderContents(grid, folderId) {
  const folder = driveGalleryState.folders.find(f => f.id === folderId)
  if (!folder) {
    driveGalleryState.openFolderId = null
    renderDriveGallery()
    return
  }

  const files = driveGalleryState.filesByFolder[folderId]
  const cards = files.map(file => driveCardHtml(file, folder.name)).join('')

  grid.innerHTML = `
    <div class="drive-folder-header">
      <button class="btn btn--ghost drive-back-btn" id="driveBackBtn">
        <i class="fa-solid fa-arrow-left"></i> Semua Folder
      </button>
      <span class="drive-folder-header__title">
        <i class="fa-solid fa-folder-open"></i> ${escapeHtml(folder.name)}
      </span>
    </div>
    ${cards || driveEmptyHtml('Folder ini masih kosong.')}`

  const backBtn = document.getElementById('driveBackBtn')
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      driveGalleryState.openFolderId = null
      renderDriveGallery()
    })
  }
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
