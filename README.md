# Belajar Figma — RPG Kuis Petualangan

## Ringkasan fitur

1. **Karakter 100% digambar via kode** (canvas gradient shading, tanpa
   file gambar). Semua karakter memakai seragam SMA putih-abu + jas
   almamater biru dongker. Data varian ada di `character-presets.js`,
   logika gambar di `drawUniformCharacter()` dalam `game.js`.

2. **Rintangan monster.** 5 monster (slime & kelelawar) berpatroli di
   peta. Tersentuh monster → XP berkurang 6 (lebih ringan dari salah
   jawab kuis: 15–25), lalu pemain kebal sesaat.

3. **Setiap pos kuis hanya bisa dikerjakan SATU KALI.**
   Begitu sebuah pos dijawab (benar maupun salah), pos itu langsung
   terkunci — pemain tidak bisa membuka atau mengerjakan ulang pos
   yang sama, baik pos 1 sampai pos 5. Jawaban salah tetap mengurangi
   XP, tapi pos tetap dianggap selesai sehingga pemain bisa lanjut ke
   gerbang.

4. **Alur Finish → Submit.** Setelah kelima pos dikerjakan dan pemain
   mencapai Gerbang Kemenangan, muncul layar **🏁 FINISH** berisi hasil
   (sisa XP & akurasi) dan **hanya satu tombol: "✅ Submit Skor ke
   Peringkat"** (tidak ada tombol main lagi). Skor baru masuk ke
   Papan Peringkat setelah tombol itu ditekan.

5. **Papan peringkat GLOBAL** (seperti Quizizz) — skor semua pemain,
   dari perangkat manapun, tersimpan di satu tempat lewat backend
   **Vercel KV** yang sudah disiapkan di `api/scores.js`. Kalau belum
   di-deploy / belum diaktifkan, otomatis jatuh ke penyimpanan lokal
   (`localStorage`) per browser supaya game tetap jalan.

---

## 🚀 Deploy ke Vercel (tahap 1 — situsnya online)

Tidak perlu build tool, tinggal upload folder ini.

### Cara A — lewat dashboard Vercel (paling gampang, tanpa CLI)

1. Buka [vercel.com](https://vercel.com) → login/daftar (bisa pakai akun GitHub/Google).
2. Upload semua isi folder ini ke sebuah repo GitHub baru (drag & drop
   di github.com/new, atau `git init` + `git push` dari komputer).
3. Di dashboard Vercel: **Add New… → Project** → pilih repo tadi →
   **Import**.
4. Di layar konfigurasi:
   - **Framework Preset:** biarkan "Other" (Vercel akan mendeteksi
     otomatis — tidak perlu build command, tidak perlu output
     directory khusus).
   - Klik **Deploy**.
5. Tunggu ±30 detik → selesai. Kamu akan dapat URL publik seperti
   `https://eldoria-quest-xxxx.vercel.app` yang bisa dibagikan ke
   siapa saja.

### Cara B — lewat Vercel CLI (dari komputer sendiri)

```bash
npm install -g vercel
cd eldoria-quest        # folder hasil unduhan ini
vercel login
vercel --prod
```

Ikuti pertanyaan di terminal (pilih/buat project baru), lalu Vercel
akan memberi URL publik yang sama seperti Cara A.

> Saya tidak bisa mengklik tombol Deploy langsung di akun Vercel-mu
> (butuh login akunmu), tapi seluruh file di folder ini sudah
> "siap-deploy" — dua cara di atas hanya butuh beberapa klik/perintah
> dan situsnya langsung online.

---

## 🏆 Mengaktifkan Papan Peringkat Global (tahap 2 — skor semua orang muncul)

Setelah situs online di Vercel, aktifkan database gratis **Vercel KV**
supaya skor dari 30 orang (atau berapa pun) yang main tersimpan di
satu tempat dan tampil untuk semua orang:

1. Buka project kamu di dashboard Vercel → tab **Storage**.
2. Klik **Create Database** → pilih **KV** (berbasis Redis, ada tier
   gratis).
3. Beri nama (bebas), lalu **Connect** ke project **eldoria-quest** ini.
   Vercel otomatis menambahkan environment variable
   `KV_REST_API_URL` dan `KV_REST_API_TOKEN` ke project — **tidak
   perlu setting manual apapun** di kode.
4. Kembali ke tab **Deployments** → klik **Redeploy** pada deployment
   terakhir (supaya environment variable baru terbaca).
5. Selesai. Endpoint `https://<domainmu>.vercel.app/api/scores` sudah
   aktif, dan `config.js` di game ini **otomatis** mengarah ke `/api`
   setiap kali dibuka lewat http/https — tidak perlu ubah kode sama
   sekali.

Coba: buka situsnya, mainkan sampai submit skor, lalu buka dari HP
atau browser lain (atau minta teman buka) — skor kalian berdua akan
muncul bersama di tombol 🏆 **Ranking**.

### Kalau belum sempat setup Vercel KV

Game tetap berjalan normal — skor otomatis disimpan **lokal**
(per-browser) memakai `localStorage`, jadi tidak ada error, hanya saja
leaderboard-nya belum "global" (tidak dibagikan antar pemain).

### Pakai backend lain (opsional)

Sudah disiapkan juga alternatif backend **Cloudflare Worker** di
`backend/worker-leaderboard.js` (panduan deploy ada di komentar
paling atas file itu) — kalau kamu memakai hosting selain Vercel.
Untuk memakainya, isi manual di `config.js`:

```js
window.LEADERBOARD_API_URL = 'https://nama-workermu.workers.dev';
```

Baris itu akan menimpa deteksi otomatis `/api`.

---

## Menjalankan di komputer sendiri (tanpa deploy)

```bash
npx serve .
# atau
python3 -m http.server 8080
```

Atau cukup dobel klik `index.html` — game tetap jalan dengan
leaderboard lokal (karena diakses via `file://`, `config.js` otomatis
mengosongkan URL API).

## Struktur file

```
index.html               Halaman utama
style.css                Semua styling
character-presets.js     Data 4 varian karakter (warna kulit/rambut) + warna seragam
config.js                Deteksi otomatis URL leaderboard (lokal vs /api)
leaderboard.js            Modul leaderboard (lokal + sinkron ke server)
sound.js                  Efek suara (Web Audio API)
questions.js              Bank soal kuis — mudah ditambah/diubah
game.js                   Mesin game utama (fisika, karakter, monster, kuis, dsb)
api/scores.js             Serverless function Vercel — backend leaderboard global (Vercel KV)
package.json              Dependency @vercel/kv untuk api/scores.js
backend/worker-leaderboard.js   Backend alternatif (Cloudflare Worker), opsional
```
