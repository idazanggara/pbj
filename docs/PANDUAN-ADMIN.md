# Panduan Admin Website Pushbike Jakarta

> **Untuk siapa panduan ini?** Untuk pengurus PBJ yang ditunjuk mengelola isi website.
> Tidak perlu bisa coding. Kalau bisa memakai Google Drive dan Google Sheets
> (seperti memakai WhatsApp atau email), Anda pasti bisa.
>
> **Apa yang dikelola dari sini?**
> 1. **Galeri** foto & video di website (lewat Google Drive)
> 2. **Daftar Event / Race** di website (lewat Google Sheets)
>
> **Prinsip kerjanya sederhana:** website membaca isi folder Google Drive dan
> Google Sheet milik PBJ. Jadi kalau Anda upload foto atau menambah baris event,
> website otomatis ikut berubah. Tidak perlu menyentuh kode sama sekali.

---

> ### 📌 Update 30 Juli 2026 — Sheet digabung jadi 1 file
> Bagian B–E di bawah menjelaskan setup ASLI (3 file Google Sheet terpisah).
> **Sejak 30 Juli 2026, ketiganya (Event & Race, Galeri Per Latihan, Pengaturan
> Situs) sudah digabung jadi SATU file bernama `PBJ - Pengaturan Situs`**, cuma
> beda TAB. Struktur & isi kolom di tiap tab **tidak berubah** — Bagian B-E di
> bawah tetap valid untuk PANDUAN ISI KOLOM, cuma abaikan instruksi "buat sheet
> baru terpisah". Untuk struktur terkini yang selalu up-to-date, lihat
> **[STRUKTUR-DATA.md](STRUKTUR-DATA.md)**. Pemakaian sehari-hari (Bagian F)
> dan toggle pendaftaran (Bagian I/J) sudah disesuaikan mengikuti struktur baru.

---

## Bagian A. Persiapan (dibaca dulu)

Yang Anda butuhkan:

1. **Satu akun Google resmi PBJ** (misalnya `pushbikejakarta@gmail.com`).
   Semua langkah di bawah dikerjakan sambil login dengan akun ini.
   Jangan pakai akun pribadi, supaya kalau pengurus berganti, cukup serahkan
   password akun ini ke pengurus baru.
2. Laptop atau komputer (lebih mudah daripada HP untuk setting awal).
3. Waktu kurang lebih 30 sampai 45 menit, cukup sekali saja.

Setting awal ini terbagi 4 langkah besar:

| Langkah | Apa yang dibuat | Untuk apa |
|---|---|---|
| B | Folder Google Drive | Tempat menyimpan foto & video galeri |
| C | "Kunci API" Google | Izin supaya website boleh membaca folder itu |
| D | Google Sheet | Tempat daftar event / race |
| E | Menempel 3 kode ke website | Menghubungkan semuanya |

Langkah B, C, D bisa dikerjakan siapa saja. Langkah E butuh akses ke file
website, biasanya dikerjakan tim tech (cukup copy-paste 3 baris).

---

## Bagian B. Membuat Folder Galeri di Google Drive

### B1. Buat folder induk

