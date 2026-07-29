# Struktur Data (Google Sheets) — Pushbike Jakarta

Dokumen ini menjelaskan **struktur data** yang dibaca website PBJ dari **Google Sheets**.
Website statis (tanpa server/database) membaca tiap Sheet lewat **endpoint gviz** Google
(`.../gviz/tq?tqx=out:json&headers=1`) langsung dari browser — **tanpa API key**.

> "CRUD"-nya = admin **tambah / edit / hapus baris** di Google Sheets memakai 1 akun
> Google → website otomatis ikut berubah, **tanpa ubah kode / deploy**.

Pasangan dokumen ini: **[STRUKTUR-GDRIVE.md](STRUKTUR-GDRIVE.md)** (struktur folder galeri Drive).

---

## Aturan umum semua Sheet

1. **Baris pertama = judul kolom.** Urutan kolom **BEBAS** — dipetakan lewat **nama header**,
   bukan posisi.
2. **Header di-normalisasi**: huruf kecil, tanpa spasi. Jadi `Link Info`, `LinkInfo`, dan
   `linkinfo` dianggap sama. Kolom ekstra yang tidak dikenal diabaikan (aman).
3. **Wajib share tiap Sheet**: File → Bagikan → **"Anyone with the link: Viewer"**.
4. **Fail-safe**: kalau ID Sheet kosong / sheet kosong / fetch gagal, website pakai tampilan
   **fallback** aman — tidak pernah tampak rusak.
5. Nilai sel diambil dari **`.f` (terformat, mis. tanggal)**, fallback ke `.v` (mentah).

---

## 1. Sheet EVENT / RACE (`EVENTS_SHEET_ID`)

Kolom (baris pertama = judul kolom):

```
Nama | Tanggal | Lokasi | Kategori | Deskripsi | LinkInfo | LinkMedia | Status
```

| Kolom | Isi | Catatan |
|---|---|---|
| **Nama** | Judul event | **Wajib** — baris tanpa Nama diabaikan |
| **Tanggal** | Teks bebas: `2026-07-12` atau `Minggu, 12 Juli 2026` | Dipakai untuk **urut DESC** |
| **Lokasi** | Teks lokasi | Opsional |
| **Kategori** | mis. `Race`, `Fun Race`, `Latber Akbar` | Jadi label di kartu |
| **Deskripsi** | Teks singkat | Opsional |
| **LinkInfo** | URL pendaftaran / poster / info | Opsional. **Boleh tanpa `https://`** (mis. `bit.ly/xxx`) → otomatis dilengkapi |
| **LinkMedia** | URL foto & video | Opsional. Lihat perilaku di bawah |
| **Status** | `upcoming` atau `selesai` | Menentukan badge & gaya kartu |

### Contoh isi

| Nama | Tanggal | Lokasi | Kategori | Deskripsi | LinkInfo | LinkMedia | Status |
|---|---|---|---|---|---|---|---|
| Fun Race Anak | Minggu, 12 Juli 2026 | JIEP Pulomas | Fun Race | Balap seru buat kiddoz | bit.ly/daftar-funrace | https://www.instagram.com/reel/DbJHYBLzfZX/ | upcoming |
| Latber Akbar | 2026-06-14 | Senayan | Latber Akbar | Latihan bareng | | https://drive.google.com/drive/folders/xxxx | selesai |

### Perilaku tombol & tampilan

- **LinkInfo** → tombol **"Info & Daftar"**. Kosong → tombol tidak muncul.
- **LinkMedia** → tombol **"Foto & Video"**:
  - Kalau **post Instagram** (`instagram.com/p/…`, `/reel/…`, `/tv/…`) → membuka **POPUP/modal**
    berisi foto + caption post (embed di dalam situs, tidak keluar).
  - Kalau **URL lain** (mis. folder Google Drive) → tombol jadi **link keluar** (tab baru).
  - Kosong → tombol tidak muncul.
- **Status**:
  - `upcoming` → badge **"Akan Datang"**.
  - `selesai` → badge **"Selesai"** + kartu ditampilkan lebih redup.

### Urutan tampil (otomatis)

1. **Tanggal terbaru paling depan** (DESC).
2. Tanggal sama → **`upcoming` dulu**, `selesai` di belakang.
3. Semuanya sama → **baris paling bawah** di sheet (paling baru ditambah) tampil lebih dulu.

---

## 2. Sheet GALERI PER LATIHAN (`GALLERY_SESSIONS_SHEET_ID`)

Kolom:

```
Tanggal | Sesi | Fotografer | LinkDrive
```

| Kolom | Isi | Catatan |
|---|---|---|
| **Tanggal** | `YYYY-MM-DD` (mis. `2026-07-14`) | Ditampilkan apa adanya; dipakai urut DESC |
| **Sesi** | Nama sesi bebas | mis. `Latihan Pagi`, `Race Day` |
| **Fotografer** | Nama fotografer | Jadi **label tombol** |
| **LinkDrive** | URL folder Drive milik fotografer itu | **Wajib diawali `https://`** |

