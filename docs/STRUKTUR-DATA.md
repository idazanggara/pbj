# Struktur Data (Google Sheets) — Pushbike Jakarta

Dokumen ini menjelaskan **struktur data** yang dibaca website PBJ dari **Google Sheets**.
Website statis (tanpa server/database) membaca tiap Sheet lewat **endpoint gviz** Google
(`.../gviz/tq?tqx=out:json&headers=1`) langsung dari browser — **tanpa API key**.

> "CRUD"-nya = admin **tambah / edit / hapus baris** di Google Sheets memakai 1 akun
> Google → website otomatis ikut berubah, **tanpa ubah kode / deploy**.

Pasangan dokumen ini: **[STRUKTUR-GDRIVE.md](STRUKTUR-GDRIVE.md)** (struktur folder galeri Drive).

**Sejak 30 Juli 2026: SATU spreadsheet, EMPAT tab.** Sebelumnya Event, Galeri Per Latihan,
dan Pengaturan Situs adalah 3 file terpisah — sekarang semua digabung jadi 1 file bernama
`PBJ - Pengaturan Situs` (ID `1cm0iEcJnBNxUYto7mpyMz05SfDh_NwjW2KTUka6SO_o`), dibedakan
lewat tab (parameter `&gid=` di endpoint gviz):

| Tab | gid | Konstanta gid di `config.js` | Isi |
|---|---|---|---|
| Registration | `0` | `SETTINGS_SHEET_GID` | Toggle pendaftaran + link Form |
| Config | `845332613` | `CONFIG_SHEET_GID` | Nomor WA admin (bisa disembunyikan) |
| Event & Race PBJ | `682739686` | `EVENTS_SHEET_GID` | Data event/race |
| Galeri per Latihan | `1110534419` | `GALLERY_SESSIONS_SHEET_GID` | Link folder foto per sesi |

---

## Aturan umum semua Sheet

1. **Baris pertama = judul kolom.** Urutan kolom **BEBAS** — dipetakan lewat **nama header**,
   bukan posisi.
2. **Header di-normalisasi**: huruf kecil, tanpa spasi. Jadi `Link Info`, `LinkInfo`, dan
   `linkinfo` dianggap sama. Kolom ekstra yang tidak dikenal diabaikan (aman).
3. **Wajib share Sheet ini SEKALI** (berlaku ke semua tab): File → Bagikan → **"Anyone with
   the link: Viewer"**.
4. **Fail-safe**: kalau ID Sheet kosong / sheet kosong / fetch gagal, website pakai tampilan
   **fallback** aman — tidak pernah tampak rusak.
5. Nilai sel diambil dari **`.f` (terformat, mis. tanggal)**, fallback ke `.v` (mentah).
6. **`&gid=` WAJIB eksplisit di setiap fetch** (bukan andalkan "tab pertama/default") —
   endpoint gviz tanpa `&gid=` mengembalikan tab yang PALING KIRI secara posisi, BUKAN
   selalu gid=0. Insiden nyata 30 Juli 2026: tab "Galeri per Latihan" sempat digeser ke
   posisi terdepan, dan kode yang belum pakai `&gid=` eksplisit langsung salah baca data.
   Semua fetch di kodebase ini (`events.js`, `gallery-sessions.js`, `site-settings.js`)
   sudah diperbaiki memakai gid eksplisit — **jangan hapus parameter ini saat refactor**.

---

## 1. Tab EVENT & RACE PBJ (`EVENTS_SHEET_ID` + `EVENTS_SHEET_GID`)

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

## 2. Tab GALERI PER LATIHAN (`GALLERY_SESSIONS_SHEET_ID` + `GALLERY_SESSIONS_SHEET_GID`)

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

## 3. Tab PENGATURAN SITUS (`SETTINGS_SHEET_ID`) — Registration + Config

Dua tab pengaturan di spreadsheet gabungan yang sama dengan Event & Galeri di atas:

### Tab "Registration" (gid=0 — TERLIHAT, boleh dibagikan ke kolaborator lain)

Kolom:

```
Key | Value
```

| Key | Value |
|---|---|
| REGISTRATION_OPEN | TRUE |
| REGISTRATION_FORM_URL | https://docs.google.com/forms/d/e/xxxxx/viewform |

- **`REGISTRATION_OPEN` = `TRUE`/`1`** → pendaftaran **DIBUKA**: tombol CTA jadi "Daftar
  Member Baru" + blok FAQ berubah ke versi "sedang dibuka". Selain itu (`FALSE`, kosong,
  sheet/ID kosong, atau fetch gagal) → default **TUTUP** (tampilan bawaan di HTML).
- **`REGISTRATION_FORM_URL`** = link publik Google Form (`viewform`) yang ditampilkan via
  iframe di `register.html`. Kosong/fetch gagal → fallback ke konstanta
  `REGISTRATION_FORM_URL` di `config.js`.

