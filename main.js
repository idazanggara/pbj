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
     Fungsi-fungsi ini ada di schedule.js yang di-load sebelum main.js
     ================================================================ */
  renderScheduleCards('all')   // Tampilkan semua kartu jadwal
  renderPengurusCards()        // Render kartu pengurus
  renderLocationList()         // Render list lokasi sidebar + opsi form

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

  // Membuat instance peta di elemen #leafletMap
  const map = L.map('leafletMap', {
    center: [-6.2088, 106.8180], // Koordinat tengah Jakarta
    zoom: 12,                  // Level zoom: 12 = view kota
    zoomControl: true,                // Tampilkan tombol +/- zoom
    scrollWheelZoom: true,                // Izinkan scroll wheel untuk zoom
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
    const jadwalText = schedules.map(j => `<strong>${j.hari}</strong> ${j.jam}`).join('<br>')

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

  /* ================================================================
     STEP 5: Filter Jadwal — Tombol filter untuk menyaring kartu
     ================================================================ */
  const filterBtns = document.querySelectorAll('.filter-btn')
  // querySelectorAll() = ambil semua elemen yang cocok sebagai NodeList

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
     STEP 6: Form Pendaftaran — Validasi & Kirim ke WhatsApp Admin
     ================================================================ */

  // ⬇️ GANTI NOMOR INI dengan nomor WhatsApp admin/sekretaris PBJ
  // Format: kode negara + nomor tanpa 0 di depan (contoh: 628123456789)
  const ADMIN_WA_NUMBER = '6285691530710'

  const form = document.getElementById('registerForm')
  const submitBtn = document.getElementById('submitBtn')
  const successModal = document.getElementById('successModal')

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
      `_Pesan ini dikirim otomatis dari website PBJ._`,
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
    '.schedule-card, .info-card, .pengurus-card, .feature-badge'
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

  console.log('%c🚲 PBJ Website Loaded!', 'color:#e8002d;font-size:1.2rem;font-weight:bold;')
  // console.log dengan CSS formatting — pesan debug di Developer Tools (F12)
})
