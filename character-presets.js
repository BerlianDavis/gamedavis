// =========================================================
// Belajar Figma — Preset Karakter Siswa SMA
// Karakter TIDAK lagi memakai file gambar sama sekali.
// Semua digambar langsung lewat kode (canvas gradient shading
// supaya terlihat "3D") memakai seragam SMA putih-abu +
// jas almamater biru dongker yang seragam untuk semua karakter.
// =========================================================

window.CHARACTER_PRESETS = [
  {
    id: 'bima',
    name: 'Bima',
    gender: 'male',
    skin: '#e3a877',
    skinShadow: '#b97e52',
    hair: '#26170d',
    hairStyle: 'short'
  },
  {
    id: 'zahra',
    name: 'Zahra',
    gender: 'female',
    skin: '#f2c9a0',
    skinShadow: '#cf9c6c',
    hair: '#241a12',
    hairStyle: 'hijab'
  },
  {
    id: 'raka',
    name: 'Raka',
    gender: 'male',
    skin: '#c98a5a',
    skinShadow: '#9c633a',
    hair: '#1b1109',
    hairStyle: 'spiky'
  },
  {
    id: 'dina',
    name: 'Dina',
    gender: 'female',
    skin: '#efc39a',
    skinShadow: '#c99568',
    hair: '#33241a',
    hairStyle: 'ponytail'
  }
];

// Warna seragam SMA — sama untuk semua karakter (identitas sekolah)
window.UNIFORM_COLORS = {
  shirt:        '#f5f5f2',   // kemeja putih
  shirtShadow:  '#d8d8d2',
  pants:        '#8a8f98',   // celana / rok abu-abu
  pantsShadow:  '#666b73',
  blazer:       '#0f2a52',   // jas almamater biru dongker
  blazerShadow: '#081a36',
  blazerHi:     '#1c3f79',
  badge:        '#f4c430',   // emblem/logo dada
  shoes:        '#1a1a1a'
};
