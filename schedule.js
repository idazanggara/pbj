/**
 * schedule.js — Data Jadwal, Lokasi & Pengurus PBJ
 *
 * Data resmi jadwal latihan PBJ per Februari 2026:
 * - Latber Rutin: Selasa & Jumat, 20:00–22:00 WIB
 * - Latber Pagi : Minggu, 09:00–11:00 WIB
 * - Venue Utama : Jakarta International Equestrian Park (JIEP), Pulomas
 * - Venue Event  : Jakarta International Stadium (JIS)
 *
 * Sumber data: pengumuman resmi grup WhatsApp PBJ
 */

/* ================================================================
   1. DATA LOKASI LATIHAN
   - id          : Primary key (sesuai model LokasiLatihan di setting.py)
   - nama_tempat : Nama venue
   - alamat      : Alamat lengkap
   - koordinat   : [latitude, longitude] untuk marker Leaflet di peta
   - googleMapsUrl: Link Google Maps / Maps App untuk navigasi
   ================================================================ */
const lokasiData = [
  {
    id: 1,
    nama_tempat: "Jakarta International Equestrian Park",
    // Venue utama latihan rutin PBJ (Selasa, Jumat, Minggu)
    alamat: "Area Parkir Tengah, Jl. Pulomas, Pulo Gadung, Jakarta Timur",
    koordinat: [-6.1855, 106.8698],
    // Koordinat: Jakarta International Equestrian Park, Pulomas, Jakarta Timur
    googleMapsUrl: "https://maps.app.goo.gl/8NE4wRdLytoG9gbN7"
    // Link resmi dari pengumuman grup WA PBJ
  },
  {
    id: 2,
    nama_tempat: "Jakarta International Stadium (JIS)",
    // Venue event & kompetisi sesional PBJ
    alamat: "Jl. Sunter Jaya No.1, Tanjung Priok, Jakarta Utara",
    koordinat: [-6.1282, 106.8572],
    // Koordinat: JIS (Jakarta International Stadium), Tanjung Priok
    googleMapsUrl: "https://maps.google.com/?q=Jakarta+International+Stadium+JIS"
  }
]

/* ================================================================
   2. DATA JADWAL LATIHAN
   Sumber: Pengumuman resmi grup WA PBJ
   - hari       : 'Selasa' | 'Jumat' | 'Minggu' | 'Event'
   - jam        : Jam mulai – selesai WIB
   - lokasi_id  : Foreign key → id dari lokasiData
   - keterangan : Info tambahan untuk orang tua
   - terbuka    : true = dibuka untuk umum / non-member
   ================================================================ */
const jadwalData = [
  {
    id: 1,
    hari: "Selasa",
    // Latber malam rutin hari Selasa
    jam: "20:00 – 22:00 WIB",
    lokasi_id: 1,                           // JIEP Pulomas
    keterangan: "Latber rutin malam | Dibuka untuk umum",
    terbuka: true,                           // Boleh diikuti non-member
    icon: "fa-solid fa-moon"                 // Ikon bulan = sesi malam
  },
  {
    id: 2,
    hari: "Jumat",
    // Latber malam rutin hari Jumat
    jam: "20:00 – 22:00 WIB",
    lokasi_id: 1,                           // JIEP Pulomas (sama)
    keterangan: "Latber rutin malam | Dibuka untuk umum",
    terbuka: true,
    icon: "fa-solid fa-star-and-crescent"   // Ikon Jumat/malam
  },
  {
    id: 3,
    hari: "Minggu",
    // Latber pagi hari Minggu
    jam: "09:00 – 11:00 WIB",
    lokasi_id: 1,                           // JIEP Pulomas (sama)
    keterangan: "Latber pagi | Dibuka untuk umum",
    terbuka: true,
    icon: "fa-solid fa-sun"                 // Ikon matahari = sesi pagi
  },
  {
    id: 4,
    hari: "Event",
    // Venue event & kompetisi sesional — jadwal menyesuaikan
    jam: "Menyesuaikan jadwal event",
    lokasi_id: 2,                           // Jakarta International Stadium (JIS)
    keterangan: "Venue kompetisi & event sesional PBJ — pantau pengumuman grup WA",
    terbuka: false,                          // Event tertentu membutuhkan pendaftaran
    icon: "fa-solid fa-trophy"
  }
]

/* ================================================================
   3. DATA PENGURUS PBJ
   Sumber: README.md — Susunan Pengurus PBJ

   Struktur jabatan dikelompokkan per posisi.
   - jabatan  : Nama posisi/jabatan
   - icon     : Ikon Font Awesome untuk visual
   - anggota  : Array nama — boleh lebih dari satu orang
   ================================================================ */
