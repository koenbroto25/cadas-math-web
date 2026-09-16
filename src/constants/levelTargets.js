// src/constants/levelTargets.js
// Target waktu per level (ms) — SATU sumber kebenaran.
// Sebelumnya tabel ini terduplikasi di useStore.js dan SessionResultScreen.jsx.
// Dipakai untuk: bot_levelup_speed_*, confidence score, dan gerbang
// `sfx_correct_fast` (hanya Level 5-15, cadas-sounds.md Bagian 6 poin 3).
export const TARGET_MS = {
   1: 15000,  2: 12000,  3: 10000,  4:  9000,  5:  8000,
   6:  9000,  7:  9000,  8:  8000,  9:  6000, 10: 14000,
  11: 17000, 12: 17000, 13: 25000, 14: 25000, 15: 10000,
};

export function targetMsFor(level) {
  return TARGET_MS[level] ?? 10000;
}

// `sfx_correct_fast` hanya diaktifkan di Zona B & C (Level 5-15) — Bagian 6 poin 3.
export function allowsCorrectFastSfx(level) {
  return level >= 5 && level <= 15;
}