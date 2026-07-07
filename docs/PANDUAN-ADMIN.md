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
4. Isi nama project: `website-pbj`, lalu klik **Create**. Tunggu sebentar,
   lalu pastikan project `website-pbj` yang terpilih di bagian atas.
5. Sekarang aktifkan izin Drive:
   - Di kotak pencarian paling atas, ketik: `Google Drive API`, tekan Enter.
   - Klik hasil bernama **Google Drive API**.
   - Klik tombol biru **Enable** (Aktifkan). Tunggu sampai selesai.
6. Buat kuncinya:
   - Di kotak pencarian atas, ketik: `Credentials`, pilih
     **Credentials (APIs & Services)**.
   - Klik **+ Create Credentials** di bagian atas, pilih **API key**.
   - Akan muncul jendela berisi kode panjang, contohnya:
     `AIzaSyB1234567890abcdefghijklmnop`
   - Salin kode itu, tempel di catatan dengan label **"KUNCI API"**.
7. **(Sangat disarankan) Kunci supaya tidak disalahgunakan:**
   - Masih di jendela yang sama, klik **Edit API key**
     (atau klik nama key-nya di daftar).
   - Di bagian **API restrictions**, pilih **Restrict key**, lalu centang
     hanya **Google Drive API**.
   - Di bagian **Application restrictions** pilih **Websites**, klik
     **Add**, lalu isi alamat website PBJ (contoh: `https://pushbikejakarta.com/*`).
   - Klik **Save**.

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
| Menambah event baru | Tambah satu baris baru di sheet `Event PBJ` |
| Event sudah lewat | Ubah kolom Status menjadi `selesai` |
| Menghapus event | Hapus barisnya di sheet |

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