const pengurusData = [
  {
    jabatan: "Ketua",
    icon: "fa-solid fa-crown",            // Ikon mahkota = pemimpin
    anggota: ["Oky Windarwanto"]
  },
  {
    jabatan: "Wakil Ketua",
    icon: "fa-solid fa-user-tie",
    anggota: ["Ilham Ismail"]
  },
  {
    jabatan: "Sekretaris",
    icon: "fa-solid fa-file-pen",
    anggota: ["M Arif Nur Iskandar"]
  },
  {
    jabatan: "Bendahara",
    icon: "fa-solid fa-wallet",
    anggota: ["Alisha Amelia Dwi Putri", "Ameera Bilqis"]
    // 2 orang — keduanya akan ditampilkan dalam satu kartu jabatan
  },
  {
    jabatan: "Publikasi & Dokumentasi",
    icon: "fa-solid fa-camera",
    anggota: ["Ryan Antoni"]
  },
  {
    jabatan: "Humas",
    icon: "fa-solid fa-people-group",
    anggota: ["Rendy", "Jefri", "Dani", "Bastian"]
    // 4 orang — semua ditampilkan dalam satu kartu jabatan
  },
  {
    jabatan: "Tech",
    icon: "fa-solid fa-laptop-code",
    anggota: ["Idaz"]
  }
]

/* ================================================================
   4. FUNGSI RENDER — Menghasilkan HTML dari data di atas
   ================================================================ */

/**
 * getLokasiById(id)
 * Mencari objek lokasi berdasarkan id (simulasi JOIN di SQL/Django ORM)
 * @param {number} id - lokasi_id dari jadwalData
 * @returns {object} - objek lokasi dari lokasiData
 */
function getLokasiById(id) {
  return lokasiData.find(loc => loc.id === id)
  // Array.find() = mengembalikan elemen pertama yang memenuhi kondisi
}

/**
 * getBadgeClass(hari)
 * Mengembalikan class CSS yang sesuai dengan hari untuk warna badge
 * @param {string} hari - 'Selasa' | 'Jumat' | 'Minggu' | 'Event'
 * @returns {string} - class CSS badge (didefinisikan di style.css)
 */
function getBadgeClass(hari) {
  const map = {
    'Selasa': 'badge--selasa',  // Ungu — sesi malam weekday
    'Jumat': 'badge--jumat',   // Teal/hijau — malam menjelang weekend
    'Minggu': 'badge--minggu',  // Merah — pagi akhir pekan
    'Event': 'badge--event'    // Kuning gold — event/kompetisi
  }
  return map[hari] || 'badge--minggu' // Fallback jika hari tidak dikenali
}

/**
 * renderScheduleCards(filter)
 * Merender kartu jadwal ke dalam #scheduleGrid
 * @param {string} filter - 'all' | 'Selasa' | 'Jumat' | 'Minggu' | 'Event'
 */
