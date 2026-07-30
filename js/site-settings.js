/**
 * site-settings.js — Pengaturan Situs dari Google Sheets (toggle + link form + WA)
 *
 * Dipakai di index.html DAN register.html (keduanya load file ini
 * setelah config.js, SEBELUM main.js). Baca DUA tab berbeda di spreadsheet
 * yang sama (SETTINGS_SHEET_ID):
 *   - Tab "Registration" (gid=0, default): Key/Value berisi
 *       REGISTRATION_OPEN     : TRUE/FALSE — buka/tutup pendaftaran member baru
 *       REGISTRATION_FORM_URL : link publik Google Form (viewform)
 *   - Tab "Config" tersembunyi (CONFIG_SHEET_GID): kolom Key | Value 1 | Value 2
 *       ADMIN_WA_NAME   : nama admin 1 (Value 1) & admin 2 (Value 2)
 *       ADMIN_WA_NUMBER : nomor WA admin 1 (Value 1) & admin 2 (Value 2)
 *     (dibaca via CSV export, BUKAN gviz seperti tab Registration — lihat
 *     komentar resolveAdminWaContacts() di bawah untuk alasannya)
 *
 * EMPAT tanggung jawab, masing-masing no-op aman kalau elemen terkait tidak
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
 * 4. Expose resolveAdminWaContacts() (array 2 kontak, dipakai tombol WA
 *    di footer/FAQ/halaman bantuan) DAN resolveAdminWaNumber() (cuma
 *    kontak pertama, dipakai link WA otomatis setelah submit Form
 *    Pendaftaran) ke window — dipanggil (await) oleh main.js &
 *    register.html sebelum memakai nomor WA, supaya kontak dari tab
 *    Config sempat termuat dulu sebelum dipakai.
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

  fetchSiteSettings(typeof SETTINGS_SHEET_GID !== 'undefined' ? SETTINGS_SHEET_GID : undefined)
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
   gid opsional → baca tab TERTENTU di spreadsheet SETTINGS_SHEET_ID (mis.
   tab "Config" tersembunyi, beda dari tab "Registration" default/gid=0).
   Return: object { KEY: 'value', ... } — semua baris sheet, key di-uppercase.
   ================================================================ */
async function fetchSiteSettings(gid) {
  const gidParam = gid ? `&gid=${gid}` : ''
  const url = `https://docs.google.com/spreadsheets/d/${SETTINGS_SHEET_ID}/gviz/tq?tqx=out:json&headers=1${gidParam}`
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
    link.href = 'register.html'
  })

  const footerLink = document.getElementById('footerRegisterLink')
  if (footerLink) {
    footerLink.textContent = 'Daftar Member Baru'
    footerLink.href = 'register.html'
  }

  // Konten kedua state ("tutup" & "dibuka") sudah ada di markup index.html —
  // di sini cukup pasang/lepas atribut "hidden", TIDAK membangun HTML dari
  // string (lebih aman & lebih mudah diaudit daripada innerHTML dinamis).
  const closedBlock = document.querySelector('#faq-open-member [data-faq-state="closed"]')
  const openBlock = document.querySelector('#faq-open-member [data-faq-state="open"]')
  if (closedBlock) closedBlock.hidden = true
  if (openBlock) openBlock.hidden = false
}

/* ================================================================
   KONTAK WA ADMIN (2 orang) — dari tab "Config" tersembunyi
   (CONFIG_SHEET_GID), fallback ke ADMIN_WA_NAME/ADMIN_WA_NUMBER/
   ADMIN_WA_NAME_2/ADMIN_WA_NUMBER_2 di config.js. Dipanggil main.js &
   register.html (di-expose ke window). Di-cache (variabel module-level)
   supaya HANYA fetch sekali walau dipanggil berkali-kali dari banyak
   tempat (footer, FAQ, submit form).
   Return: array [{name, number}, ...] — cuma berisi kontak yang punya
   nomor (kontak ke-2 di-skip diam-diam kalau nomornya benar-benar
   kosong di Sheet MAUPUN fallback config.js, bukan kasus normal).
   ================================================================ */
