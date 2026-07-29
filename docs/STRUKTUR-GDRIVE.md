# Struktur Folder Google Drive — Galeri Pushbike Jakarta

Dokumen ini menjelaskan **struktur folder Google Drive** yang dibaca otomatis oleh
website PBJ untuk section **Galeri**. Website statis (tanpa server) membaca Drive
lewat Google Drive API v3 dari sisi browser.

> Ringkasan 1 kalimat: Website membaca **1 folder induk Google Drive publik** berisi
> **subfolder-per-kategori** (nama subfolder = tombol filter, file di dalamnya = item
> galeri), **tepat 2 tingkat**. Mode "Per Latihan" terpisah — membaca Google Sheet
> berisi link ke folder Drive milik tiap fotografer.

---

## Ringkasan: ada 2 sistem galeri

| Mode | Sumber data | Struktur |
|---|---|---|
| **Kategori** | 1 folder induk Google Drive (Drive API) | Folder induk → subfolder kategori → file foto/video |
| **Per Latihan** | Google Sheet (BUKAN Drive API) | Sheet berisi link ke folder Drive milik tiap fotografer |

Bagian utama dokumen ini = **mode Kategori** (struktur folder Drive PBJ).
Mode Per Latihan ada di bagian 3.

---

## 1. Struktur folder — Galeri Kategori

```
📁 Galeri PBJ                          ← FOLDER INDUK (hanya 1)
│                                        Share: "Anyone with the link → Viewer"
│                                        ID folder → DRIVE_GALLERY_FOLDER_ID (config.js)
│
├── 📁 Latihan                         ← subfolder = KATEGORI (nama = tombol filter)
│   ├── 🖼️ latihan-jis-2026-01.jpg
│   ├── 🖼️ latihan-jis-2026-02.jpg
│   └── 🎬 latihan-senayan.mp4
│
├── 📁 Race
│   ├── 🖼️ race-day-final-01.jpg
│   └── 🎬 race-highlight.mp4
│
├── 📁 Prestasi
│   └── 🖼️ juara-nasional-2026.jpg
│
└── 📁 (kategori lain — bebas tambah)   ← otomatis jadi tombol filter baru
```

### Aturan WAJIB

1. **Tepat 2 tingkat.** Folder induk → subfolder kategori → **file langsung**.
   JANGAN buat sub-sub-folder di dalam kategori — isinya tidak akan terpindai.
   (Website hanya membaca: subfolder di dalam induk, lalu file di dalam tiap subfolder.)
2. **Nama subfolder = label tombol filter** di website, persis apa adanya
   (diurutkan A–Z). Contoh subfolder `Race` → tombol filter "Race".
3. **Isi file hanya foto atau video** (`image/*` atau `video/*`). File lain
   (PDF, dsb.) diabaikan.
4. **Tambah kategori = cukup buat subfolder baru.** Tombol filter baru muncul
   otomatis, tanpa ubah kode / deploy.
5. **Cukup share FOLDER INDUK** sebagai "Anyone with the link: Viewer". Semua
   subfolder & file di dalamnya ikut publik otomatis.

### Caption tiap media

- Website memakai **kolom "Deskripsi" (Description) file di Drive** sebagai caption.
  (Klik kanan file → Lihat detail → isi Description.)
- Kalau Description kosong → caption otomatis dari **nama file**: ekstensi dibuang,
  tanda `-` / `_` jadi spasi. Contoh: `race-day-final-01.jpg` → "race day final 01".
- **Saran:** beri nama file deskriptif, atau isi Description, biar caption rapi.

### Urutan & jumlah

- Media ditampilkan **terbaru dulu** (berdasarkan waktu upload / createdTime).
- Tidak ada batas praktis jumlah file (diambil bertahap 100 per putaran, semua terambil).

---

## 2. Cara menghubungkan ke website (sekali saja)

1. Buat folder induk (mis. "Galeri PBJ") + subfolder kategori seperti struktur di atas.
2. Klik kanan folder induk → **Bagikan / Share** → ubah ke
   **"Siapa saja yang memiliki link" → Pelihat (Viewer)**.
