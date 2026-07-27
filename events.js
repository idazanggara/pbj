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
 *   - LinkInfo  : URL pendaftaran / poster / info (opsional). Boleh ditulis
 *                 TANPA "https://" (mis. "bit.ly/xxx") — otomatis dilengkapi.
 *   - LinkMedia : URL foto & video event (opsional). Kalau berupa POST
 *                 Instagram (instagram.com/p/… atau /reel/…) → tombol
 *                 "Foto & Video" membuka POPUP berisi foto + caption post itu.
 *                 Kalau berupa folder Google Drive → tombol jadi link keluar.
 *   - Status    : "upcoming" (akan datang) atau "selesai"
 *
 * Selama EVENTS_SHEET_ID kosong atau fetch gagal, section menampilkan
 * kartu placeholder ajakan pantau Instagram — tidak pernah tampak rusak.
 */

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('eventsGrid')
  if (!grid) return

  setupEventModal(grid)

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

    const infoUrl = normalizeHttpUrl(event.linkInfo)
    const infoBtn = infoUrl
      ? `<a class="btn btn--primary event-card__btn" href="${escapeAttr(infoUrl)}" target="_blank" rel="noopener">
           <i class="fa-solid fa-circle-info"></i> Info & Daftar</a>`
      : ''

    // LinkMedia berupa post Instagram → tombol membuka MODAL embed (foto +
    // caption) tanpa keluar situs; kalau bukan (mis. folder Drive) → link keluar.
    const mediaUrl = normalizeHttpUrl(event.linkMedia)
    const isIgPost = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\//i.test(mediaUrl)
    let mediaBtn = ''
    if (mediaUrl && isIgPost) {
      mediaBtn = `<button type="button" class="btn btn--ghost event-card__btn"
           data-ig-post="${escapeAttr(mediaUrl)}"
           data-ig-title="${escapeAttr(event.nama)}"
           data-ig-desc="${escapeAttr(event.deskripsi)}">
           <i class="fa-solid fa-photo-film"></i> Foto & Video</button>`
    } else if (mediaUrl) {
      mediaBtn = `<a class="btn btn--ghost event-card__btn" href="${escapeAttr(mediaUrl)}" target="_blank" rel="noopener">
           <i class="fa-solid fa-photo-film"></i> Foto & Video</a>`
    }

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

/* ================================================================
   MODAL DETAIL EVENT + EMBED INSTAGRAM (lazy-load)
   Kartu event yang LinkMedia-nya berupa post Instagram membuka modal
   ini alih-alih pindah ke IG. Skrip embed.js Instagram HANYA dimuat saat
   modal pertama kali dibuka (lazy) supaya tidak memberatkan halaman.
   ================================================================ */
function setupEventModal(grid) {
  const modal = document.getElementById('eventModal')
  if (!modal) return

  // Klik tombol "Foto & Video" (post IG) di kartu mana pun → buka modal.
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ig-post]')
    if (!btn) return
    openEventModal({
      postUrl: btn.dataset.igPost,
      title: btn.dataset.igTitle || '',
      desc: btn.dataset.igDesc || ''
    })
  })

  // Tutup: klik backdrop / tombol X (punya data-close) atau tekan Escape.
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeEventModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeEventModal()
  })
}

function openEventModal({ postUrl, title, desc }) {
  const modal = document.getElementById('eventModal')
  if (!modal) { window.open(postUrl, '_blank', 'noopener'); return }

  modal.querySelector('.event-modal__title').textContent = title
  const descEl = modal.querySelector('.event-modal__desc')
  descEl.textContent = desc
  descEl.hidden = !desc

  modal.querySelector('.event-modal__ig-link').href = postUrl

  // Blockquote resmi Instagram; embed.js mengubahnya jadi post penuh.
  // postUrl sudah dipastikan URL instagram.com/(p|reel|tv)/ sebelum sampai sini.
  modal.querySelector('.event-modal__embed').innerHTML =
    '<blockquote class="instagram-media" data-instgrm-captioned' +
    ' data-instgrm-permalink="' + escapeAttr(postUrl) + '" data-instgrm-version="14"' +
    ' style="margin:0 auto; max-width:540px; width:100%;"></blockquote>'

  modal.classList.add('is-open')
  modal.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden' // cegah scroll latar
  modal.querySelector('.event-modal__close').focus()

  loadInstagramEmbedScript().then(() => {
    if (window.instgrm && window.instgrm.embeds) window.instgrm.embeds.process()
  })
}

function closeEventModal() {
  const modal = document.getElementById('eventModal')
  if (!modal) return
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
  // Kosongkan embed supaya video/iframe IG berhenti & modal ringan lagi.
  modal.querySelector('.event-modal__embed').innerHTML = ''
}

/**
 * loadInstagramEmbedScript()
 * Memuat https://www.instagram.com/embed.js SEKALI saja, saat dibutuhkan.
 * Selalu resolve (termasuk saat gagal) supaya modal tetap tampil dengan
 * link fallback "Buka di Instagram".
 */
function loadInstagramEmbedScript() {
  return new Promise((resolve) => {
    if (window.instgrm && window.instgrm.embeds) return resolve()
    const existing = document.getElementById('ig-embed-js')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => resolve(), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'ig-embed-js'
    script.async = true
    script.src = 'https://www.instagram.com/embed.js'
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.body.appendChild(script)
  })
}

/* escapeHtml/escapeAttr/normalizeHttpUrl dipakai dari config.js (helper bersama) */
