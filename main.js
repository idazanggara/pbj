/**
 * main.js — Logika Utama Website PBJ
 *
 * Berisi semua interaksi UI:
 * 1. Navbar scroll effect & hamburger menu
 * 2. Inisialisasi peta Leaflet
 * 3. Filter jadwal
 * 4. Validasi & submit form pendaftaran
 * 5. Modal sukses
 * 6. Tombol scroll-to-top
 *
 * Semua kode dibungkus dalam DOMContentLoaded agar dijalankan
 * setelah seluruh HTML selesai di-parse oleh browser.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 'DOMContentLoaded' = event yang terpicu ketika DOM sudah siap
  // Semua querySelector di bawah aman dijalankan karena HTML sudah ada

  /* ================================================================
     STEP 1: Render Data dari schedule.js
     Fungsi-fungsi ini ada di schedule.js yang di-load sebelum main.js.
     Dibungkus try/catch: data jadwal/pengurus/lokasi/galeri diisi manual
     oleh admin non-dev di schedule.js, jadi satu typo di sana (mis. nama
     dengan format aneh) bisa membuat salah satu fungsi render error.
     Tanpa try/catch, error itu akan MENGHENTIKAN seluruh callback
     DOMContentLoaded — navbar, peta, form pendaftaran ikut mati padahal
     tidak ada hubungannya. Dengan try/catch, bagian lain situs tetap
     jalan walau satu section render gagal.
     ================================================================ */
  try {
    renderScheduleCards('all')   // Tampilkan semua kartu jadwal
    renderPengurusCards()        // Render kartu pengurus
    renderLocationList()         // Render list lokasi sidebar + opsi form
    renderGallery('all')         // Render galeri foto & video
  } catch (error) {
    console.warn('Render data awal (jadwal/pengurus/lokasi/galeri) gagal:', error)
  }

  /* ================================================================
     STEP 2: Navbar — Efek glassmorphism saat scroll
     ================================================================ */
  const navbar = document.getElementById('navbar')

  // 'scroll' event terpicu setiap kali pengguna scroll halaman
  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      // scrollY = jumlah pixel yang sudah di-scroll dari atas
      navbar.classList.add('navbar--scrolled')
      // Tambah class CSS yang mengaktifkan background blur navbar
    } else {
      navbar.classList.remove('navbar--scrolled')
    }
  })

  /* ================================================================
     STEP 3: Hamburger Menu — Buka/tutup mobile menu
     ================================================================ */
  const hamburgerBtn = document.getElementById('hamburgerBtn')
  const mobileMenu = document.getElementById('mobileMenu')
  let menuOpen = false // State apakah menu terbuka

  hamburgerBtn.addEventListener('click', () => {
    menuOpen = !menuOpen // Toggle: jika true jadi false, jika false jadi true

    // Toggle class 'active' di hamburger (animasi ikon → X)
    hamburgerBtn.classList.toggle('active')
    // Toggle class 'open' di menu (animasi buka dengan max-height)
    mobileMenu.classList.toggle('open')
    // Update atribut aksesibilitas: screen reader tahu menu terbuka/tertutup
    hamburgerBtn.setAttribute('aria-expanded', menuOpen.toString())
  })

  // Tutup mobile menu saat link di dalam diklik (smooth navigation)
  mobileMenu.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      menuOpen = false
      hamburgerBtn.classList.remove('active')
      mobileMenu.classList.remove('open')
      hamburgerBtn.setAttribute('aria-expanded', 'false')
    })
  })

  /* ================================================================
     STEP 4: Inisialisasi Peta Leaflet.js
     ================================================================ */
  // try/catch: kalau CDN Leaflet gagal dimuat (L undefined), hanya petanya
  // yang mati — form, galeri, dan interaksi lain tetap berfungsi
  try {

  // Membuat instance peta di elemen #leafletMap
  const map = L.map('leafletMap', {
    center: lokasiData[0].koordinat, // Otomatis ikut koordinat venue utama (JIEP)
    zoom: 16,                        // Zoom lebih dekat agar marker langsung terlihat
    zoomControl: true,
    scrollWheelZoom: true,
  })

  // Tile layer (gambar peta dasar) dari OpenStreetMap
  // OpenStreetMap = peta open source, gratis tanpa API key
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    // {s} = subdomain (a/b/c untuk load balancing)
    // {z} = zoom level
    // {x},{y} = koordinat tile
    maxZoom: 19, // Zoom maksimal yang diizinkan
  }).addTo(map) // .addTo(map) = tambahkan layer ke instance peta

  // Custom marker icon (ikon merah PBJ)
  const pbjIcon = L.divIcon({
    // divIcon = ikon kustom menggunakan HTML/CSS, bukan gambar
    className: 'pbj-marker', // Class CSS untuk styling marker
    html: `<div style="
      width:36px; height:36px;
      background: linear-gradient(135deg, #e8002d, #ff6b1a);
      border-radius: 50% 50% 50% 0;  /* Bentuk teardrop/pin */
      transform: rotate(-45deg);       /* Putar -45° agar ujung ke bawah */
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(232,0,45,0.45);
      display: grid; place-items: center;
    ">
      <i class="fa-solid fa-bicycle" style="transform:rotate(45deg);color:white;font-size:0.75rem;"></i>
    </div>`,
    iconSize: [36, 36],   // Ukuran ikon dalam pixel [lebar, tinggi]
    iconAnchor: [18, 36],   // Titik anchor (ujung bawah tengah, menempel ke koordinat)
    popupAnchor: [0, -36],   // Posisi popup relatif ke anchor (di atas ikon)
  })

  // Tambahkan marker untuk setiap lokasi di lokasiData (dari schedule.js)
  const markers = {} // Objek untuk menyimpan referensi marker berdasarkan id

  lokasiData.forEach(loc => {
    // Ambil jadwal untuk lokasi ini
    const schedules = jadwalData.filter(j => j.lokasi_id === loc.id)
    // Hari & jam dua kolom rata (memakai gaya .schedule-line yang sama
    // dengan daftar lokasi di sidebar peta)
    const jadwalText = schedules.map(j => `
      <span class="schedule-line">
        <strong class="schedule-line__day">${j.hari}</strong>
        <span class="schedule-line__time">${j.jam}</span>
      </span>`).join('')

    // Buat marker di koordinat lokasi dengan ikon kustom
    const marker = L.marker(loc.koordinat, { icon: pbjIcon })
      .addTo(map) // Tambahkan marker ke peta
      .bindPopup(`
        <div style="min-width:200px;">
          <div class="popup-title">
            <i class="fa-solid fa-bicycle" style="color:#e8002d;margin-right:6px;"></i>
            ${loc.nama_tempat}
          </div>
          <div class="popup-addr">${loc.alamat}</div>
          <div class="popup-time" style="margin-top:8px;">${jadwalText || 'Lihat jadwal di atas'}</div>
          <a href="${loc.googleMapsUrl}" target="_blank" rel="noopener"
             style="display:inline-block;margin-top:10px;font-size:0.8rem;color:#ff6b1a;">
            <i class="fa-solid fa-map-location-dot"></i> Buka Google Maps
          </a>
        </div>
      `)
    // bindPopup() = mengikat popup HTML ke marker, tampil saat marker diklik

    markers[loc.id] = marker // Simpan referensi marker
  })

  // Klik pada item di sidebar → peta bergerak ke lokasi & buka popup
  document.getElementById('locationList').addEventListener('click', (e) => {
    const item = e.target.closest('.location-item')
    // closest() = cari ancestor terdekat yang cocok dengan selector
    // Berguna agar klik pada child element (span, i) tetap terdeteksi

    if (!item) return // Guard clause

    const id = parseInt(item.dataset.id)   // Baca data-id dari HTML
    const lat = parseFloat(item.dataset.lat) // Baca data-lat
    const lng = parseFloat(item.dataset.lng) // Baca data-lng

    // Animasikan peta ke lokasi yang diklik
    map.flyTo([lat, lng], 15, {
      // flyTo = animasi smooth zoom & pan ke koordinat
      // 15 = level zoom setelah animasi
      duration: 1.5, // Durasi animasi dalam detik
    })

    // Buka popup marker yang sesuai
    if (markers[id]) markers[id].openPopup()
  })

  } catch (error) {
    console.warn('Peta tidak dapat dimuat (CDN Leaflet bermasalah):', error)
  }

  /* ================================================================
     STEP 5: Filter Jadwal — Tombol filter untuk menyaring kartu
     ================================================================ */
  const filterBtns = document.querySelectorAll('#schedule .filter-btn')
  // Di-scope ke #schedule agar tidak menangkap tombol filter galeri (#galeri)

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Hapus class 'active' dari semua tombol filter
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'))

      // Tambah class 'active' ke tombol yang diklik
      btn.classList.add('filter-btn--active')

      // Ambil nilai filter dari atribut data-filter
      const filter = btn.dataset.filter // 'all' | 'Sabtu' | 'Minggu' | 'Rutin'

      // Panggil fungsi render dari schedule.js dengan filter yang dipilih
      renderScheduleCards(filter)
    })
  })

  /* ================================================================
     STEP 5b: Galeri — Filter kategori + Lightbox foto/video
     ================================================================ */
  // Filter galeri (di-scope ke #galeri agar tidak bentrok dengan filter jadwal)
  const galleryFilterBtns = document.querySelectorAll('#galeri .filter-btn')
  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('filter-btn--active'))
      btn.classList.add('filter-btn--active')
      renderGallery(btn.dataset.filter)
    })
  })

  // Lightbox — pratinjau foto (img) atau video (iframe YouTube) fullscreen
  const lightbox = document.getElementById('lightbox')
  const lightboxBody = document.getElementById('lightboxBody')
  const lightboxClose = document.getElementById('lightboxClose')
  const galleryGrid = document.getElementById('galleryGrid')

  function openLightbox(type, src) {
    if (!src) return // Item placeholder (belum ada media) tidak membuka apa-apa
    // src berasal dari atribut data-* (bisa berisi karakter apa pun),
    // jadi JANGAN diinterpolasi mentah ke innerHTML: ID di-encode ke URL,
    // dan foto dibuat lewat DOM API (src sebagai properti, bukan markup).
    if (type === 'drive-video') {
      // Video dari Google Drive: src = file ID → embed player preview Drive
      lightboxBody.innerHTML = `
        <div class="lightbox-video">
          <iframe src="https://drive.google.com/file/d/${encodeURIComponent(src)}/preview"
            title="Video Pushbike Jakarta" allowfullscreen
            allow="autoplay; encrypted-media"></iframe>
        </div>`
    } else if (type === 'video') {
      // Embed YouTube; rel=0 = tidak menampilkan video channel lain di akhir
      lightboxBody.innerHTML = `
        <div class="lightbox-video">
          <iframe src="https://www.youtube.com/embed/${encodeURIComponent(src)}?autoplay=1&rel=0"
            title="Video Pushbike Jakarta" allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
        </div>`
    } else {
      const img = document.createElement('img')
      img.src = src
      img.alt = 'Galeri Pushbike Jakarta'
      lightboxBody.replaceChildren(img)
    }
    lightbox.removeAttribute('hidden')
    document.body.style.overflow = 'hidden'
  }

  function closeLightbox() {
    lightbox.setAttribute('hidden', '')
    lightboxBody.innerHTML = '' // Kosongkan agar video berhenti & hemat memori
    document.body.style.overflow = ''
  }

  if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
      const fig = e.target.closest('.gallery-item')
      if (!fig || fig.classList.contains('gallery-item--placeholder')) return
      openLightbox(fig.dataset.type, fig.dataset.src)
    })
    // Aksesibilitas keyboard: Enter / Space membuka item yang difokus
    galleryGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const fig = e.target.closest('.gallery-item')
      if (!fig || fig.classList.contains('gallery-item--placeholder')) return
      e.preventDefault()
      openLightbox(fig.dataset.type, fig.dataset.src)
    })
  }
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox)
  if (lightbox) {
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox() })
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hasAttribute('hidden')) closeLightbox()
  })

  /* ================================================================
     STEP 6: Form Pendaftaran — Validasi & Kirim ke WhatsApp Admin
     ================================================================ */

  // ADMIN_WA_NUMBER didefinisikan SATU KALI di config.js (dimuat sebelum
  // main.js) — lihat komentar di sana untuk cara ganti nomornya. Blok di
  // bawah ini menyebarkan nomor itu ke SEMUA tempat yang menampilkannya:
  // link WhatsApp (footer, form) DAN teks (FAQ + JSON-LD). Dibungkus
  // try/catch supaya kalau ada yang meleset di sini, bagian lain halaman
  // (navbar, peta, form) tetap jalan normal.
  try {
    // Tombol WhatsApp di baris kontak footer
    const waAdminLink = document.getElementById('waAdminLink')
    if (waAdminLink) waAdminLink.href = `https://wa.me/${ADMIN_WA_NUMBER}`

    // Ikon WhatsApp di grup ikon sosial footer
    const waSocialLink = document.getElementById('waSocialLink')
    if (waSocialLink) waSocialLink.href = `https://wa.me/${ADMIN_WA_NUMBER}`

    // Teks FAQ yang menampilkan nomor WA — HTML menandainya dengan
    // <span data-wa-number>...</span>, isi aslinya di HTML cuma fallback
    // (kalau JS gagal jalan, pengunjung masih lihat nomor, bukan kosong).
    document.querySelectorAll('[data-wa-number]').forEach(el => {
      el.textContent = ADMIN_WA_NUMBER
    })

    // JSON-LD FAQPage (di <head>) tidak bisa langsung baca variabel JS
    // karena isinya harus tetap JSON murni. Trik: teks jawaban yang
    // menyebut nomor WA ditulis dengan placeholder literal
    // "__ADMIN_WA_NUMBER__" (tetap JSON valid, cuma potongan string),
    // lalu di sini kita ganti jadi nomor sungguhan. Dicek dulu dengan
    // .includes() supaya blok JSON-LD lain (WebSite, SportsClub) yang
    // tidak punya placeholder ini tidak ikut ditulis ulang tanpa perlu.
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      if (script.textContent.includes('__ADMIN_WA_NUMBER__')) {
        script.textContent = script.textContent.replaceAll('__ADMIN_WA_NUMBER__', ADMIN_WA_NUMBER)
      }
    })
  } catch (error) {
    console.warn('Gagal mengisi nomor WA admin di halaman:', error)
  }

  const form = document.getElementById('registerForm')
  const submitBtn = document.getElementById('submitBtn')
  const successModal = document.getElementById('successModal')

  // --- ISI OPSI TAHUN KELAHIRAN ANAK ---
  // Rentang mengikuti usia komunitas (1–7 tahun) dan otomatis
  // menyesuaikan tahun berjalan, jadi tidak perlu diubah manual tiap tahun.
  const birthYearSelect = document.getElementById('childBirthYear')
  if (birthYearSelect) {
    const USIA_MIN = 1
    const USIA_MAX = 7
    const tahunSekarang = new Date().getFullYear()

    // +1 di batas akhir: anak berusia N tahun bisa lahir di tahun
    // (sekarang - N) ATAU (sekarang - N - 1), tergantung bulan lahirnya.
    // Contoh: Juli 2026, anak 7 tahun bisa lahir 2019 maupun Nov 2018.
    for (let usia = USIA_MIN; usia <= USIA_MAX + 1; usia++) {
      const tahunLahir = tahunSekarang - usia
      const option = document.createElement('option')
      option.value = tahunLahir
      option.textContent = tahunLahir
      birthYearSelect.appendChild(option)
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault() // Cegah reload halaman (default behavior form HTML)

    // --- VALIDASI FIELD WAJIB ---
    const fields = form.querySelectorAll('[required]')
    let isValid = true

    fields.forEach(field => {
      // Hapus pesan error sebelumnya
      const existingError = field.parentElement.querySelector('.field-error')
      if (existingError) existingError.remove()

      if (!field.value.trim()) {
        isValid = false
        field.style.borderColor = '#e8002d'

        const errorMsg = document.createElement('span')
        errorMsg.className = 'field-error'
        errorMsg.style.cssText = 'color:#f87171;font-size:0.78rem;margin-top:4px;display:block;'
        errorMsg.textContent = 'Field ini wajib diisi.'
        field.parentElement.appendChild(errorMsg)

        field.addEventListener('input', () => {
          field.style.borderColor = ''
          errorMsg.remove()
        }, { once: true })
      }
    })

    if (!isValid) return

    // --- VALIDASI FORMAT NOMOR WA ---
    const phone = document.getElementById('phone').value
    const phoneRegex = /^(\+62|08)\d{8,13}$/
    if (!phoneRegex.test(phone)) {
      document.getElementById('phone').style.borderColor = '#e8002d'
      alert('Format nomor HP tidak valid. Gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxx')
      return
    }

    // --- AMBIL SEMUA DATA FORM ---
    const namaOrtu = document.getElementById('parentName').value.trim()
    const namaAnak = document.getElementById('childName').value.trim()
    const usiaAnak = document.getElementById('childAge').value
    const tahunLahirAnak = document.getElementById('childBirthYear').value

    // Ambil TEKS lokasi (bukan value/id-nya) dari option yang dipilih
    const lokasiEl = document.getElementById('preferredLocation')
    const namaLokasi = lokasiEl.options[lokasiEl.selectedIndex].text
    // lokasiEl.options = semua <option> dalam <select>
    // selectedIndex     = index option yang sedang dipilih
    // .text             = teks yang tampil (bukan .value yang berisi id)

    // --- GET TAHUN OTOMATIS ---
    const tahun = new Date().getFullYear()
    // new Date()       = objek tanggal/waktu saat ini
    // .getFullYear()   = mengambil tahun 4 digit (misal: 2026)

    // --- FORMAT PESAN WHATSAPP ---
    // Template pesan yang akan muncul di chat WhatsApp admin
    // Setiap baris baru menggunakan %0A (URL-encoded newline)
    // encodeURIComponent() = mengubah karakter khusus jadi aman untuk URL
    const pesan = [
      `🚲 *CALON MEMBER PBJ TAHUN ${tahun}*`,
      `━━━━━━━━━━━━━━━━━━━`,
      ``,
      `👤 *Nama Orang Tua:* ${namaOrtu}`,
      `👶 *Nama Anak:* ${namaAnak}`,
      `🎂 *Usia Anak:* ${usiaAnak} tahun`,
      `📆 *Tahun Kelahiran:* ${tahunLahirAnak}`,
      `📱 *Nomor WA:* ${phone}`,
      `📍 *Lokasi Latihan Pilihan:* ${namaLokasi}`,
      ``,
      `━━━━━━━━━━━━━━━━━━━`,
      `📅 Dikirim: ${new Date().toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}`,
      // toLocaleDateString('id-ID') = format tanggal Bahasa Indonesia
      // Contoh output: "Jumat, 28 Februari 2026"
      ``,
      `_Pesan ini dikirim otomatis dari website PUSHBIKE JAKARTA._`,
      `_Balas pesan ini untuk menghubungi calon member._`
    ].join('\n')
    // Array.join('\n') = gabungkan semua baris dengan newline

    // --- BUAT LINK WA DAN BUKA ---
    const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(pesan)}`
    // wa.me/{nomor}?text={pesan} = link WhatsApp Web/App dengan pesan sudah terisi
    // encodeURIComponent() = encode karakter seperti spasi, *, \n jadi format URL
    // Contoh: spasi → %20, newline → %0A, * → %2A

    // Loading state pada tombol
    submitBtn.disabled = true
    const originalHTML = submitBtn.innerHTML
    submitBtn.innerHTML = `
      <span style="display:inline-block;width:18px;height:18px;border:2px solid white;
        border-top-color:transparent;border-radius:50%;animation:spin 0.7s linear infinite;"></span>
      Membuka WhatsApp...`

    if (!document.getElementById('spinnerStyle')) {
      const style = document.createElement('style')
      style.id = 'spinnerStyle'
      style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
      document.head.appendChild(style)
    }

    // Buka WhatsApp setelah jeda singkat (memberi waktu browser memproses)
    setTimeout(() => {
      window.open(waUrl, '_blank')
      // window.open(url, '_blank') = buka URL di tab/window baru
      // Jika di HP: otomatis membuka aplikasi WhatsApp
      // Jika di desktop: membuka WhatsApp Web di tab baru

      submitBtn.disabled = false
      submitBtn.innerHTML = originalHTML

      // Tampilkan modal konfirmasi
      successModal.removeAttribute('hidden')
      document.body.style.overflow = 'hidden'

      // Reset form
      form.reset()
    }, 800) // Jeda 800ms agar loading spinner sempat terlihat
  })

  /* ================================================================
     STEP 7: Modal Sukses — Tutup modal
     ================================================================ */
  const modalCloseBtn = document.getElementById('modalCloseBtn')

  // Fungsi menutup modal
  function closeModal() {
    successModal.setAttribute('hidden', '') // Tambah atribut hidden = sembunyikan
    document.body.style.overflow = ''       // Izinkan scroll kembali
  }

  modalCloseBtn.addEventListener('click', closeModal)

  // Klik di luar box modal juga menutup modal
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) closeModal()
    // e.target = elemen yang benar-benar diklik
    // Jika klik di overlay (bukan di dalam .modal-box), tutup modal
  })

  // Tekan Escape untuk menutup modal (aksesibilitas keyboard)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !successModal.hasAttribute('hidden')) {
      closeModal()
    }
  })

  /* ================================================================
     STEP 8: Scroll To Top Button
     ================================================================ */
  const scrollTopBtn = document.getElementById('scrollTopBtn')

  window.addEventListener('scroll', () => {
    // Tampilkan tombol setelah scroll 400px ke bawah
    if (window.scrollY > 400) {
      scrollTopBtn.removeAttribute('hidden')
    } else {
      scrollTopBtn.setAttribute('hidden', '')
    }
  })

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,           // Scroll ke paling atas
      behavior: 'smooth' // Animasi smooth scroll
    })
  })

  /* ================================================================
     STEP 9: Intersection Observer — Animasi muncul saat scroll
     ================================================================ */
  const animatableElements = document.querySelectorAll(
    '.schedule-card, .info-card, .pengurus-card, .feature-badge, .impact-card, .safety-card, .gallery-item'
  )

  // IntersectionObserver = Web API native untuk memantau apakah elemen
  // masuk/keluar dari viewport (area yang terlihat di layar)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // isIntersecting = true jika elemen masuk ke viewport
        entry.target.style.opacity = '1'
        entry.target.style.transform = 'translateY(0)'
        observer.unobserve(entry.target) // Hentikan observasi setelah animasi (hemat memori)
      }
    })
  }, {
    threshold: 0.1, // Terpicu saat 10% elemen terlihat di viewport
    rootMargin: '0px 0px -40px 0px' // Batas deteksi: 40px sebelum bawah viewport
  })

  // Set style awal (tidak terlihat + geser ke bawah) untuk semua elemen yang akan dianimasi
  animatableElements.forEach((el, index) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`
    // index * 0.05s = stagger delay: setiap kartu muncul 50ms setelah kartu sebelumnya
    observer.observe(el) // Mulai mengamati elemen ini
  })

  // Update tahun copyright footer otomatis (tidak pernah usang)
  const footerYear = document.getElementById('footerYear')
  if (footerYear) footerYear.textContent = new Date().getFullYear()

  /* ================================================================
     STEP 10: FAQ Kelompok A — Buka via Link (Hash) + Tombol Salin
     Tujuan: admin bisa membalas DM WhatsApp/Instagram dengan SATU link
     yang langsung membuka jawaban spesifik, tanpa orang tua harus
     scroll & cari sendiri di antara 23 pertanyaan FAQ.

     CARA KERJA:
     1. Saat halaman dibuka dengan URL berakhiran '#faq-xxx' (atau saat
        hash berubah tanpa reload, mis. diklik dari link internal), cari
        <details> dengan id itu, buka otomatis, lalu scroll ke situ.
     2. 'block: center' dipakai (bukan 'start') karena navbar melayang
        tetap (position: fixed) setinggi ±75px — kalau elemen di-scroll
        ke paling atas viewport, bagian atasnya akan ketutup navbar.
     3. Hash dari URL SELALU divalidasi lewat whitelist FAQ_GROUP_A_IDS
        dulu sebelum dipakai sebagai id pencarian — mencegah hash iseng
        atau rusak dipakai langsung sebagai selector pencarian elemen.
     4. Tiap FAQ Kelompok A punya tombol "Salin link jawaban ini" yang
        menyalin URL halaman + hash id tersebut ke clipboard, supaya
        admin tinggal klik-salin-tempel ke chat orang tua.
     ================================================================ */
  try {
    // Whitelist id FAQ Kelompok A yang valid — HANYA id di daftar ini yang
    // boleh dipakai untuk mencari elemen di halaman lewat location.hash.
    const FAQ_GROUP_A_IDS = [
      'faq-cara-daftar', 'faq-usia', 'faq-trial', 'faq-biaya', 'faq-syarat',
      'faq-open-member', 'faq-lokasi-lain', 'faq-jadwal', 'faq-kontak',
    ]

    // openFaqFromHash()
    // Baca hash yang berlaku saat ini: utamakan location.hash (kalau user
    // baru saja klik link '#faq-xxx' di dalam halaman → hashchange), kalau
    // kosong pakai window.__initialFaqHash (hash asli dari URL saat halaman
    // pertama dibuka, sudah dibuang dari address bar oleh <script> pertama
    // di <head> — lihat komentar di sana untuk alasannya). Kalau cocok
    // salah satu id di whitelist: buka <details>-nya lalu scroll ke situ.
    function openFaqFromHash() {
      const rawHash = location.hash || window.__initialFaqHash || ''
      const hashId = decodeURIComponent(rawHash.slice(1)) // buang '#' di depan
      if (!FAQ_GROUP_A_IDS.includes(hashId)) return // hash tidak dikenali → diamkan saja

      const target = document.getElementById(hashId)
      if (!target) return // jaga-jaga kalau elemen belum/tidak ada di DOM

      target.open = true
      target.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    openFaqFromHash() // Jalankan sekali saat halaman pertama dimuat

    // Jalankan ULANG beberapa kali dengan jeda bertahap. Alasan: section DI
    // ATAS FAQ (galeri Drive, event Sheets, feed Instagram) memuat datanya
    // lewat fetch ASINKRON yang baru selesai setelah DOMContentLoaded —
    // begitu section itu selesai render, tingginya berubah, dan itu
    // MENGGESER posisi FAQ di halaman walau scrollY tidak berubah. Tanpa
    // pengulangan ini, scroll pertama bisa "benar sesaat" lalu meleset
    // begitu galeri/feed di atasnya selesai dimuat (terverifikasi lewat
    // testing lokal — geser bisa terjadi lebih dari sekali, jadi dicoba
    // ulang di beberapa titik waktu, bukan cuma sekali).
    setTimeout(openFaqFromHash, 600)
    setTimeout(openFaqFromHash, 1800)

    // 'hashchange' terpicu kalau hash berubah TANPA reload halaman penuh
    // (mis. pengguna klik link '#faq-usia' saat sudah berada di halaman ini)
    window.addEventListener('hashchange', openFaqFromHash)

    // fallbackCopyText(text)
    // Cara salin teks ke clipboard untuk browser/konteks yang tidak
    // mendukung navigator.clipboard (mis. dibuka lewat http:// biasa,
    // atau WebView Instagram versi lama). Trik lama: taruh teks di
    // <textarea> tersembunyi, seleksi semua isinya, lalu panggil
    // document.execCommand('copy').
    function fallbackCopyText(text) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed' // supaya tidak menggeser scroll halaman
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        document.execCommand('copy')
      } catch (copyError) {
        console.warn('Gagal menyalin link FAQ:', copyError)
      }
      document.body.removeChild(textarea)
    }

    // showCopyFeedback(button)
    // Ubah teks tombol sebentar jadi "Tersalin!" sebagai umpan balik visual,
    // lalu kembalikan ke teks semula setelah 1.5 detik.
    function showCopyFeedback(button) {
      const originalHtml = button.innerHTML
      button.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin!'
      setTimeout(() => {
        button.innerHTML = originalHtml
      }, 1500)
    }

    // Pasang listener klik ke semua tombol "Salin link jawaban ini"
    document.querySelectorAll('.faq-copy-btn').forEach(button => {
      button.addEventListener('click', () => {
        const faqId = button.dataset.faqId
        if (!FAQ_GROUP_A_IDS.includes(faqId)) return // jaga-jaga kalau id tombol typo

        const shareUrl = `${location.origin}${location.pathname}#${faqId}`

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl)
            .then(() => showCopyFeedback(button))
            .catch(() => {
              fallbackCopyText(shareUrl)
              showCopyFeedback(button)
            })
        } else {
          fallbackCopyText(shareUrl)
          showCopyFeedback(button)
        }
      })
    })
  } catch (error) {
    // Kalau mekanik FAQ ini gagal karena sebab apa pun, jangan sampai
    // mematikan seluruh halaman — FAQ tetap bisa dibuka manual dengan klik.
    console.warn('Mekanik share-link FAQ gagal dimuat:', error)
  }

  // (Pesan debug console dihapus: tidak ada console.log di kode production)
})
