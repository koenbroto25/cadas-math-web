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
// PENTING (anti-bug): hanya `expo-audio` (useAudioPlayer). Dilarang expo-av,
// dilarang stopAsync/unloadAsync — cleanup memakai `pause()` dalam try/catch.

import { useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { DUCK_RATIO, DUCK_FADE_MS } from '../audio/audioCatalog';

const FADE_STEP_MS = 100;

function stopFade(ref) {
  if (ref.current) { clearInterval(ref.current); ref.current = null; }
}

export function useGameAudio() {
  const prefs = useStore((s) => s.audioPrefs);

  const bgmPlayer = useAudioPlayer(null);
  const sfxPlayer = useAudioPlayer(null);

  const trackRef   = useRef(null);    // track BGM yang sedang terpasang
  const duckRef    = useRef(false);   // true = bot sedang bicara
  const botBusyRef = useRef(false);   // gerbang "jangan bunyi SFX saat bot bicara"
  const fadeRef    = useRef(null);    // interval fade-in volume
  const prefsRef   = useRef(prefs);
  prefsRef.current = prefs;

  const setVol = useCallback((player, v) => {
    try { player.volume = v; } catch (_) {}
  }, []);

  const bgmTarget = useCallback(() => {
    const p = prefsRef.current;
    if (!p?.bgmEnabled) return 0;
    return p.bgmVolume * (duckRef.current ? DUCK_RATIO : 1);
  }, []);

  // Volume ikut preferensi user
  useEffect(() => {
    setVol(bgmPlayer, bgmTarget());
  }, [prefs.bgmEnabled, prefs.bgmVolume, bgmPlayer, bgmTarget, setVol]);

  useEffect(() => {
    setVol(sfxPlayer, prefs.sfxEnabled ? prefs.sfxVolume : 0);
  }, [prefs.sfxEnabled, prefs.sfxVolume, sfxPlayer, setVol]);

  // Fade-in BGM dari 0 ke volume target dalam DUCK_FADE_MS (1 detik, step 100ms).
  // Dipakai saat BGM kembali normal setelah bot selesai & saat startBgm({fadeIn}).
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
        setVol(bgmPlayer, bgmTarget());   // baca ulang: pref bisa berubah saat fade
        return;
      }
      setVol(bgmPlayer, step * i);
    }, FADE_STEP_MS);
  }, [bgmPlayer, bgmTarget, setVol]);

  // ── Backsound ──────────────────────────────────────────────────────────
  // opts.fadeIn: mulai dari 0 lalu naik ke volume normal (Bagian 3: fade-in)
  const startBgm = useCallback((track, opts = {}) => {
    if (!track || !prefsRef.current?.bgmEnabled) return;
    try {
      if (trackRef.current !== track) {
        bgmPlayer.loop = true;                       // loop seamless
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
    try { bgmPlayer.pause(); } catch (_) {}
  }, [bgmPlayer]);

  // Volume BGM saat bot berbicara (ducking) / kembali normal (fade-in 1s)
  const duckBgm = useCallback((on) => {
    duckRef.current = !!on;
    if (on) {
      stopFade(fadeRef);
      setVol(bgmPlayer, bgmTarget());
    } else {
      fadeToTarget();
    }
  }, [bgmPlayer, bgmTarget, fadeToTarget, setVol]);

  /** Panggil true tepat sebelum bot/TTS diputar, false saat playback selesai. */
  const botSpeaking = useCallback((on) => {
    botBusyRef.current = !!on;
    duckBgm(!!on);
  }, [duckBgm]);

  // ── Micro-sound ────────────────────────────────────────────────────────
  const playSfx = useCallback((id) => {
    if (!id) return;
    const p = prefsRef.current;
    if (!p?.sfxEnabled) return;
    if (botBusyRef.current) return;   // Bagian 3: tidak bersamaan dengan bot
    try {
      sfxPlayer.volume = p.sfxVolume;
      sfxPlayer.replace({ uri: api.sfxUrl(id) });
      sfxPlayer.play();
    } catch (err) {
      console.warn('[playSfx]', id, err?.message);
    }
  }, [sfxPlayer]);

  // ── Cleanup (wajib pause, bukan stop/unload) ───────────────────────────
  useEffect(() => () => {
    stopFade(fadeRef);
    try { bgmPlayer.pause(); } catch (_) {}
    try { sfxPlayer.pause(); } catch (_) {}
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