3. Ambil **ID folder** dari URL:
   `https://drive.google.com/drive/folders/`**`<INI_ID_FOLDER>`**
4. Tempel ID itu ke **`DRIVE_GALLERY_FOLDER_ID`** di `js/config.js`.
5. `DRIVE_API_KEY` sudah terisi di `config.js` (API key Google Drive, gratis,
   dibatasi ke Drive API + domain web).

Setelah itu: **upload foto/video ke subfolder = langsung tampil di web**
(tanpa ubah kode / deploy).

---

## 3. Galeri "Per Latihan" — folder fotografer (TERPISAH)

Mode ini **tidak** memakai folder "Galeri PBJ". Foto tiap sesi latihan ada di folder
Drive **milik fotografer masing-masing** (di luar Drive PBJ), jadi didaftarkan lewat
**Google Sheet**, bukan dipindai Drive API.

### Google Sheet (`GALLERY_SESSIONS_SHEET_ID`)

Baris pertama = judul kolom, persis urutan ini:

| Tanggal | Sesi | Fotografer | LinkDrive |
|---|---|---|---|
| 2026-07-14 | Latihan Pagi | Budi | https://drive.google.com/drive/folders/xxxx |
| 2026-07-14 | Latihan Pagi | Sari | https://drive.google.com/drive/folders/yyyy |
| 2026-07-20 | Race Day | Budi | https://drive.google.com/drive/folders/zzzz |

- **Tanggal** : format `YYYY-MM-DD`.
- **Sesi** : nama sesi bebas (mis. "Latihan Pagi", "Race Day").
- **Fotografer** : nama fotografer → jadi label tombol.
- **LinkDrive** : URL folder Drive milik fotografer itu (wajib diawali `https://`).
- **1 baris = 1 folder/fotografer.** Kalau 1 sesi (Tanggal + Sesi SAMA) punya 3
  fotografer → isi 3 baris dengan Tanggal + Sesi yang sama → website otomatis
  menggabungkannya jadi 1 kartu berisi 3 tombol.

### Yang perlu dilakukan fotografer

1. Fotografer share **folder Drive-nya sendiri** → "Anyone with the link: Viewer".
2. Salin link folder itu → tempel ke kolom **LinkDrive** di Sheet.

Website hanya **menautkan** (link-out) ke folder itu — tidak menampilkan isinya
langsung di grid.

---

## 4. Pemetaan konfigurasi (di `js/config.js`)

| Konstanta | Isi | Untuk |
|---|---|---|
| `DRIVE_GALLERY_FOLDER_ID` | ID folder induk "Galeri PBJ" | Galeri **Kategori** |
| `DRIVE_API_KEY` | API key Google Drive (sudah terisi) | Galeri **Kategori** |
| `GALLERY_SESSIONS_SHEET_ID` | ID Google Sheet sesi latihan | Galeri **Per Latihan** |
| `EVENTS_SHEET_ID` | ID Google Sheet event/race | Section Event (bukan galeri) |

> Kalau salah satu kosong / gagal dimuat, website otomatis pakai galeri lokal
> bawaan (fallback) — tidak pernah tampak rusak.

---

## Catatan untuk AI/pengembang lain

- Situs **statis, no-build, vanilla JS** — Drive/Sheet dibaca client-side, tidak ada
  server/database.
- Mode Kategori memindai **hanya 1 tingkat subfolder** di bawah folder induk
  (query `'{FOLDER_INDUK}' in parents`), lalu file di tiap subfolder
  (`'{SUBFOLDER}' in parents`). Struktur lebih dalam diabaikan.
- Thumbnail dipakai dari `https://drive.google.com/thumbnail?id=<FILE_ID>` — cukup
  file publik, tanpa API key.
- Logika terkait: `js/gdrive-gallery.js` (mode Kategori), `js/gallery-sessions.js`
  (mode Per Latihan), konfigurasi di `js/config.js`.
