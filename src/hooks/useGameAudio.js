// src/hooks/useGameAudio.js
// Kanal audio 3-player sesuai cadas-sounds.md Bagian 4:
//   - BGM player  : backsound loop (bgmPlayer)
//   - SFX player  : micro-sound one-shot (sfxPlayer)
//   - bot/TTS player tetap di masing-masing layar (prioritas tertinggi)
//
// Aturan yang diterapkan (Bagian 3):
//   - Saat bot bicara: BGM turun ke 20% (ducking), micro-sound TIDAK diputar.
//   - Setelah bot selesai: BGM kembali ke volume normal, fade-in 1 detik.
//   - Saat micro-sound berbunyi: BGM jalan normal di player terpisah.
//
// Platform support:
//   - Android/iOS : expo-audio (useAudioPlayer) — native, sudah OK.
//   - Web (WPA)   : HTMLAudioElement via createWebPlayer() — karena expo-audio
//                   tidak support browser dan diam tanpa error.

import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { DUCK_RATIO, DUCK_FADE_MS } from '../audio/audioCatalog';
import { createWebPlayer } from '../utils/webAudioPlayer';

// Lazy-import expo-audio hanya di platform native supaya web build tidak error
// saat bundler mencoba resolve modul native.
let useAudioPlayer = null;
if (Platform.OS !== 'web') {
  // require() sinkron — aman karena ini top-level modul, bukan kondisional hook.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  useAudioPlayer = require('expo-audio').useAudioPlayer;
}

const FADE_STEP_MS = 100;

function stopFade(ref) {
  if (ref.current) { clearInterval(ref.current); ref.current = null; }
}

/**
 * Buat player yang sesuai platform.
 * - Web  : createWebPlayer() → HTMLAudioElement wrapper
 * - Native: useAudioPlayer(null) dari expo-audio (dipanggil sebagai hook)
 *
 * CATATAN: di native, useAudioPlayer harus dipanggil tanpa kondisi (Rules of Hooks).
 * Solusinya: kita selalu panggil useAudioPlayer di native, dan createWebPlayer di web.
 * Kita TIDAK bisa pakai if (isWeb) { hook() } — itu melanggar Rules of Hooks.
 * Jadi kita pisah lewat dua hook berbeda lalu merge.
 */
function usePlatformPlayers() {
  // Di web: native hook tidak dipanggil sama sekali (file ini dijalankan per-platform
  // lewat Metro bundler yang sudah membedakan Platform.OS saat build web).
  // Namun Metro tetap parse semua hook — jadi kita perlu cara aman.
  //
  // Cara aman: panggil useAudioPlayer TANPA kondisional, tapi guard hasilnya.
  // Kalau di web, useAudioPlayer = null (tidak di-require) → tidak dipanggil.

  // ── Native ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const nativeBgm = useAudioPlayer ? useAudioPlayer(null) : null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const nativeSfx = useAudioPlayer ? useAudioPlayer(null) : null;

  // ── Web ──────────────────────────────────────────────────────────────────
  const webBgmRef = useRef(null);
  const webSfxRef = useRef(null);

  if (Platform.OS === 'web') {
    if (!webBgmRef.current) webBgmRef.current = createWebPlayer();
    if (!webSfxRef.current) webSfxRef.current = createWebPlayer();
  }

  // Cleanup web players saat unmount
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return () => {
      webBgmRef.current?.destroy();
      webSfxRef.current?.destroy();
    };
  }, []);

  const bgmPlayer = Platform.OS === 'web' ? webBgmRef.current : nativeBgm;
  const sfxPlayer = Platform.OS === 'web' ? webSfxRef.current : nativeSfx;

  return { bgmPlayer, sfxPlayer };
}

