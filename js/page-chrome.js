/**
 * page-chrome.js — Perilaku navbar & footer untuk HALAMAN SELAIN index.html
 *
 * KENAPA ADA FILE INI? Halaman konten (apa-itu-pushbike, komunitas-pushbike-
 * indonesia, race-pushbike, register) memakai navbar & footer yang sama persis
 * dengan beranda, tapi TIDAK butuh isi js/main.js (peta Leaflet, galeri Drive,
 * form pendaftaran, lightbox) — memuatnya cuma memperlambat halaman. Sebelum
 * file ini ada, potongan kode yang sama disalin inline di tiap halaman; sekarang
 * satu sumber untuk semuanya.
 *
 * index.html TIDAK memuat file ini — perilaku yang sama sudah jadi bagian dari
 * logika halaman penuh di main.js.
 *
 * Bergantung pada: site-settings.js (resolveAdminWaContacts) — opsional; kalau
 * belum dimuat, link WhatsApp footer dilewati diam-diam dan sisanya tetap jalan.
 */

/* Ambang scroll (px) sebelum navbar berubah dari transparan jadi solid.
   Nilainya disamakan dengan js/main.js supaya perpindahan antar halaman
   tidak terasa beda. */
const NAVBAR_SCROLL_THRESHOLD = 60

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScrollState()
  initMobileMenu()
  initFooterYear()
  initFooterWaLinks()
})

/**
 * Navbar transparan saat di puncak halaman, jadi solid begitu di-scroll —
 * supaya teks konten di bawahnya tidak "tembus" di balik navbar.
 */
function initNavbarScrollState() {
  const navbar = document.getElementById('navbar')
  if (!navbar) return

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('navbar--scrolled', window.scrollY > NAVBAR_SCROLL_THRESHOLD)
  })
}

/** Tombol hamburger + menu mobile. Menu ditutup lagi setiap link diklik. */
function initMobileMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn')
  const mobileMenu = document.getElementById('mobileMenu')
  if (!hamburgerBtn || !mobileMenu) return

  hamburgerBtn.addEventListener('click', () => {
    const isOpening = !hamburgerBtn.classList.contains('active')
    hamburgerBtn.classList.toggle('active')
    mobileMenu.classList.toggle('open')
    hamburgerBtn.setAttribute('aria-expanded', String(isOpening))
  })

  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburgerBtn.classList.remove('active')
      mobileMenu.classList.remove('open')
      hamburgerBtn.setAttribute('aria-expanded', 'false')
    })
  })
}

/** Tahun copyright footer diisi otomatis supaya tidak pernah usang. */
function initFooterYear() {
  const footerYear = document.getElementById('footerYear')
  if (footerYear) footerYear.textContent = new Date().getFullYear()
}

/**
 * Isi dua link WhatsApp admin di footer. Nomornya dibaca dari tab "Config"
 * tersembunyi di Google Sheet lewat resolveAdminWaContacts(), dengan fallback
 * ke konstanta di config.js kalau sheet gagal dimuat.
 *
 * Slot kontak kedua DISEMBUNYIKAN (bukan dibiarkan jadi link kosong) kalau
 * memang cuma satu kontak yang terkonfigurasi — supaya footer tidak tampak rusak.
 */
async function initFooterWaLinks() {
  if (typeof resolveAdminWaContacts !== 'function') return

  try {
    const [primary, secondary] = await resolveAdminWaContacts()

    const primaryLink = document.getElementById('waAdminLink1')
    if (primary && primary.number && primaryLink) {
      primaryLink.href = `https://wa.me/${primary.number}`
      primaryLink.textContent = `WhatsApp ${primary.name}`
    }

    const secondaryLink = document.getElementById('waAdminLink2')
    if (!secondaryLink) return

    if (!secondary || !secondary.number) {
      const listItem = secondaryLink.closest('li')
      if (listItem) listItem.hidden = true
      return
    }

    secondaryLink.href = `https://wa.me/${secondary.number}`
    secondaryLink.textContent = `WhatsApp ${secondary.name}`
  } catch (error) {
    // Footer tetap tampil utuh walau nomor WA gagal dimuat — link-nya saja
    // yang tidak aktif; halaman tidak boleh ikut rusak karenanya.
    console.warn('Kontak WhatsApp footer tidak dapat dimuat:', error)
  }
}