let cachedAdminWaContactsPromise = null
function resolveAdminWaContacts() {
  if (cachedAdminWaContactsPromise) return cachedAdminWaContactsPromise

  const fallbackContacts = [
    {
      name: typeof ADMIN_WA_NAME !== 'undefined' ? ADMIN_WA_NAME : 'Admin',
      number: typeof ADMIN_WA_NUMBER !== 'undefined' ? ADMIN_WA_NUMBER : ''
    },
    {
      name: typeof ADMIN_WA_NAME_2 !== 'undefined' ? ADMIN_WA_NAME_2 : '',
      number: typeof ADMIN_WA_NUMBER_2 !== 'undefined' ? ADMIN_WA_NUMBER_2 : ''
    }
  ]
  const isConfigured = typeof SETTINGS_SHEET_ID !== 'undefined' && SETTINGS_SHEET_ID &&
    typeof CONFIG_SHEET_GID !== 'undefined' && CONFIG_SHEET_GID

  cachedAdminWaContactsPromise = isConfigured
    ? fetchAdminWaContactsCsv(CONFIG_SHEET_GID)
        .then(sheet => {
          const contacts = [
            { name: sheet.name1 || fallbackContacts[0].name, number: sheet.number1 || fallbackContacts[0].number },
            { name: sheet.name2 || fallbackContacts[1].name, number: sheet.number2 || fallbackContacts[1].number }
          ]
          return contacts.filter(contact => contact.number)
        })
        .catch(error => {
          console.warn('Kontak WA admin dari Sheet tidak dapat dimuat:', error)
          return fallbackContacts.filter(contact => contact.number)
        })
    : Promise.resolve(fallbackContacts.filter(contact => contact.number))

  return cachedAdminWaContactsPromise
}
window.resolveAdminWaContacts = resolveAdminWaContacts

/* ================================================================
   BACA TAB CONFIG VIA CSV EXPORT (bukan endpoint gviz seperti
   fetchSiteSettings) — sengaja beda: gviz menebak tipe TIAP KOLOM dari
   isinya, dan kolom "Value 1"/"Value 2" di tab Config berisi campuran
   teks (nama) & angka (nomor WA). Kalau gviz menyimpulkan kolom itu
   "angka", cell yang isinya TEKS (nama) diam-diam kembali kosong di
   respons gviz — bug yang sempat bikin nama admin gagal termuat dari
   Sheet walau sudah diisi benar. CSV export TIDAK menebak tipe kolom,
   selalu kembalikan teks apa adanya, jadi bug itu tidak akan terjadi.
   Parser CSV di bawah cukup untuk field berkutip ("...") — tidak perlu
   library eksternal untuk 2 baris data ini.
   ================================================================ */
async function fetchAdminWaContactsCsv(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SETTINGS_SHEET_ID}/export?format=csv&gid=${gid}`
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Google Sheets (CSV) merespons status ${response.status}`)
  }

  const text = await response.text()
  const rows = text
    .split(/\r?\n/)
    .filter(line => line.trim() !== '')
    .slice(1) // baris pertama = header ("Key,Value 1,Value 2"), dilewati
    .map(parseCsvLine)

  const findRow = key => rows.find(cells => (cells[0] || '').trim().toUpperCase() === key)
  const nameRow = findRow('ADMIN_WA_NAME')
  const numberRow = findRow('ADMIN_WA_NUMBER')

  return {
    name1: nameRow ? (nameRow[1] || '').trim() : '',
    name2: nameRow ? (nameRow[2] || '').trim() : '',
    number1: numberRow ? (numberRow[1] || '').trim() : '',
    number2: numberRow ? (numberRow[2] || '').trim() : ''
  }
}

/* Parser 1 baris CSV, menangani field berkutip ("...") yang boleh
   berisi koma/kutip-ganda-escaped. */
function parseCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

/* Nomor WA admin UTAMA saja (kontak pertama) — dipakai di TEMPAT yang
   cuma bisa menampung satu nomor: link WhatsApp yang otomatis terbuka
   sendiri setelah submit Form Pendaftaran (proses otomatis, tidak ada
   jeda untuk menawarkan pilihan admin mana yang dihubungi). */
function resolveAdminWaNumber() {
  return resolveAdminWaContacts().then(contacts => (contacts[0] && contacts[0].number) || '')
}
window.resolveAdminWaNumber = resolveAdminWaNumber

/* fetchWithTimeout dipakai dari config.js (helper bersama) */
