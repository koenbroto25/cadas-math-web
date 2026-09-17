// src/utils/webAudioPlayer.js
// Drop-in replacement untuk useAudioPlayer (expo-audio) di platform web/browser.
// API identik dengan expo-audio player sehingga useGameAudio.js dan
// PracticeScreen.jsx bisa pakai tanpa perubahan besar.
//
// Di Android/iOS: pakai useAudioPlayer dari expo-audio (native).
// Di Web (WPA)  : pakai HTMLAudioElement langsung.
//
// Dipakai lewat createAudioPlayer() — bukan hook — supaya bisa dipake
// di dalam useRef tanpa melanggar Rules of Hooks.

import { Platform } from 'react-native';

/**
 * Buat player web yang API-nya mirip expo-audio player.
 * Kembalikan object dengan: replace(), play(), pause(), volume (get/set),
 * loop (get/set), playing (get), addListener().
 */
export function createWebPlayer() {
  if (Platform.OS !== 'web') {
    // Tidak boleh dipanggil di native — fallback null, caller pakai expo-audio.
    return null;
  }

  const el = new Audio();
  el.preload = 'auto';

  const listeners = new Set();

  // Emit event ke semua listener yang didaftarkan via addListener()
  function emit(event) {
    listeners.forEach((fn) => {
      try { fn(event); } catch (_) {}
    });
  }

  el.addEventListener('ended', () => emit({ didJustFinish: true, error: null }));
  el.addEventListener('error', () => emit({ didJustFinish: false, error: el.error }));

  return {
    // Ganti sumber audio. Mirip player.replace({ uri }) expo-audio.
    replace({ uri } = {}) {
      if (!uri) return;
      el.src = uri;
      el.load();
    },

    // Mulai playback. Catch promise rejection (browser autoplay policy).
    play() {
      el.play().catch((err) => {
        // Autoplay blocked → tidak crash, cukup warn
        console.warn('[WebPlayer] play blocked:', err?.message);
      });
    },

    pause() {
      try { el.pause(); } catch (_) {}
    },

    // volume: 0.0–1.0
    get volume() { return el.volume; },
    set volume(v) {
      try { el.volume = Math.max(0, Math.min(1, v)); } catch (_) {}
    },

    // loop
    get loop() { return el.loop; },
    set loop(v) { el.loop = !!v; },

    // playing
    get playing() { return !el.paused; },

    // addListener — identik dengan expo-audio API
    // Kembalikan { remove() } agar caller bisa cleanup
    addListener(fn) {
      listeners.add(fn);
      return { remove: () => listeners.delete(fn) };
    },

    // remove semua listener & bebaskan elemen (cleanup)
    destroy() {
      try { el.pause(); } catch (_) {}
      el.src = '';
      listeners.clear();
    },
  };
}

/**
 * isWeb() — helper untuk conditional import.
 */
export const isWeb = Platform.OS === 'web';
