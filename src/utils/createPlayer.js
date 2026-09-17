// src/utils/createPlayer.js
// Helper: buat audio player yang bekerja di web DAN native.
//
// PracticeScreen pakai useAudioPlayer (expo-audio) untuk ttsPlayer & botPlayer.
// Di web, expo-audio tidak support browser → diam tanpa error.
// File ini membungkus kedua platform sehingga caller tidak perlu tahu platform.
//
// Cara pakai di PracticeScreen:
//
//   import { usePracticePlayer } from '../utils/createPlayer';
//
//   const ttsPlayer = usePracticePlayer();  // gantikan useAudioPlayer(null)
//   const botPlayer = usePracticePlayer();
//
// API yang dikembalikan identik dengan expo-audio player:
//   player.replace({ uri })
//   player.play()
//   player.pause()
//   player.volume = 0.8
//   player.playing  (getter boolean)
//   player.addListener(fn) → { remove() }

import { useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { createWebPlayer } from './webAudioPlayer';

let _useAudioPlayer = null;
if (Platform.OS !== 'web') {
  _useAudioPlayer = require('expo-audio').useAudioPlayer;
}

/**
 * Hook: kembalikan player yang bekerja di web & native.
 * Identik dengan useAudioPlayer(null) tapi cross-platform.
 */
export function usePracticePlayer() {
  // ── Native ────────────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const nativePlayer = _useAudioPlayer ? _useAudioPlayer(null) : null;

  // ── Web ───────────────────────────────────────────────────────────────────
  const webRef = useRef(null);

  if (Platform.OS === 'web' && !webRef.current) {
    webRef.current = createWebPlayer();
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return () => {
      webRef.current?.destroy();
      webRef.current = null;
    };
  }, []);

  return Platform.OS === 'web' ? webRef.current : nativePlayer;
}
