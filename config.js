// =========================================================
// KONFIGURASI Belajar Figma
// =========================================================
// Leaderboard global memakai Vercel KV lewat endpoint bawaan
// di /api/scores (lihat file api/scores.js). Kalau situs ini
// dibuka lewat http/https (misalnya setelah di-deploy ke
// Vercel), URL API otomatis diarahkan ke '/api' — TIDAK perlu
// diedit manual.
//
// Kalau dibuka langsung dari file (protokol file://, misal
// dobel klik index.html di komputer), otomatis dikosongkan
// supaya game tetap jalan normal dengan papan peringkat LOKAL
// (localStorage) saja — tanpa error.
//
// Mau pakai backend lain (mis. Cloudflare Worker di
// backend/worker-leaderboard.js)? Isi URL-nya manual di sini,
// itu akan menimpa deteksi otomatis di atas:
//   window.LEADERBOARD_API_URL = 'https://xxxxx.workers.dev';
window.LEADERBOARD_API_URL = (location.protocol === 'file:') ? '' : '/api';