### Tab "Config" (gid = `CONFIG_SHEET_GID`, opsional — bisa DISEMBUNYIKAN dari kolaborator lain)

Kolom BEDA dari tab Registration — `Key | Value 1 | Value 2` (bukan `Key | Value`
biasa), sengaja terpisah tab supaya bisa di-hide (klik kanan tab → Sembunyikan sheet)
dari orang yang cuma perlu akses ke tab Registration. Sejak 30 Juli 2026 menampung
**DUA** kontak WA admin (sebelumnya cuma 1) — Value 1 = admin 1, Value 2 = admin 2,
supaya tidak perlu key berakhiran `_2`:

| Key | Value 1 | Value 2 |
|---|---|---|
| ADMIN_WA_NAME | Arif | Bastian |
| ADMIN_WA_NUMBER | 6285167017848 | 6287895701681 |

- **`ADMIN_WA_NAME`/`ADMIN_WA_NUMBER`** = nama & nomor WA (kolom Value 1 = admin 1,
  Value 2 = admin 2), disebarkan `main.js`/`register.html` ke tombol/teks WA & FAQ
  (2 tombol di footer, halaman bantuan pendaftaran). Nomor admin 1 (Value 1) JUGA
  satu-satunya yang dipakai link WA otomatis setelah submit Form Pendaftaran (proses
  otomatis, tidak bisa menawarkan 2 pilihan).
- Kolom Value 2 boleh kosong — website otomatis pakai cadangan admin 2 dari kode.
- Kosong/`CONFIG_SHEET_GID` belum diisi/fetch gagal → fallback ke konstanta `ADMIN_WA_*`
  di `config.js`.
- Dibaca lewat **CSV export** (`/export?format=csv`), BUKAN endpoint gviz seperti tab
  Registration — gviz salah menebak kolom Value sebagai kolom angka (isinya campur nama
  & nomor WA), yang bikin nama admin (teks) diam-diam hilang di respons gviz. Lihat
  `fetchAdminWaContactsCsv()` di `js/site-settings.js`.

> Kedua tab: berguna untuk ubah pengaturan **tanpa redeploy** — cukup ubah nilai di sheet.

---

## 4. Sumber data lain (BUKAN Google Sheet)

| Sumber | Konfigurasi | Keterangan |
|---|---|---|
| **Feed Instagram** | `INSTAGRAM_FEED_URL` | URL JSON **live** dari behold.so (auto-update, ber-CORS). SATU-SATUNYA yang murni di `config.js`, sengaja TIDAK dipindah ke Sheet — jaga stabilitas |
| **Galeri Kategori** | `DRIVE_GALLERY_FOLDER_ID` + `DRIVE_API_KEY` | Folder Google Drive — lihat **[STRUKTUR-GDRIVE.md](STRUKTUR-GDRIVE.md)** |

---

## 5. Pemetaan konfigurasi (di `js/config.js`)

Semua `*_SHEET_ID` di bawah bernilai SAMA (`1cm0iEcJnBNxUYto7mpyMz05SfDh_NwjW2KTUka6SO_o`)
— 1 spreadsheet, dibedakan lewat `*_GID` masing-masing.

| Konstanta | Sumber utama | Dibaca oleh |
|---|---|---|
| `EVENTS_SHEET_ID` + `EVENTS_SHEET_GID` | Tab "Event & Race PBJ" (gid `682739686`) | `js/events.js` |
| `GALLERY_SESSIONS_SHEET_ID` + `GALLERY_SESSIONS_SHEET_GID` | Tab "Galeri per Latihan" (gid `1110534419`) | `js/gallery-sessions.js` |
| `SETTINGS_SHEET_ID` + `SETTINGS_SHEET_GID` | Tab "Registration" (gid `0`) | `js/site-settings.js` |
| `CONFIG_SHEET_GID` | Tab "Config" tersembunyi (gid `845332613`) | `js/site-settings.js` |
| `DRIVE_GALLERY_FOLDER_ID` + `DRIVE_API_KEY` | Folder Drive Galeri Kategori (BUKAN Sheet) | `js/gdrive-gallery.js` |
| `INSTAGRAM_FEED_URL` | JSON behold.so (satu-satunya yg BUKAN fallback — ini sumber utama, BUKAN Sheet) | `js/instagram.js` |
| `REGISTRATION_FORM_URL` | FALLBACK darurat (sumber utama: sel Sheet tab Registration) | `js/site-settings.js` |
| `ADMIN_WA_NAME`/`ADMIN_WA_NUMBER`/`ADMIN_WA_NAME_2`/`ADMIN_WA_NUMBER_2` | FALLBACK darurat, 2 kontak (sumber utama: sel Sheet tab Config) | `js/site-settings.js`, `js/main.js` |

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
