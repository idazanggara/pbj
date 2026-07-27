/**
 * instagram.js — Feed Instagram @pushbikejakarta di section #instagram
 *
 * CARA KERJA (2 mode):
 *
 * 1. MODE OTOMATIS (feed selalu ter-update mengikuti Instagram)
 *    Instagram tidak mengizinkan website mengambil postingan secara anonim,
 *    jadi kita pakai layanan feed pihak ketiga (gratis): https://behold.so
 *    Langkah setup (± 10 menit, sekali saja, oleh pemilik akun IG):
 *      a. Daftar di behold.so, login dengan akun Instagram @pushbikejakarta
 *      b. Buat feed baru bertipe "JSON"
 *      c. Salin URL feed yang diberikan, tempel ke INSTAGRAM_FEED_URL di bawah
 *    Setelah itu postingan terbaru tampil & ter-update otomatis di website.
 *
 * 2. MODE FALLBACK (sebelum feed URL diisi / saat fetch gagal)
 *    Grid menampilkan kartu ajakan follow yang mengarah ke profil IG,
 *    jadi section tidak pernah tampak rusak atau kosong.
 */

/* ================================================================
   KONFIGURASI
   (URL feed diatur di config.js → INSTAGRAM_FEED_URL, satu tempat
   dengan pengaturan Google Drive & Sheets)
   ================================================================ */
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/pushbikejakarta/'
const INSTAGRAM_USERNAME = '@pushbikejakarta'

// Jumlah maksimal postingan yang ditampilkan di grid
const INSTAGRAM_MAX_POSTS = 8

/* ================================================================
   RENDER GRID
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('instagramGrid')
  if (!grid) return // Section tidak ada di halaman ini

  // GUARD: cek typeof dulu, bukan langsung `!INSTAGRAM_FEED_URL`. Variabel ini
  // didefinisikan di config.js yang harus dimuat SEBELUM instagram.js (lihat
  // urutan <script> di index.html) — kalau config.js gagal dimuat atau nama
  // variabelnya berubah, `!INSTAGRAM_FEED_URL` saja akan melempar ReferenceError
  // dan mematikan seluruh file ini. Pola yang sama dipakai events.js:25-29.
  const isConfigured = typeof INSTAGRAM_FEED_URL !== 'undefined' && INSTAGRAM_FEED_URL
  if (!isConfigured) {
    renderInstagramFallback(grid)
    return
  }

  fetchInstagramPosts()
    .then(posts => {
      if (posts.length > 0) {
        renderInstagramPosts(grid, posts)
      } else {
        renderInstagramFallback(grid)
      }
    })
    .catch(error => {
      // Jangan biarkan section rusak hanya karena feed bermasalah
      console.warn('Feed Instagram tidak dapat dimuat:', error)
      renderInstagramFallback(grid)
    })
})

/**
 * fetchInstagramPosts()
 * Mengambil daftar postingan dari feed JSON (Behold).
 * @returns {Promise<Array<{permalink: string, imageUrl: string, caption: string, isVideo: boolean}>>}
 */
async function fetchInstagramPosts() {
  const response = await fetchWithTimeout(INSTAGRAM_FEED_URL)
  if (!response.ok) {
    throw new Error(`Feed merespons dengan status ${response.status}`)
  }

  const data = await response.json()
  // Behold bisa mengembalikan array langsung atau objek { posts: [...] }
  const rawPosts = Array.isArray(data) ? data : (data.posts || [])

  // Saring dulu yang valid, BARU dipotong: kalau dipotong duluan,
  // postingan tanpa gambar ikut menghabiskan jatah 8 slot grid
  return rawPosts
    .map(post => normalizeInstagramPost(post))
    .filter(post => post.permalink && post.imageUrl)
    .slice(0, INSTAGRAM_MAX_POSTS)
}

/**
 * normalizeInstagramPost(post)
 * Menyeragamkan satu item feed ke bentuk yang dipakai renderer,
 * tanpa memodifikasi objek aslinya.
 */
function normalizeInstagramPost(post) {
  const isVideo = post.mediaType === 'VIDEO' || post.mediaType === 'REEL'
  const isCarousel = post.mediaType === 'CAROUSEL_ALBUM'

  // Urutan prioritas gambar: ukuran medium (hemat kuota) → thumbnail
  // (untuk video) → media asli.
  const imageUrl =
    (post.sizes && post.sizes.medium && post.sizes.medium.mediaUrl) ||
    post.thumbnailUrl ||
    post.mediaUrl ||
    ''

  return {
    permalink: post.permalink || '',
    imageUrl,
    caption: post.prunedCaption || post.caption || 'Postingan Instagram Pushbike Jakarta',
    isVideo,
    isCarousel
  }
}

/**
 * badgeForPostType(post)
 * Ikon kecil penanda jenis media di pojok kartu:
 * ▶ untuk video/reel, ikon tumpukan foto untuk carousel.
 */
function badgeForPostType(post) {
  if (post.isVideo) {
    return '<span class="instagram-card__type" aria-hidden="true"><i class="fa-solid fa-play"></i></span>'
  }
  if (post.isCarousel) {
    return '<span class="instagram-card__type" aria-hidden="true"><i class="fa-solid fa-images"></i></span>'
  }
  return ''
}

/**
 * renderInstagramPosts(grid, posts)
 * Merender kartu postingan. Klik kartu = buka postingan di Instagram.
 */
function renderInstagramPosts(grid, posts) {
  grid.innerHTML = posts.map(post => `
    <a class="instagram-card" href="${escapeAttr(post.permalink)}"
      target="_blank" rel="noopener"
      aria-label="Buka postingan Instagram Pushbike Jakarta">
      <img src="${escapeAttr(post.imageUrl)}"
        alt="${escapeAttr(truncateText(post.caption, 100))}"
        loading="lazy" />
      <span class="instagram-card__overlay" aria-hidden="true">
        <i class="fa-brands fa-instagram"></i>
      </span>
      ${badgeForPostType(post)}
    </a>`).join('')
}

/**
 * renderInstagramFallback(grid)
 * Tampilan pengganti saat feed belum dikonfigurasi / gagal dimuat:
 * satu kartu lebar berisi ajakan follow, tetap selaras dengan desain.
 */
function renderInstagramFallback(grid) {
  grid.innerHTML = `
    <a class="instagram-fallback" href="${INSTAGRAM_PROFILE_URL}" target="_blank" rel="noopener">
      <i class="fa-brands fa-instagram instagram-fallback__icon" aria-hidden="true"></i>
      <span class="instagram-fallback__title">Lihat postingan terbaru kami di Instagram</span>
      <span class="instagram-fallback__handle">${INSTAGRAM_USERNAME}</span>
    </a>`
}

/* ================================================================
   UTILITAS KECIL
   (escapeAttr/escapeHtml dipakai dari config.js)
   ================================================================ */

/**
 * truncateText(text, maxLength)
 * Potong teks panjang untuk atribut alt agar tetap ringkas.
 */
function truncateText(text, maxLength) {
  const cleaned = String(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1)}…`
}
