/**
 * site-settings.js — Pengaturan Situs dari Google Sheets (toggle + link form)
 *
 * Dipakai di index.html DAN daftar-member-baru.html (keduanya load file ini
 * setelah config.js). Baca satu sheet Key/Value (SETTINGS_SHEET_ID) berisi:
 *   - REGISTRATION_OPEN     : TRUE/FALSE — buka/tutup pendaftaran member baru
 *   - REGISTRATION_FORM_URL : link publik Google Form (viewform) — kalau form
 *                             diganti/dibuat ulang, admin cukup edit sel ini,
 *                             TIDAK perlu redeploy
 *
 * TIGA tanggung jawab, masing-masing no-op aman kalau elemen terkait tidak
 * ada di halaman (jadi file yang sama aman dipakai di kedua halaman):
 * 1. SELALU jalan (tidak bergantung sheet): hitung & tampilkan label tanggal
 *    "kapan dibuka lagi" di FAQ dari tanggal SEKARANG (getNextRegistrationOpeningLabel
 *    di config.js) — supaya teks FAQ tidak pernah basi/butuh redeploy semester.
 * 2. SELALU jalan: isi iframe Google Form (#regEmbedIframe, kalau ada di
 *    halaman) dengan REGISTRATION_FORM_URL — dari sheet kalau tersedia,
 *    fallback ke konstanta REGISTRATION_FORM_URL di config.js kalau sheet
 *    belum diisi / fetch gagal.
 * 3. Kalau REGISTRATION_OPEN di sheet bernilai TRUE: ubah tombol CTA
 *    "Daftar Sekarang" + link footer + FAQ jadi versi "sedang dibuka".
 *
 * Fail-safe: selama SETTINGS_SHEET_ID kosong / fetch gagal / value bukan TRUE,
 * situs tetap tampil default "tutup" apa adanya di HTML — tidak pernah tampak
 * rusak (filosofi yang sama dengan events.js).
 */

document.addEventListener('DOMContentLoaded', () => {
  applyDynamicFaqDates()

  const fallbackFormUrl = typeof REGISTRATION_FORM_URL !== 'undefined' ? REGISTRATION_FORM_URL : ''
  const isConfigured = typeof SETTINGS_SHEET_ID !== 'undefined' && SETTINGS_SHEET_ID

  if (!isConfigured) {
    applyFormEmbed(fallbackFormUrl)
    return
  }

  fetchSiteSettings()
    .then(settings => {
      const isOpen = (settings.REGISTRATION_OPEN || '').toUpperCase() === 'TRUE'
      const formUrl = settings.REGISTRATION_FORM_URL || fallbackFormUrl
      if (isOpen) applyRegistrationOpenState()
      applyFormEmbed(formUrl)
    })
    .catch(error => {
      console.warn('Pengaturan situs tidak dapat dimuat:', error)
      applyFormEmbed(fallbackFormUrl)
    })
})

/* ================================================================
   TANGGAL DINAMIS DI FAQ (selalu jalan, tidak bergantung sheet)
   ================================================================ */
function applyDynamicFaqDates() {
  const nextOpening = getNextRegistrationOpeningLabel()
  const activePeriod = getActiveRegistrationPeriodLabel()

  const caraDaftarDate = document.getElementById('faqCaraDaftarDate')
  if (caraDaftarDate) caraDaftarDate.textContent = nextOpening

  const openMemberDate = document.getElementById('faqOpenMemberDate')
  if (openMemberDate) openMemberDate.textContent = nextOpening

  const openMemberPeriod = document.getElementById('faqOpenMemberPeriod')
  if (openMemberPeriod) openMemberPeriod.textContent = activePeriod
}

/* ================================================================
   EMBED GOOGLE FORM (selalu jalan, no-op kalau iframe tidak ada di halaman)
   ================================================================ */
function applyFormEmbed(formUrl) {
  const iframe = document.getElementById('regEmbedIframe')
  if (!iframe || !formUrl) return

  const fallbackLink = document.getElementById('regEmbedFallbackLink')
  const loading = document.getElementById('regEmbedLoading')

  iframe.src = `${formUrl}?embedded=true`
  if (fallbackLink) fallbackLink.href = formUrl
  iframe.addEventListener('load', () => {
    if (loading) loading.hidden = true
  })
}

/* ================================================================
   PENGAMBILAN PENGATURAN (endpoint gviz, pola sama events.js)
   Return: object { KEY: 'value', ... } — semua baris sheet, key di-uppercase.
   ================================================================ */
async function fetchSiteSettings() {
  const url = `https://docs.google.com/spreadsheets/d/${SETTINGS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1`
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

  const cols = (payload.table.cols || []).map(col => (col.label || '').toLowerCase().replace(/\s+/g, ''))
  const rows = payload.table.rows || []

  const valueOf = (row, label) => {
    const index = cols.indexOf(label)
    if (index === -1 || !row.c || !row.c[index]) return ''
    const cell = row.c[index]
    return String(cell.f ?? cell.v ?? '').trim()
  }

  const settings = {}
  rows.forEach(row => {
    const key = valueOf(row, 'key').toUpperCase()
    if (key) settings[key] = valueOf(row, 'value')
  })
  return settings
}

/* ================================================================
   PENERAPAN STATE "SEDANG DIBUKA" — tombol CTA + FAQ
   ================================================================ */
function applyRegistrationOpenState() {
  document.querySelectorAll('.nav-link--cta, .mobile-nav-link--cta').forEach(link => {
    link.textContent = 'Daftar Member Baru'
    link.href = 'daftar-member-baru.html'
  })

  const footerLink = document.getElementById('footerRegisterLink')
  if (footerLink) {
    footerLink.textContent = 'Daftar Member Baru'
    footerLink.href = 'daftar-member-baru.html'
  }

  // Konten kedua state ("tutup" & "dibuka") sudah ada di markup index.html —
  // di sini cukup pasang/lepas atribut "hidden", TIDAK membangun HTML dari
  // string (lebih aman & lebih mudah diaudit daripada innerHTML dinamis).
  const closedBlock = document.querySelector('#faq-open-member [data-faq-state="closed"]')
  const openBlock = document.querySelector('#faq-open-member [data-faq-state="open"]')
  if (closedBlock) closedBlock.hidden = true
  if (openBlock) openBlock.hidden = false
}

/* fetchWithTimeout dipakai dari config.js (helper bersama) */
