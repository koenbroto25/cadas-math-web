/**
 * BotCharacter.jsx — FASE 9: Avatar React Native Animated
 * SVG dari kak_cadas_rive_package_v2, animasi via Animated API (tanpa Rive).
 * Gamification: companion growth, level-up celebration, welcome-back.
 *
 * Sprint G.2 fix: VISEME map final v2 — set A-H+X uppercase, path case-safe
 * dengan alias lengkap untuk semua kode Rhubarb (A–H+X).
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, StyleSheet, Image, View, Text } from 'react-native';
import { useStore } from '../store/useStore';

// â”€â”€ Local SVG assets (copied from kak_cadas_rive_package_v2) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BODY_BASE  = require('../assets/bot/body/body_base.svg');
const EXPR = {
  idle:         require('../assets/bot/expr/idle.svg'),
  listening:    require('../assets/bot/expr/listening.svg'),
  thinking:     require('../assets/bot/expr/thinking.svg'),
  hype:         require('../assets/bot/expr/hype.svg'),
  celebrating:  require('../assets/bot/expr/celebrating.svg'),
  disappointed: require('../assets/bot/expr/disappointed.svg'),
};

// â”€â”€ Viseme SVG — set baru (a,b,c,d,e,x) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const V = {
  A: require('../assets/bot/viseme/A.svg'),  // M/B/P — bibir tutup
  B: require('../assets/bot/viseme/B.svg'),  // I/E — meregang
  C: require('../assets/bot/viseme/C.svg'),  // Schwa — netral rileks
  D: require('../assets/bot/viseme/D.svg'),  // A/H — mulut lebar
  E: require('../assets/bot/viseme/E.svg'),  // O/U — bulat
  F: require('../assets/bot/viseme/F.svg'),  // U/W — fallback E
  G: require('../assets/bot/viseme/G.svg'),  // S/Z/T/D/N — gigi terlihat
  H: require('../assets/bot/viseme/H.svg'),  // F/V — celah tipis
  X: require('../assets/bot/viseme/X.svg'),  // Silent — rileks
};

const VISEME = {
  // Rhubarb standard set
  X: V.X, A: V.A, B: V.B, C: V.C, D: V.D, E: V.E,
  F: V.F, G: V.G, H: V.H,
  // Alias huruf kecil (defensive — jika backend kirim lowercase)
  x: V.X, a: V.A, b: V.B, c: V.C, d: V.D, e: V.E,
  f: V.F, g: V.G, h: V.H,
  // Alias fonem lama (defensive — jika ada data lama di DB)
  M: V.B, P: V.B,           // bilabial â†’ B
  O: V.A, U: V.E,           // vokal bulat â†’ A/E
  K: V.G, N: V.D, L: V.D,  // konsonan â†’ alias terdekat
  V: V.F,                    // labiodental â†’ F
};

// Fallback loop saat speaking tanpa data viseme (premium live / tidak ada cue)
const SPEAKING_LOOP = ['X', 'A', 'G', 'D', 'G', 'B', 'C', 'D', 'A', 'E'];

// Map botState â†’ expression asset
const EXPR_MAP = {
  idle:              EXPR.idle,
  listening:         EXPR.listening,
  thinking:          EXPR.thinking,
  speaking_calm:     EXPR.idle,
  speaking_hype:     EXPR.hype,
  celebrating:       EXPR.celebrating,
  disappointed_mild: EXPR.disappointed,
  sleeping:          EXPR.idle,
  welcome_back:      EXPR.hype,
  level_up:          EXPR.celebrating,
  fast_track:        EXPR.celebrating,
};

export default function BotCharacter({ size = 120, style, visemeData = null, showCompanion = false }) {
  const botState       = useStore((s) => s.botState);
  const streak         = useStore((s) => s.streak);
  const companionLevel = useStore((s) => s.companionLevel);

  // Animated values
  const floatAnim     = useRef(new Animated.Value(0)).current;
  const shakeAnim     = useRef(new Animated.Value(0)).current;
  const bounceAnim    = useRef(new Animated.Value(1)).current;
  const opacityAnim   = useRef(new Animated.Value(1)).current;
  const rotateAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const crossfadeAnim = useRef(new Animated.Value(1)).current;

  const [currentViseme, setCurrentViseme] = useState('X');
  const [prevExpr, setPrevExpr]           = useState(EXPR.idle);
  const [currExpr, setCurrExpr]           = useState(EXPR.idle);
  const visemeTimerRef = useRef(null);

  const isSpeaking = botState === 'speaking_calm' || botState === 'speaking_hype';
  const exprAsset  = EXPR_MAP[botState] || EXPR.idle;

  // Resolve viseme — uppercase defensive, fallback ke X jika kode tidak dikenal
  const visemeAsset = VISEME[currentViseme.toUpperCase()] || V.X;

  // â”€â”€ Crossfade saat ekspresi berubah â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (exprAsset !== currExpr) {
      setPrevExpr(currExpr);
      setCurrExpr(exprAsset);
      crossfadeAnim.setValue(0);
      Animated.timing(crossfadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }).start();
    }
  }, [exprAsset]);

  // â”€â”€ Float idle (selalu jalan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1800, useNativeDriver: true }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  // â”€â”€ Animasi per state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    shakeAnim.setValue(0);
    bounceAnim.setValue(1);
    opacityAnim.setValue(1);
    rotateAnim.setValue(0);
    scaleAnim.setValue(1);

    if (botState === 'celebrating' || botState === 'level_up' || botState === 'fast_track') {
      const isSpecial = botState === 'level_up' || botState === 'fast_track';
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: isSpecial ? 1.3 : 1.2,  duration: 120, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: isSpecial ? 1.15 : 1.08, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1.0,  duration: 100, useNativeDriver: true }),
      ]).start();

    } else if (botState === 'disappointed_mild') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -5, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  5, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 70, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 70, useNativeDriver: true }),
      ]).start();

    } else if (botState === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: -2, duration: 600, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue:  2, duration: 600, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue:  0, duration: 600, useNativeDriver: true }),
        ]),
        { iterations: 4 }
      ).start();

    } else if (botState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
        ])
      ).start();

    } else if (botState === 'speaking_hype') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1.04, duration: 180, useNativeDriver: true }),
          Animated.timing(bounceAnim, { toValue: 0.98, duration: 180, useNativeDriver: true }),
        ]),
        { iterations: 4 }
      ).start(() => bounceAnim.setValue(1));

    } else if (botState === 'sleeping') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1.0, duration: 2000, useNativeDriver: true }),
        ])
      ).start();

    } else if (botState === 'welcome_back') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [botState]);

  // â”€â”€ Lip-sync viseme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);

    if (!isSpeaking) {
      setCurrentViseme('X');
      return;
    }

    if (visemeData && visemeData.mouthCues && visemeData.mouthCues.length > 0) {
      // Data Rhubarb / pcmToVisemes tersedia — sinkron per timestamp
      const cues = visemeData.mouthCues;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const cue = cues.find(c => elapsed >= c.start && elapsed < c.end);
        setCurrentViseme(cue ? cue.value : 'X');
      };
      visemeTimerRef.current = setInterval(tick, 40);
    } else {
      // Fallback loop — saat premium live TTS belum punya viseme (Sprint G.2)
      let idx = 0;
      visemeTimerRef.current = setInterval(() => {
        setCurrentViseme(SPEAKING_LOOP[idx % SPEAKING_LOOP.length]);
        idx++;
      }, 120);
    }

    return () => { if (visemeTimerRef.current) clearInterval(visemeTimerRef.current); };
  }, [isSpeaking, visemeData]);

  // â”€â”€ Companion badge (gamification) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const companionBadge = useMemo(() => {
    if (!showCompanion) return null;
    if (companionLevel >= 5) return { icon: 'ðŸ‘‘', label: 'Master' };
    if (companionLevel >= 3) return { icon: 'â­', label: 'Streak Pro' };
    if (streak >= 5)         return { icon: 'ðŸ”¥', label: `Streak ${streak}` };
    return null;
  }, [showCompanion, companionLevel, streak]);

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[styles.container, {
          opacity: opacityAnim,
          transform: [
            { translateY: floatAnim },
            { translateX: shakeAnim },
            { scale: Animated.multiply(bounceAnim, scaleAnim) },
            { rotate: rotateAnim.interpolate({ inputRange: [-2, 2], outputRange: ['-2deg', '2deg'] }) },
          ],
        }]}
      >
        {/* Previous expression (crossfade out) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: Animated.subtract(1, crossfadeAnim) }]}>
          <Image source={prevExpr} style={{ width: size, height: size }} resizeMode="contain" />
        </Animated.View>

        {/* Current expression (crossfade in) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossfadeAnim }]}>
          <Image source={currExpr} style={{ width: size, height: size }} resizeMode="contain" />
        </Animated.View>

        {/* Viseme overlay saat speaking */}
        {isSpeaking && (
          <Image
            source={visemeAsset}
            style={[StyleSheet.absoluteFill, { width: size, height: size }]}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      {/* Companion badge */}
      {companionBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>{companionBadge.icon}</Text>
          <Text style={styles.badgeLabel}>{companionBadge.label}</Text>
        </View>
      )}
    </View>
  );
}

// â”€â”€ Intro/Body version (full body untuk halaman beranda) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BotBody({ size = 200, style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:  0, duration: 2200, useNativeDriver: true }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY: floatAnim }] }]}>
      <Image source={BODY_BASE} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { alignItems: 'center', justifyContent: 'center' },
  container:  { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  badgeIcon:  { fontSize: 12, marginRight: 3 },
  badgeLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
});
