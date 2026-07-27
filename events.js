/**
 * events.js — Kalender Event / Race PBJ dari Google Sheets (section #events)
 *
 * CARA KERJA:
 * - Data event disimpan di satu Google Sheet (EVENTS_SHEET_ID di config.js)
 *   yang dibagikan "Anyone with the link: Viewer".
 * - Website membacanya lewat endpoint gviz milik Google (tanpa API key).
 * - "CRUD" dilakukan admin langsung di Google Sheets dengan 1 akun Google:
 *   tambah/edit/hapus baris → website otomatis ikut berubah.
 *
 * Kolom sheet (baris pertama = judul kolom, urutan bebas):
 *   Nama | Tanggal | Lokasi | Kategori | Deskripsi | LinkInfo | LinkMedia | Status
 *   - LinkInfo  : URL pendaftaran / poster / info (opsional)
 *   - LinkMedia : URL folder foto & video event (opsional)
 *   - Status    : "upcoming" (akan datang) atau "selesai"
 *
 * Selama EVENTS_SHEET_ID kosong atau fetch gagal, section menampilkan
 * kartu placeholder ajakan pantau Instagram — tidak pernah tampak rusak.
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('eventsGrid')
  if (!grid) return

  const isConfigured = typeof EVENTS_SHEET_ID !== 'undefined' && EVENTS_SHEET_ID
  if (!isConfigured) {
    renderEventsFallback(grid)
    return
  }

  fetchEvents()
    .then(events => {
      if (events.length > 0) {
        renderEvents(grid, events)
      } else {
        renderEventsFallback(grid)
      }
    })
    .catch(error => {
      console.warn('Data event tidak dapat dimuat:', error)
      renderEventsFallback(grid)
    })
})

/* ================================================================
   PENGAMBILAN & PARSING DATA SHEET (endpoint gviz)
   ================================================================ */
async function fetchEvents() {
  const url = `https://docs.google.com/spreadsheets/d/${EVENTS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1`
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

  // Header dinormalisasi (huruf kecil, TANPA spasi) supaya 'Link Info',
  // 'LinkInfo', maupun 'linkinfo' semuanya dikenali
  const cols = (payload.table.cols || []).map(col => (col.label || '').toLowerCase().replace(/\s+/g, ''))
  const rows = payload.table.rows || []

  return rows
    .map(row => rowToEvent(row, cols))
    .filter(event => event.nama) // baris tanpa nama dianggap kosong
}

/** Ubah satu baris sheet menjadi objek event, dipetakan lewat judul kolom. */
function rowToEvent(row, cols) {
  const valueOf = (label) => {
    const index = cols.indexOf(label)
    if (index === -1 || !row.c || !row.c[index]) return ''
    const cell = row.c[index]
    // .f = nilai terformat (mis. tanggal), .v = nilai mentah
    return String(cell.f ?? cell.v ?? '').trim()
  }

  return {
    nama: valueOf('nama'),
    tanggal: valueOf('tanggal'),
    lokasi: valueOf('lokasi'),
    kategori: valueOf('kategori'),
    deskripsi: valueOf('deskripsi'),
    linkInfo: valueOf('linkinfo'),
    linkMedia: valueOf('linkmedia'),
    status: valueOf('status').toLowerCase()
  }
}

/* ================================================================
   RENDERER
   ================================================================ */
function renderEvents(grid, events) {
  grid.innerHTML = events.map(event => {
    const isDone = event.status === 'selesai'

    const statusBadge = isDone
      ? '<span class="event-card__status event-card__status--done">Selesai</span>'
      : '<span class="event-card__status">Akan Datang</span>'

    const infoBtn = event.linkInfo && isSafeHttpUrl(event.linkInfo)
      ? `<a class="btn btn--primary event-card__btn" href="${escapeAttr(event.linkInfo)}" target="_blank" rel="noopener">
           <i class="fa-solid fa-circle-info"></i> Info & Daftar</a>`
      : ''
    const mediaBtn = event.linkMedia && isSafeHttpUrl(event.linkMedia)
      ? `<a class="btn btn--ghost event-card__btn" href="${escapeAttr(event.linkMedia)}" target="_blank" rel="noopener">
           <i class="fa-solid fa-photo-film"></i> Foto & Video</a>`
      : ''

    return `
      <article class="event-card${isDone ? ' event-card--done' : ''}">
        <div class="event-card__top">
          ${event.kategori ? `<span class="event-card__kategori">${escapeHtml(event.kategori)}</span>` : ''}
          ${statusBadge}
        </div>
        <h3 class="event-card__title">${escapeHtml(event.nama)}</h3>
        <ul class="event-card__meta">
          ${event.tanggal ? `<li><i class="fa-solid fa-calendar-days"></i> ${escapeHtml(event.tanggal)}</li>` : ''}
          ${event.lokasi ? `<li><i class="fa-solid fa-location-dot"></i> ${escapeHtml(event.lokasi)}</li>` : ''}
        </ul>
        ${event.deskripsi ? `<p class="event-card__desc">${escapeHtml(event.deskripsi)}</p>` : ''}
        ${(infoBtn || mediaBtn) ? `<div class="event-card__actions">${infoBtn}${mediaBtn}</div>` : ''}
      </article>`
  }).join('')
}

/** Placeholder saat sheet belum dikonfigurasi / kosong / gagal dimuat. */
function renderEventsFallback(grid) {
  grid.innerHTML = `
    <div class="events-fallback">
      <i class="fa-solid fa-flag-checkered events-fallback__icon" aria-hidden="true"></i>
      <p class="events-fallback__title">Kalender event akan segera hadir.</p>
      <p class="events-fallback__text">
        Pantau pengumuman event & race terbaru di Instagram
        <a href="https://www.instagram.com/pushbikejakarta/" target="_blank" rel="noopener">@pushbikejakarta</a>
        atau grup WhatsApp komunitas.
      </p>
    </div>`
}

/* escapeHtml/escapeAttr/isSafeHttpUrl dipakai dari config.js (helper bersama) */