export function useGameAudio() {
  const prefs = useStore((s) => s.audioPrefs);

  const { bgmPlayer, sfxPlayer } = usePlatformPlayers();

  const trackRef   = useRef(null);    // track BGM yang sedang terpasang
  const duckRef    = useRef(false);   // true = bot sedang bicara
  const botBusyRef = useRef(false);   // gerbang "jangan bunyi SFX saat bot bicara"
  const fadeRef    = useRef(null);    // interval fade-in volume
  const prefsRef   = useRef(prefs);
  prefsRef.current = prefs;

  const setVol = useCallback((player, v) => {
    if (!player) return;
    try { player.volume = v; } catch (_) {}
  }, []);

  const bgmTarget = useCallback(() => {
    const p = prefsRef.current;
    if (!p?.bgmEnabled) return 0;
    return (p.bgmVolume ?? 0.7) * (duckRef.current ? DUCK_RATIO : 1);
  }, []);

  // Volume ikut preferensi user
  useEffect(() => {
    setVol(bgmPlayer, bgmTarget());
  }, [prefs.bgmEnabled, prefs.bgmVolume, bgmPlayer, bgmTarget, setVol]);

  useEffect(() => {
    if (!sfxPlayer) return;
    setVol(sfxPlayer, prefs.sfxEnabled ? (prefs.sfxVolume ?? 1.0) : 0);
  }, [prefs.sfxEnabled, prefs.sfxVolume, sfxPlayer, setVol]);

  // Fade-in BGM dari 0 ke volume target dalam DUCK_FADE_MS (1 detik, step 100ms).
  const fadeToTarget = useCallback(() => {
    stopFade(fadeRef);
    const target = bgmTarget();
    if (target <= 0) { setVol(bgmPlayer, 0); return; }
    const steps = Math.max(1, Math.round(DUCK_FADE_MS / FADE_STEP_MS));
    const step  = target / steps;
    let i = 0;
    setVol(bgmPlayer, 0);
    fadeRef.current = setInterval(() => {
      i += 1;
      if (i >= steps) {
        stopFade(fadeRef);
        setVol(bgmPlayer, bgmTarget());
        return;
      }
      setVol(bgmPlayer, step * i);
    }, FADE_STEP_MS);
  }, [bgmPlayer, bgmTarget, setVol]);

  // ── Backsound ────────────────────────────────────────────────────────────
  const startBgm = useCallback((track, opts = {}) => {
    if (!track || !prefsRef.current?.bgmEnabled || !bgmPlayer) return;
    try {
      if (trackRef.current !== track) {
        bgmPlayer.loop = true;
        bgmPlayer.replace({ uri: api.bgmUrl(track) });
        trackRef.current = track;
      }
      stopFade(fadeRef);
      if (opts.fadeIn) {
        setVol(bgmPlayer, 0);
        if (!bgmPlayer.playing) bgmPlayer.play();
        fadeToTarget();
      } else {
        setVol(bgmPlayer, bgmTarget());
        if (!bgmPlayer.playing) bgmPlayer.play();
      }
    } catch (err) {
      console.warn('[startBgm]', track, err?.message);
    }
  }, [bgmPlayer, bgmTarget, fadeToTarget, setVol]);

  const stopBgm = useCallback(() => {
    stopFade(fadeRef);
    trackRef.current = null;
    try { bgmPlayer?.pause(); } catch (_) {}
  }, [bgmPlayer]);

  const duckBgm = useCallback((on) => {
    duckRef.current = !!on;
    if (on) {
      stopFade(fadeRef);
      setVol(bgmPlayer, bgmTarget());
    } else {
      fadeToTarget();
    }
  }, [bgmPlayer, bgmTarget, fadeToTarget, setVol]);

  const botSpeaking = useCallback((on) => {
    botBusyRef.current = !!on;
    duckBgm(!!on);
  }, [duckBgm]);

  // ── Micro-sound ──────────────────────────────────────────────────────────
  const playSfx = useCallback((id) => {
    if (!id || !sfxPlayer) return;
    const p = prefsRef.current;
    if (!p?.sfxEnabled) return;
    if (botBusyRef.current) return;
    try {
      sfxPlayer.volume = p.sfxVolume ?? 1.0;
      sfxPlayer.replace({ uri: api.sfxUrl(id) });
      sfxPlayer.play();
    } catch (err) {
      console.warn('[playSfx]', id, err?.message);
    }
  }, [sfxPlayer]);

  // ── Cleanup ──────────────────────────────────────────────────────────────
  useEffect(() => () => {
    stopFade(fadeRef);
    try { bgmPlayer?.pause(); } catch (_) {}
    try { sfxPlayer?.pause(); } catch (_) {}
  }, [bgmPlayer, sfxPlayer]);

  return {
    prefs,
    startBgm,
    stopBgm,
    duckBgm,
    botSpeaking,
    playSfx,
    currentBgm: () => trackRef.current,
  };
}
