// src/audio/audioCatalog.js
// Katalog aset audio paket `cadas-audio` (lihat cadas-sounds.md Bagian 2 & 4).
// Semua file di R2: /audio/bgm/*.opus dan /audio/sfx/*.opus
// (diakses lewat backend /api/bgm/:track dan /api/sfx/:id).

// ── Micro-sounds (one-shot) ───────────────────────────────────────────────
export const SFX = {
  CORRECT:        'sfx_correct',
  WRONG:          'sfx_wrong',
  CORRECT_FAST:   'sfx_correct_fast',
  STREAK_5:       'sfx_streak_5',
  STREAK_10:      'sfx_streak_10',
  STREAK_BREAK:   'sfx_streak_break',
  LEVEL_UP:       'sfx_level_up',
  PLACEMENT_DONE: 'sfx_placement_done',
  FAST_TRACK_PASS:'sfx_fast_track_pass',
  TAP:            'sfx_tap',
  KEYPAD:         'sfx_keypad',
  SESSION_START:  'sfx_session_start',
};

// ── Backsound: 3 zona + Championship L9 (cadas-sounds.md Bagian 1) ─────────
export const BGM = {
  ZONE_A: ['bgm_chill_01', 'bgm_chill_02'],                    // L1-4  (Santai)
  ZONE_B: ['bgm_energic_01', 'bgm_energic_02'],                // L5-8  (Energik)
  ZONE_B_ADAPTIVE: ['bgm_energic_03', 'bgm_energic_04', 'bgm_energic_05'],
  L9:     ['bgm_championship_l9'],                             // L9 (Championship)
  ZONE_C: ['bgm_focus_01', 'bgm_focus_02'],                    // L10-15 (Fokus)
};

// Ambang unlock track adaptif Zona B (cadas-sounds.md Bagian 6 poin 2):
// siswa yang cepat naik level hanya mendengar track 1-2; yang menumpuk
// puluhan sesi di level yang sama mendapat track 3, 4, 5 secara bertahap.
export const ZONE_B_UNLOCK_SESSIONS = [15, 25, 40];

// Rasio volume BGM saat bot (Kak Cadas) berbicara — Bagian 6 poin 4 (20%).
export const DUCK_RATIO = 0.20;
// Fade-in saat kembali ke volume normal setelah bot selesai (Bagian 3: 1 detik).
export const DUCK_FADE_MS = 1000;

export function zoneOfLevel(level) {
  if (level === 9) return 'L9_CHAMPIONSHIP';
  if (level <= 4)  return 'A';
  if (level <= 8)  return 'B';
  return 'C';
}

/**
 * Daftar track BGM yang boleh dipakai untuk level tertentu.
 * @param {number} level level aktif (1-15)
 * @param {number} sessionCount jumlah sesi latihan siswa di level tsb
 */
export function bgmTracksForLevel(level, sessionCount = 0) {
  const zone = zoneOfLevel(level);
  if (zone === 'L9_CHAMPIONSHIP') return BGM.L9;
  if (zone === 'A') return BGM.ZONE_A;
  if (zone === 'C') return BGM.ZONE_C;
  const list = [...BGM.ZONE_B];
  BGM.ZONE_B_ADAPTIVE.forEach((track, i) => {
    if (sessionCount >= ZONE_B_UNLOCK_SESSIONS[i]) list.push(track);
  });
  return list;
}

/** Pilih 1 track secara acak dari daftar yang tersedia (bukan di tengah sesi). */
export function pickBgmTrack(level, sessionCount = 0) {
  const list = bgmTracksForLevel(level, sessionCount);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}