1. Buka [drive.google.com](https://drive.google.com), pastikan sudah login
   dengan akun Google PBJ.
2. Klik tombol **+ Baru** (atau **+ New**) di kiri atas, pilih **Folder baru**.
3. Beri nama: `Galeri PBJ`, lalu klik **Buat**.

### B2. Buat subfolder kategori di dalamnya

1. Klik dua kali folder `Galeri PBJ` untuk membukanya.
2. Di dalamnya, buat 3 folder baru dengan cara yang sama:
   - `Latihan`
   - `Lomba`
   - `Prestasi`

> **Penting untuk dipahami:** nama subfolder ini otomatis menjadi tombol
> filter di website. Kalau suatu saat mau menambah kategori baru, misalnya
> `Family Gathering`, cukup buat subfolder baru bernama itu. Tidak perlu
> lapor ke tim tech.

### B3. Bagikan folder supaya bisa dibaca website

1. Kembali ke halaman utama Drive, **klik kanan** folder `Galeri PBJ`.
2. Pilih **Bagikan** (atau **Share**).
3. Di bagian bawah jendela yang muncul, ada tulisan **Akses umum**
   (General access). Ubah dari "Dibatasi" menjadi
   **"Siapa saja yang memiliki link"** (Anyone with the link).
4. Pastikan perannya **Pelihat / Viewer** (BUKAN Editor).
5. Klik **Selesai**.

> Artinya: siapa pun (termasuk website) boleh MELIHAT isi folder,
> tapi hanya akun PBJ yang bisa menambah atau menghapus foto. Aman.

### B4. Salin "ID folder" (ini kode pertama yang dibutuhkan)

1. Klik dua kali folder `Galeri PBJ` untuk membukanya.
2. Lihat alamat di bagian atas browser. Bentuknya seperti ini:

   ```
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```

3. Bagian setelah `folders/` itulah **ID folder**. Pada contoh di atas:
   `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
4. Blok tulisan itu, salin (Ctrl+C atau Cmd+C), lalu tempel sementara di
   catatan (Notes / WhatsApp ke diri sendiri) dengan label **"ID FOLDER GALERI"**.

### B5. Coba upload beberapa foto

Masuk ke subfolder `Latihan`, lalu tarik (drag) beberapa foto latihan ke situ.
Nanti setelah semua setting selesai, foto ini langsung tampil di website.

> **Tips caption:** tulisan di bawah foto di website diambil dari nama file.
> `latihan-perdana-si-kecil.jpg` akan tampil sebagai "latihan perdana si kecil".
> Jadi beri nama file yang enak dibaca. Kalau mau caption khusus, klik kanan
> file di Drive, pilih **Info file**, lalu isi kolom **Deskripsi**.

---

## Bagian C. Membuat "Kunci API" Google

Ini bagian yang kelihatannya paling teknis, tapi sebenarnya cuma klik-klik.
Anggap saja Anda sedang membuat "kartu izin masuk" supaya website boleh
membaca folder Drive tadi. Gratis, tidak perlu kartu kredit.

1. Buka [console.cloud.google.com](https://console.cloud.google.com),
   login dengan akun Google PBJ.
2. Kalau pertama kali, akan muncul halaman persetujuan. Centang setuju,
   klik **Agree and Continue**.
3. Di bagian atas halaman ada tulisan **Select a project**. Klik itu,
   lalu klik **New Project** di kanan atas jendela yang muncul.
4. Isi nama project: `website-pushbikejakarta`, lalu klik **Create**.
   Tunggu sebentar, lalu pastikan project itu yang terpilih di bagian atas.
5. Sekarang aktifkan izin Drive:
   - Di kotak pencarian paling atas, ketik: `Google Drive API`, tekan Enter.
   - Klik hasil bernama **Google Drive API**.
   - Klik tombol biru **Enable** (Aktifkan). Tunggu sampai selesai.
6. Buat kuncinya:
   - Di kotak pencarian atas, ketik: `Credentials`, pilih
     **Credentials (APIs & Services)**.
   - Klik **+ Create Credentials** di bagian atas, pilih **API key**.
   - Muncul jendela **"Create API key"**. Isi langsung di jendela ini
     (jangan klik Create dulu sebelum 2 pembatasan di bawah diisi):
     - **Name**: beri nama, misal `pushbikejakarta-web-drive`.
     - **Select API restrictions**: pilih **hanya "Google Drive API"**.
     - **"Authenticate API calls through a service account"**: JANGAN dicentang.
     - **Application restrictions**: pilih **Websites**, klik **Add**,
       isi persis: `www.pushbikejakarta.com/*`
       (kalau mau tes lokal dulu, tambahkan juga `localhost:8000/*`).
   - Klik **Create**. Muncul kode panjang, contohnya
     `AIzaSyB1234567890abcdefghijklmnop`. Salin, simpan di catatan
     dengan label **"KUNCI API"**.
7. **(Sangat disarankan) Batasi kuota harian** supaya kalau kunci
   disalahgunakan orang lain, dampaknya cuma "galeri berhenti sementara",
   bukan tagihan: buka **APIs & Services → Google Drive API → Quotas**,
   set batas request harian yang wajar.

> **Sudah dikerjakan (27 Juli 2026).** Setup di atas sudah selesai untuk
> project **`website-pushbikejakarta`** (project number `765706601825`).
> Kunci API sudah terpasang di `config.js` dan pembatasan referrer-nya
> sudah diverifikasi aktif (kunci hanya jalan dari domain website PBJ).
> Bagian C ini disimpan sebagai rujukan bila kunci perlu dibuat ulang
> atau pengurus berganti.

> **PENTING soal referrer:** alamat di Application restrictions harus
> PERSIS sama dengan domain website yang aktif (`www.pushbikejakarta.com`).
> Kalau salah ketik atau domain berubah (mis. pindah ke `pushbikejakarta.org`),
> galeri Drive akan kosong walau semua yang lain benar — perbarui daftar
> referrer di Credentials.

> **Perlu diketahui:** kunci API ini memang akan terlihat di kode website,
> dan itu tidak apa-apa. Kunci ini hanya bisa dipakai untuk MEMBACA file
> yang memang sudah publik. Dengan pembatasan di langkah 7, kunci ini
> bahkan hanya berfungsi dari website PBJ saja.

---

## Bagian D. Membuat Google Sheet untuk Event / Race

### D1. Buat sheet dan judul kolomnya

1. Buka [sheets.google.com](https://sheets.google.com), login akun PBJ.
2. Klik **+ Blank** (Kosong) untuk membuat spreadsheet baru.
3. Beri nama file (klik "Untitled spreadsheet" di kiri atas): `Event PBJ`.
4. Di **baris paling atas (baris 1)**, isi 8 kolom ini persis
   (satu kata per kotak, dari kiri ke kanan):

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | Nama | Tanggal | Lokasi | Kategori | Deskripsi | LinkInfo | LinkMedia | Status |

> Penulisan judul kolom bebas huruf besar/kecil, tapi ejaannya harus sama
> (misalnya `LinkInfo`, bukan `Link Info` pakai spasi).

### D2. Isi contoh satu event

Di baris 2, coba isi seperti ini:

| Kolom | Contoh isi |
|---|---|
| Nama | Fun Race Pulomas Cup |
| Tanggal | Minggu, 20 September 2026 |
| Lokasi | JIEP Pulomas, Jakarta Timur |
| Kategori | Fun Race |
| Deskripsi | Race santai untuk semua member, kelas per tahun kelahiran. |
| LinkInfo | https://bit.ly/daftar-funrace (link poster/pendaftaran, boleh kosong) |
| LinkMedia | https://drive.google.com/... (link folder foto event, boleh kosong) |
| Status | upcoming |

Aturan kolom **Status**: tulis `upcoming` untuk event yang akan datang,
ganti menjadi `selesai` setelah event lewat (kartunya di website akan
berubah menjadi abu-abu dengan label "Selesai").

### D3. Bagikan sheet

1. Klik tombol **Share / Bagikan** di kanan atas.
2. Sama seperti folder tadi: ubah **Akses umum** menjadi
   **"Siapa saja yang memiliki link"**, peran **Pelihat / Viewer**.
3. Klik **Selesai**.

### D4. Salin ID sheet (kode ketiga)

Lihat alamat browser saat sheet terbuka:

```
https://docs.google.com/spreadsheets/d/1XyZaBcDeFgHiJkLmNo_PqRsTuV/edit#gid=0
```

Bagian di antara `/d/` dan `/edit` itulah **ID sheet**. Pada contoh:
`1XyZaBcDeFgHiJkLmNo_PqRsTuV`. Salin dan simpan di catatan dengan label
**"ID SHEET EVENT"**.

---

## Bagian E. Menghubungkan ke Website (copy-paste 3 kode)

Sekarang Anda punya 3 kode di catatan:

1. ID FOLDER GALERI (dari Bagian B4)
2. KUNCI API (dari Bagian C6)
3. ID SHEET EVENT (dari Bagian D4)

Langkah ini butuh akses ke file website, jadi biasanya dikerjakan tim tech.
Kirimkan 3 kode itu ke tim tech, atau kalau Anda punya aksesnya sendiri:

1. Buka file bernama **`config.js`** di folder website (bisa dengan aplikasi
   apa pun yang bisa mengedit teks, misalnya VS Code atau Notepad).
2. Cari 3 baris ini di bagian bawah file:

   ```js
   const DRIVE_API_KEY = ''
   const DRIVE_GALLERY_FOLDER_ID = ''
   const EVENTS_SHEET_ID = ''
   ```

3. Tempel masing-masing kode **di antara dua tanda kutip**, menjadi seperti:

   ```js
   const DRIVE_API_KEY = 'AIzaSyB1234567890abcdefghijklmnop'
   const DRIVE_GALLERY_FOLDER_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ'
   const EVENTS_SHEET_ID = '1XyZaBcDeFgHiJkLmNo_PqRsTuV'
   ```

4. Simpan file, lalu upload/deploy website seperti biasa.

**Selesai!** Buka website-nya dan periksa:

- Section **Galeri**: muncul tombol "Kategori | Folder", dan foto yang tadi
  di-upload ke subfolder `Latihan` sudah tampil.
- Section **Event**: event contoh "Fun Race Pulomas Cup" sudah tampil.

---

## Bagian F. Pemakaian Sehari-hari (setelah setting selesai)

Mulai dari sini, **tidak ada lagi urusan dengan kode**. Semuanya lewat
Google Drive dan Google Sheets biasa. Pintu masuk cepatnya: buka website,
gulir paling bawah, klik tulisan kecil **Admin** di baris copyright.

| Mau apa? | Caranya |
|---|---|
| Menambah foto/video galeri | Upload file ke subfolder yang sesuai di folder `Galeri PBJ` |
| Menghapus foto dari website | Hapus filenya dari Drive |
| Menambah kategori galeri baru | Buat subfolder baru di `Galeri PBJ` |
| Mengganti caption foto | Ganti nama file, atau isi kolom Deskripsi file di Drive |
| Menambah event baru | Tambah satu baris baru di tab `Event & Race PBJ` (file `PBJ - Pengaturan Situs`) |
| Event sudah lewat | Ubah kolom Status menjadi `selesai` |
| Menghapus event | Hapus barisnya di sheet |
| Membuka pendaftaran member baru | Ubah kolom Value di tab `Registration` jadi `TRUE` (lihat Bagian I) |
| Menutup pendaftaran member baru | Ubah kolom Value di tab yang sama jadi `FALSE` |

Perubahan biasanya tampil di website dalam hitungan detik sampai beberapa
menit (refresh halamannya).

---

## Bagian G. Kalau Ada Masalah (Troubleshooting)

**Foto tidak muncul di website?**
1. Cek folder `Galeri PBJ`: apakah sudah dibagikan "Siapa saja yang memiliki
   link"? (Bagian B3). Ini penyebab paling sering.
2. Pastikan foto berada DI DALAM subfolder (Latihan/Lomba/Prestasi),
   bukan langsung di folder induk.
3. Coba buka website dengan mode incognito/private untuk memastikan bukan
   masalah cache browser.

**Event tidak muncul?**
1. Cek judul kolom baris 1 di sheet: ejaannya harus sama dengan Bagian D1.
2. Kolom **Nama** tidak boleh kosong; baris tanpa Nama dianggap kosong.
3. Cek sheet sudah dibagikan "Siapa saja yang memiliki link" (Bagian D3).

**Tombol "Info & Daftar" atau "Foto & Video" tidak muncul di kartu event?**
Kolom LinkInfo/LinkMedia harus diawali `https://` (link lengkap, bukan
sekadar "bit.ly/...").

**Semua tiba-tiba tidak tampil?**
Kemungkinan kunci API bermasalah. Hubungi tim tech, minta cek
`console.cloud.google.com` (apakah key masih aktif dan Drive API enabled).

**Butuh bantuan lebih?** Hubungi tim tech PBJ (Idaz Anggara).

---

## Bagian H. Supaya Website Muncul di Google (WAJIB, sekali saja)

Website baru **tidak otomatis muncul di Google**. Sebagus apa pun isinya,
Google harus "berkenalan" dulu lewat Google Search Console. Tanpa langkah
ini, mengetik "pushbike jakarta" di Google tidak akan menampilkan website.

1. Buka [search.google.com/search-console](https://search.google.com/search-console),
   login dengan akun Google PBJ.
2. Klik **Add property** (Tambahkan properti), pilih tipe **URL prefix**,
   isi alamat website lengkap: `https://www.pushbikejakarta.com/`
   lalu klik **Continue**.
3. Pilih metode verifikasi **HTML tag**. Google memberi satu baris kode
   seperti `<meta name="google-site-verification" content="Abc123..." />`.
   Salin baris itu, kirim ke tim tech untuk ditempel di `index.html`
   (tempatnya sudah disiapkan, ada komentar penanda di bagian atas file).
   Setelah kode terpasang dan website ter-deploy, kembali ke Search
   Console dan klik **Verify**.
4. Setelah terverifikasi, di menu kiri pilih **Sitemaps**, ketik
   `sitemap.xml`, klik **Submit**.
5. Terakhir, di kolom pencarian paling atas Search Console, tempel
   `https://www.pushbikejakarta.com/` lalu tekan Enter, dan klik
   **Request Indexing** (Minta Pengindeksan).

**Kapan mulai muncul?** Biasanya beberapa hari sampai 2 minggu untuk
pencarian nama ("pushbike jakarta"). Untuk kata kunci umum ("balance bike
anak", "komunitas pushbike") butuh waktu lebih lama dan sangat terbantu oleh:

- **Cantumkan link website di bio Instagram @pushbikejakarta** dan sebut
  di postingan. Link dari akun aktif adalah sinyal kuat buat Google.
- **Buat Google Business Profile** ([business.google.com](https://business.google.com))
  untuk "Pushbike Jakarta" dengan lokasi JIEP Pulomas. Ini membuat PBJ
  muncul di Google Maps dan pencarian lokal ("pushbike jakarta timur").
- Minta komunitas lain / media yang meliput event mencantumkan link website.

**Catatan pindah domain nanti** (mis. ke pushbikejakarta.org): jangan hanya
ganti alamat. Minta tim tech mengganti semua URL di `index.html` (canonical,
og:url, schema), `robots.txt`, dan `sitemap.xml`, memasang redirect dari
domain lama, lalu daftarkan domain baru di Search Console dengan cara yang
sama.

---

## Bagian I. Membuat Toggle Buka/Tutup Pendaftaran Member Baru (opsional)

Fitur ini membuat tombol **"Daftar Sekarang"** di website berubah otomatis
mengarah ke halaman formulir pendaftaran member baru (`register.html`,
berisi Google Form resmi), HANYA saat masa pembukaan sedang aktif — tanpa
perlu tim tech redeploy setiap kali dibuka/ditutup. Setup di bawah cukup
dilakukan **SEKALI**; pemakaian sehari-hari setelahnya lihat Bagian F.

> ✅ **Status: sudah di-setup** (30 Juli 2026). Bagian ini disimpan sebagai
> riwayat/referensi kalau perlu setup ulang dari nol suatu saat nanti.

### I1. Tab "Registration" di spreadsheet `PBJ - Pengaturan Situs`

Sejak digabung (lihat catatan di awal dokumen), tab ini adalah SALAH SATU
dari 4 tab di file `PBJ - Pengaturan Situs` yang sama dengan tab Event &
Race dan Galeri per Latihan — BUKAN spreadsheet terpisah lagi.

1. Di **baris 1**, isi 2 kolom persis:

   | A | B |
   |---|---|
   | Key | Value |

2. Di **baris 2 dan 3**, isi:

   | Key | Value |
   |---|---|
   | REGISTRATION_OPEN | FALSE |
   | REGISTRATION_FORM_URL | https://docs.google.com/forms/d/e/xxxxx/viewform |

   - `REGISTRATION_OPEN`: mulai dari `FALSE` (tutup) — aman, tidak
     tiba-tiba "membuka" pendaftaran begitu sheet ini dibuat.
   - `REGISTRATION_FORM_URL`: link **publik** Google Form (tombol **Send /
     Kirim** di Form → ikon link 🔗 → Salin) — BUKAN link edit (`.../edit`).
     Baris ini yang membuat ganti-Google-Form-di-kemudian-hari jadi gampang:
     cukup edit sel ini, TIDAK perlu redeploy/hubungi tim tech.

### I2. Bagikan spreadsheet

Share sekali di level FILE (bukan per-tab) → ubah Akses umum menjadi
**"Siapa saja yang memiliki link"**, peran **Pelihat / Viewer**. Berlaku
otomatis untuk semua tab kecuali ada tab yang sengaja di-Protect
(lihat Bagian J untuk contoh proteksi tab).

### I3. Ambil ID spreadsheet + gid tab

- **ID spreadsheet**: dari alamat browser, ambil bagian antara `/d/` dan
  `/edit` — SAMA untuk semua tab (Event, Galeri, Registration, Config).
- **gid tab "Registration"**: klik tab ini supaya aktif, ambil angka
  setelah `#gid=` di URL. Kalau tab ini tab PERTAMA/paling kiri, gid-nya
  `0` — tapi tetap ambil eksplisit dari URL, jangan asumsi, karena tab
  bisa saja digeser posisinya kapan saja.

### I4. Sambungkan ke website (dikerjakan tim tech, sekali saja)

Di `config.js`, isi:

```js
const SETTINGS_SHEET_ID = '<ID spreadsheet>'
const SETTINGS_SHEET_GID = '<gid tab Registration>'
```

**Penting:** `SETTINGS_SHEET_GID` HARUS diisi eksplisit, jangan dikosongkan
— endpoint yang dipakai situs ini TIDAK otomatis membaca tab pertama kalau
tab digeser posisinya (insiden nyata 30 Juli 2026, lihat catatan di
STRUKTUR-DATA.md). Baris `REGISTRATION_FORM_URL` di `config.js` TIDAK
perlu diisi ulang setiap ganti form — nilai itu sekarang cuma **cadangan
darurat** (dipakai kalau sheet gagal dimuat). Sumber utama link Form yang
dipakai sehari-hari adalah baris `REGISTRATION_FORM_URL` di tab
Registration (lihat I1) — ganti di situ, TIDAK butuh redeploy.

---

## Bagian J. Tab "Config" Tersembunyi (nomor WA admin) — opsional, teknis

> ✅ **Status: sudah di-setup** (30 Juli 2026, gid `845332613`). Bagian ini
> disimpan sebagai riwayat/referensi.

Beda dari Bagian I: bagian ini untuk **salah satu tab** di spreadsheet yang
SAMA dengan `PBJ - Pengaturan Situs` (bukan spreadsheet baru), khusus
untuk pengaturan yang sengaja **disembunyikan** dari kolaborator lain
yang cuma perlu buka/tutup pendaftaran (Bagian I) atau isi data Event/
Galeri. Saat ini cuma menampung 1 nilai: nomor WA admin.

### J1. Buat tab "Config"

1. Di spreadsheet `PBJ - Pengaturan Situs` (yang sama dengan Bagian I),
   klik **"+"** di kiri bawah untuk tambah tab baru. Beri nama `Config`.
2. Isi kolom & baris persis seperti tab "Registration":

   | Key | Value |
   |---|---|
   | ADMIN_WA_NUMBER | 6285647357997 |

   (format: kode negara + nomor TANPA angka 0 di depan, sama seperti
   `ADMIN_WA_NUMBER` di `config.js`)

### J2. Sembunyikan tab (opsional tapi disarankan)

Klik kanan tab `Config` → **"Sembunyikan sheet"**. Tab jadi tidak
terlihat oleh siapa pun yang dibagikan akses ke spreadsheet ini —
termasuk yang cuma perlu akses ke tab "Registration". Untuk
memunculkannya lagi: klik ikon **☰** di pojok kiri bawah spreadsheet →
pilih `Config`.

### J3. Ambil gid tab & sambungkan ke website (dikerjakan tim tech)

1. Klik tab `Config` supaya aktif (kalau sudah disembunyikan di J2,
   tampilkan dulu lewat cara di atas).
2. Lihat alamat browser, ambil angka setelah `#gid=`:
   ```
   https://docs.google.com/spreadsheets/d/xxxxx/edit#gid=987654321
   ```
   → gid-nya `987654321`.
3. Di `config.js`, isi:
   ```js
   const CONFIG_SHEET_GID = ''
   ```
   menjadi:
   ```js
   const CONFIG_SHEET_GID = '987654321'
   ```

Setelah ini, ganti nomor WA admin cukup edit sel `Value` di tab `Config`
— TIDAK perlu redeploy. `ADMIN_WA_NUMBER` di `config.js` tetap ada
sebagai cadangan darurat (dipakai kalau tab Config gagal dimuat), sama
seperti pola `REGISTRATION_FORM_URL` di Bagian I.

### J4. Proteksi tab dari edit tidak sengaja (disarankan kalau sudah share ke orang lain)

Begitu tab `Event & Race` / `Galeri per Latihan` dibagikan ke coach/
pengurus lain untuk mereka isi sendiri, ingat: **"Sembunyikan sheet" di
J2 BUKAN pengaman edit** — siapa pun yang Editor di file ini tetap bisa
memunculkan & mengubah tab tersembunyi lewat menu ☰. Untuk proteksi
SUNGGUHAN (walau tab terlihat/tersembunyi):

1. Klik kanan tab `Registration` atau `Config` → **"Protect sheet"**
   (atau menu **Data → Protected sheets and ranges**).
2. Pilih **"Sheet"**, pastikan tab yang benar terpilih.
3. Di bagian **"Set permissions"**, pilih **"Only you"** (atau tambahkan
   email co-admin tepercaya lain kalau perlu lebih dari satu orang).
4. Simpan.

Dengan ini, kolaborator yang Editor di tab Event/Galeri **tidak bisa
mengubah** isi tab Registration/Config walau tab-nya terlihat — cocok
dipakai terutama untuk tab `Registration`, karena salah pencet
`REGISTRATION_OPEN` bisa tiba-tiba "membuka" pendaftaran member baru
tanpa sengaja.

---

## Lampiran: Mengganti Feed Instagram ke Akun PBJ

Saat ini feed Instagram di website masih memakai data percobaan. Untuk
menghubungkan ke akun asli @pushbikejakarta:

1. Buka [behold.so](https://behold.so), klik **Sign up**, daftar memakai
   akun Google PBJ.
2. Klik **Add a source**, lalu login dengan akun **Instagram**
   @pushbikejakarta dan izinkan aksesnya.
3. Buat feed baru: pilih source @pushbikejakarta, pilih format **JSON**.
4. Salin alamat feed yang diberikan (bentuknya
   `https://feeds.behold.so/xxxxxxxx`).
5. Kirim ke tim tech untuk ditempel di file `config.js` pada baris
   `INSTAGRAM_FEED_URL`, menggantikan `'instagram-feed-sample.json'`
   (satu file yang sama dengan pengaturan Galeri dan Event di Bagian E).

Setelah itu, setiap posting baru di Instagram otomatis muncul di website.

---

*Dokumen ini dibuat 7 Juli 2026 oleh tim Tech PBJ. Simpan baik-baik bersama
password akun Google PBJ, dan wariskan ke pengurus berikutnya.*
