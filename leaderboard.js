/* =========================================================
   Belajar Figma — Leaderboard Module
   - Selalu menyimpan skor secara LOKAL (localStorage) supaya
     tetap bekerja walau tanpa server / offline.
   - Jika window.LEADERBOARD_API_URL diisi (lihat README.md),
     skor juga dikirim & diambil dari server GLOBAL sehingga
     semua pemain di berbagai perangkat bisa saling bersaing.
   ========================================================= */

window.Leaderboard = (function () {
  'use strict';

  // Kosongkan untuk mode lokal saja. Isi dengan URL backend
  // (mis. Cloudflare Worker) untuk mengaktifkan ranking global.
  // Lihat README.md → "Mengaktifkan Papan Peringkat Global".
  const API_URL = (window.LEADERBOARD_API_URL || '').trim().replace(/\/$/, '');

  const LOCAL_KEY = 'eldoria_quest_leaderboard_v1';
  const MAX_LOCAL_ENTRIES = 100;

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal(list) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, MAX_LOCAL_ENTRIES)));
    } catch (e) { /* localStorage tidak tersedia — abaikan */ }
  }

  function sortEntries(list) {
    return list.slice().sort((a, b) => {
      if ((b.xp || 0) !== (a.xp || 0)) return (b.xp || 0) - (a.xp || 0);
      if ((b.accuracy || 0) !== (a.accuracy || 0)) return (b.accuracy || 0) - (a.accuracy || 0);
      return (a.timeSeconds || 0) - (b.timeSeconds || 0);
    });
  }

  // entry: { name, xp, accuracy, correct, total, timeSeconds }
  async function submitScore(entry) {
    const record = Object.assign({}, entry, { date: new Date().toISOString() });

    // Simpan salinan lokal dulu — ini jaminan minimum, selalu berhasil.
    const local = loadLocal();
    local.push(record);
    saveLocal(sortEntries(local));

    if (!API_URL) return { ok: true, remote: false };

    try {
      const res = await fetch(API_URL + '/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return { ok: true, remote: true };
    } catch (err) {
      console.warn('[Leaderboard] Gagal sinkron ke server global, skor tetap tersimpan lokal.', err);
      return { ok: true, remote: false, error: err };
    }
  }

  async function fetchTop(limit) {
    limit = limit || 10;

    if (API_URL) {
      try {
        const res = await fetch(API_URL + '/scores?limit=' + limit);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return { list: sortEntries(data).slice(0, limit), remote: true };
      } catch (err) {
        console.warn('[Leaderboard] Gagal ambil data global, menampilkan skor lokal.', err);
      }
    }

    return { list: sortEntries(loadLocal()).slice(0, limit), remote: false };
  }

  return {
    submitScore,
    fetchTop,
    isGlobalConfigured: !!API_URL
  };
})();