### Aturan penting

- **1 baris = 1 fotografer/folder.**
- Kalau **1 sesi difoto beberapa fotografer** → isi beberapa baris dengan **Tanggal + Sesi
  yang SAMA** → website otomatis menggabungkannya jadi **SATU kartu berisi banyak tombol**
  (satu tombol per fotografer).
- Baris tanpa Tanggal / Sesi / LinkDrive diabaikan. Link non-`http(s)` diabaikan (anti-typo).
- Urut **tanggal terbaru dulu** (DESC).

### Contoh isi

| Tanggal | Sesi | Fotografer | LinkDrive |
|---|---|---|---|
| 2026-07-14 | Latihan Pagi | Budi | https://drive.google.com/drive/folders/xxxx |
| 2026-07-14 | Latihan Pagi | Sari | https://drive.google.com/drive/folders/yyyy |
| 2026-07-20 | Race Day | Budi | https://drive.google.com/drive/folders/zzzz |

> Baris 1 & 2 (Tanggal+Sesi sama) → **1 kartu "Latihan Pagi"** berisi tombol **Budi** & **Sari**.

Foto tiap fotografer ada di folder Drive **milik fotografer sendiri** (di luar Drive PBJ) —
fotografer cukup share foldernya (`Anyone with the link: Viewer`) lalu tempel linknya ke
kolom **LinkDrive**. Website hanya **menautkan** ke folder itu (tidak menampilkan isinya di grid).

---

## 3. Sheet TOGGLE PENDAFTARAN MEMBER (`SETTINGS_SHEET_ID`)

Kolom:

```
Key | Value
```

Satu baris data:

| Key | Value |
|---|---|
| REGISTRATION_OPEN | TRUE |

- **`Value` = `TRUE` atau `1`** → pendaftaran **DIBUKA**: tombol CTA jadi "Daftar Member Baru"
  + blok FAQ berubah ke versi "sedang dibuka".
- **Selain itu** (`FALSE`, kosong, sheet/ID kosong, atau fetch gagal) → default **TUTUP**
  (tampilan bawaan di HTML).

> Berguna untuk buka/tutup pendaftaran **tanpa redeploy** — cukup ubah nilai di sheet.

---

## 4. Sumber data lain (BUKAN Google Sheet)

| Sumber | Konfigurasi | Keterangan |
|---|---|---|
| **Feed Instagram** | `INSTAGRAM_FEED_URL` | URL JSON **live** dari behold.so (auto-update, ber-CORS). Bukan sheet |
| **Form Pendaftaran** | `REGISTRATION_FORM_URL` | Link Google Form (`viewform`), ditampilkan via iframe di `daftar-member-baru.html` |
| **Galeri Kategori** | `DRIVE_GALLERY_FOLDER_ID` + `DRIVE_API_KEY` | Folder Google Drive — lihat **[STRUKTUR-GDRIVE.md](STRUKTUR-GDRIVE.md)** |
| **Nomor WA admin** | `ADMIN_WA_NUMBER` | Disebarkan otomatis ke tombol/teks WA & FAQ |

---

## 5. Pemetaan konfigurasi (di `js/config.js`)

| Konstanta | Sumber | Dibaca oleh |
|---|---|---|
| `EVENTS_SHEET_ID` | Google Sheet Event/Race | `js/events.js` |
| `GALLERY_SESSIONS_SHEET_ID` | Google Sheet Per Latihan | `js/gallery-sessions.js` |
| `SETTINGS_SHEET_ID` | Google Sheet Toggle Pendaftaran | `js/site-settings.js` |
| `DRIVE_GALLERY_FOLDER_ID` + `DRIVE_API_KEY` | Folder Drive Galeri Kategori | `js/gdrive-gallery.js` |
| `INSTAGRAM_FEED_URL` | JSON behold.so | `js/instagram.js` |
| `REGISTRATION_FORM_URL` | Google Form | `daftar-member-baru.html` |

---

## Catatan teknis untuk AI/pengembang lain

- **Cara baca Sheet**: endpoint gviz
  `https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json&headers=1`.
  Respons dibungkus `google.visualization.Query.setResponse(...)` → JSON diekstrak dari
  dalam tanda kurung. Tanpa API key (cukup sheet publik "Anyone with link: Viewer").
- **Pemetaan kolom by-name**: header di-`toLowerCase()` + buang spasi, lalu dicocokkan;
  urutan kolom bebas, boleh ada kolom tambahan.
- **Tanggal**: kolom "Tanggal" bisa teks ISO (`2026-07-14`) atau teks Indonesia
  (`Senin, 6 Juli 2026`, muncul kalau kolom sheet bertipe Date). Pengurutan memakai
  `parseTanggalId()` di `config.js` (JANGAN bandingkan sebagai string mentah — salah untuk
  format Indonesia).
- **Situs**: statis, no-build, vanilla JS, script global; helper bersama di `js/config.js`.