function renderScheduleCards(filter = 'all') {
  const grid = document.getElementById('scheduleGrid')
  if (!grid) return // Guard clause: hentikan jika elemen tidak ada

  // Filter data berdasarkan hari
  const filtered = filter === 'all'
    ? jadwalData                                      // Tampilkan semua
    : jadwalData.filter(j => j.hari === filter)      // Filter berdasarkan hari

  // Jika tidak ada hasil filter
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:64px; color:var(--clr-text-dim);">
        <i class="fa-solid fa-calendar-xmark" style="font-size:2.5rem;margin-bottom:16px;display:block;"></i>
        Tidak ada jadwal untuk hari ini.
      </div>`
    return
  }

  // Buat HTML kartu untuk setiap item jadwal
  // Array.map() = transformasi setiap elemen menjadi HTML string
  // Array.join('') = gabungkan semua string tanpa separator
  grid.innerHTML = filtered.map(jadwal => {
    const lokasi = getLokasiById(jadwal.lokasi_id) // JOIN data lokasi
    return `
      <article class="schedule-card" data-hari="${jadwal.hari}">
        <!-- article adalah tag semantik HTML5 untuk konten yang berdiri sendiri -->

        <div class="schedule-card__header">
          <div class="schedule-card__icon">
            <i class="${jadwal.icon}"></i>
          </div>
          <span class="schedule-card__day-badge ${getBadgeClass(jadwal.hari)}">
            ${jadwal.hari}
          </span>
        </div>

        <h3 class="schedule-card__title">${lokasi.nama_tempat}</h3>

        <div class="schedule-card__details">
          <div class="schedule-detail-item">
            <i class="fa-solid fa-clock"></i>
            <span>${jadwal.jam}</span>
          </div>
          <div class="schedule-detail-item">
            <i class="fa-solid fa-location-dot"></i>
            <span>${lokasi.alamat}</span>
          </div>
          <div class="schedule-detail-item">
            <i class="fa-solid fa-circle-info"></i>
            <span>${jadwal.keterangan}</span>
          </div>
        </div>

        <a href="${lokasi.googleMapsUrl}" target="_blank" rel="noopener noreferrer"
           class="btn btn--ghost" style="font-size:0.85rem;padding:10px 18px;">
          <!-- target="_blank" = buka di tab baru -->
          <!-- rel="noopener noreferrer" = keamanan: cegah tab baru mengakses window.opener -->
          <i class="fa-solid fa-map-location-dot"></i> Lihat di Maps
        </a>
      </article>`
  }).join('')
}

/**
 * renderPengurusCards()
 * Merender kartu pengurus ke dalam #pengurusGrid
 *
 * Desain baru: satu kartu per jabatan, tampilkan semua anggota di dalamnya.
 * Jika anggota > 1, tampilkan sebagai daftar avatar berderet.
 */
function renderPengurusCards() {
  const grid = document.getElementById('pengurusGrid')
  if (!grid) return

  grid.innerHTML = pengurusData.map(jabatan => {

    // Buat inisial dari nama: ambil huruf pertama tiap kata, maks 2 karakter
    // Contoh: "Alisha Amelia Dwi Putri" → "AA"
    const getInitial = (nama) =>
      nama.split(' ')                        // Pecah nama jadi array kata
        .slice(0, 2)                       // Ambil maksimal 2 kata pertama
        .map(w => w[0].toUpperCase())      // Ambil huruf pertama, jadikan kapital
        .join('')                          // Gabungkan → "AA"

    // Tentukan apakah jabatan ini memiliki lebih dari satu anggota
    const isMultiple = jabatan.anggota.length > 1

    // Render avatar untuk setiap anggota
    // Jika lebih dari 1 orang, avatar ditumpuk/berderet (dikontrol CSS)
    const avatarHtml = jabatan.anggota.map(nama => `
      <div class="pengurus-member">
        <div class="pengurus-avatar">${getInitial(nama)}</div>
        <span class="pengurus-member-name">${nama}</span>
      </div>
    `).join('')

    return `
      <div class="pengurus-card ${isMultiple ? 'pengurus-card--multi' : ''}">
        <!-- pengurus-card--multi = class modifier untuk kartu dengan banyak anggota -->

        <div class="pengurus-card__header">
          <div class="pengurus-card__icon">
            <i class="${jabatan.icon}"></i>
          </div>
          <div class="pengurus-card__meta">
            <p class="pengurus-jabatan">${jabatan.jabatan}</p>
          </div>
        </div>

        <div class="pengurus-members ${isMultiple ? 'pengurus-members--grid' : ''}">
          ${avatarHtml}
        </div>
      </div>`
  }).join('')
}

/**
 * renderLocationList()
 * Merender daftar lokasi di sidebar peta (#locationList)
 * dan mengisi opsi lokasi di form pendaftaran (#preferredLocation)
 */
function renderLocationList() {
  const list = document.getElementById('locationList')
  const select = document.getElementById('preferredLocation')

  if (list) {
    list.innerHTML = lokasiData.map(loc => {
      // Ambil jadwal untuk lokasi ini
      const schedules = jadwalData.filter(j => j.lokasi_id === loc.id)
      const jadwalText = schedules.map(j => `${j.hari} ${j.jam}`).join(' | ')

      return `
        <div class="location-item" data-lat="${loc.koordinat[0]}" data-lng="${loc.koordinat[1]}" data-id="${loc.id}">
          <!-- data-* attributes digunakan JS untuk fokus peta ke lokasi ini saat diklik -->
          <span class="location-item__name">
            <i class="fa-solid fa-location-dot" style="color:var(--clr-red);margin-right:6px;"></i>
            ${loc.nama_tempat}
          </span>
          <span class="location-item__addr">${loc.alamat}</span>
          <span class="location-item__schedule">${jadwalText || 'Jadwal menyusul'}</span>
        </div>`
    }).join('')
  }

  // Isi opsi select form pendaftaran dengan nama-nama lokasi
  if (select) {
    lokasiData.forEach(loc => {
      const option = document.createElement('option') // Buat elemen <option> baru
      option.value = loc.id       // Value yang dikirim saat form submit
      option.textContent = loc.nama_tempat // Teks yang tampil
      select.appendChild(option)  // Tambahkan ke dalam <select>
    })
  }
}
