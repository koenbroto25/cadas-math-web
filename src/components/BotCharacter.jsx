/**
 * BotCharacter.jsx â€” FASE 9: Avatar React Native Animated
 * SVG dari kak_cadas_rive_package_v2, animasi via Animated API (tanpa Rive).
 * Gamification: companion growth, level-up celebration, welcome-back.
 *
 * Sprint G.2 fix v3 â€” path disesuaikan persis dengan nama file di disk:
 *   viseme/a.svg, b.svg, c.svg, d.svg, e.svg, f.svg, G.svg, H.svg, x.svg
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, StyleSheet, Image, View, Text } from 'react-native';
import { useStore } from '../store/useStore';

// â”€â”€ Local SVG assets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BODY_BASE = require('../assets/bot/body/body_base.svg');

const EXPR = {
  idle:         require('../assets/bot/expr/idle.svg'),
  listening:    require('../assets/bot/expr/listening.svg'),
  thinking:     require('../assets/bot/expr/thinking.svg'),
  hype:         require('../assets/bot/expr/hype.svg'),
  celebrating:  require('../assets/bot/expr/celebrating.svg'),
  disappointed: require('../assets/bot/expr/disappointed.svg'),
};

// â”€â”€ Viseme SVG â€” path PERSIS sesuai nama file di disk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// File di disk: a.svg b.svg c.svg d.svg e.svg f.svg G.svg H.svg x.svg
const V = {
  a: require('../assets/bot/viseme/a.svg'),  // M/B/P  â€” bibir tutup
  b: require('../assets/bot/viseme/b.svg'),  // I/E    â€” meregang
  c: require('../assets/bot/viseme/c.svg'),  // Schwa  â€” netral rileks
  d: require('../assets/bot/viseme/d.svg'),  // A/H    â€” mulut lebar
  e: require('../assets/bot/viseme/e.svg'),  // O/U    â€” bulat
  f: require('../assets/bot/viseme/f.svg'),  // U/W    â€” fallback E
  G: require('../assets/bot/viseme/G.svg'),  // S/Z/T  â€” gigi terlihat
  H: require('../assets/bot/viseme/H.svg'),  // F/V    â€” celah tipis
  x: require('../assets/bot/viseme/x.svg'),  // Silent â€” rileks
};

// â”€â”€ VISEME lookup: terima kode Rhubarb (Aâ€“H, X) huruf apa pun â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Semua kode dinormalisasi ke asset yang benar tanpa rename file.
const VISEME = {
  // Rhubarb uppercase (format standar backend)
  X: V.x, A: V.a, B: V.b, C: V.c, D: V.d,
  E: V.e, F: V.f, G: V.G, H: V.H,
  // Rhubarb lowercase (defensive â€” jika backend kirim lowercase)
  x: V.x, a: V.a, b: V.b, c: V.c, d: V.d,
  e: V.e, f: V.f, g: V.G, h: V.H,
  // Alias fonem lama (defensive â€” jika ada data lama di DB)
  M: V.a, P: V.a,            // bilabial â†’ a (bibir tutup)
  O: V.e, U: V.e,            // vokal bulat â†’ e
  K: V.G, N: V.d, L: V.d,   // konsonan â†’ alias terdekat
  V: V.H,                    // labiodental â†’ H (celah tipis)
};

// Fallback loop saat speaking tanpa data viseme
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

// â”€â”€ Komponen utama â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function BotCharacter({
  size = 120,
  style,
  visemeData = null,
  showCompanion = false,
}) {
  // Fallback: jika prop visemeData tidak di-pass (null/undefined),
  // ambil dari store agar lip-sync tetap jalan (anti-silent viseme).
  const storeViseme = useStore((s) => s.visemeData);
  const effectiveViseme = visemeData ?? storeViseme;
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
  const exprAsset  = EXPR_MAP[botState] ?? EXPR.idle;

  // Resolve viseme â€” lookup langsung, fallback ke x (silent) jika kode tidak dikenal
  const visemeAsset = VISEME[currentViseme] ?? V.x;

  // â”€â”€ Crossfade saat ekspresi berubah â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (exprAsset !== currExpr) {
      setPrevExpr(currExpr);
      setCurrExpr(exprAsset);
      crossfadeAnim.setValue(0);
      Animated.timing(crossfadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: false,
      }).start();
    }
  }, [exprAsset]);

  // â”€â”€ Float idle (selalu jalan) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1800, useNativeDriver: false }),
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
        Animated.timing(bounceAnim, { toValue: isSpecial ? 1.3 : 1.2,   duration: 120, useNativeDriver: false }),
        Animated.timing(bounceAnim, { toValue: 0.92,                     duration: 100, useNativeDriver: false }),
        Animated.timing(bounceAnim, { toValue: isSpecial ? 1.15 : 1.08, duration: 100, useNativeDriver: false }),
        Animated.timing(bounceAnim, { toValue: 1.0,                      duration: 100, useNativeDriver: false }),
      ]).start();

    } else if (botState === 'disappointed_mild') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -5, duration: 70, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue:  5, duration: 70, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 70, useNativeDriver: false }),
        Animated.timing(shakeAnim, { toValue:  0, duration: 70, useNativeDriver: false }),
      ]).start();

    } else if (botState === 'thinking') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: -2, duration: 600, useNativeDriver: false }),
          Animated.timing(rotateAnim, { toValue:  2, duration: 600, useNativeDriver: false }),
          Animated.timing(rotateAnim, { toValue:  0, duration: 600, useNativeDriver: false }),
        ]),
        { iterations: 4 }
      ).start();

    } else if (botState === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.03, duration: 800, useNativeDriver: false }),
          Animated.timing(scaleAnim, { toValue: 1.0,  duration: 800, useNativeDriver: false }),
        ])
      ).start();

    } else if (botState === 'speaking_hype') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, { toValue: 1.04, duration: 180, useNativeDriver: false }),
          Animated.timing(bounceAnim, { toValue: 0.98, duration: 180, useNativeDriver: false }),
        ]),
        { iterations: 4 }
      ).start(() => bounceAnim.setValue(1));

    } else if (botState === 'sleeping') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.6, duration: 2000, useNativeDriver: false }),
          Animated.timing(opacityAnim, { toValue: 1.0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();

    } else if (botState === 'welcome_back') {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 300, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1.0,  duration: 150, useNativeDriver: false }),
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

    if ((effectiveViseme?.mouthCues?.length > 0) || (effectiveViseme?.cues?.length > 0)) {
      // Data Rhubarb / pcmToVisemes tersedia â€” sinkron per timestamp
      const cues      = effectiveViseme.mouthCues || effectiveViseme.cues;
      const startTime = Date.now();
      const tick = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const cue     = cues.find((c) => elapsed >= c.start && elapsed < c.end);
        setCurrentViseme(cue ? cue.value : 'X');
      };
      visemeTimerRef.current = setInterval(tick, 40);
    } else {
      // Fallback loop â€” saat TTS tidak punya data viseme
      let idx = 0;
      visemeTimerRef.current = setInterval(() => {
        setCurrentViseme(SPEAKING_LOOP[idx % SPEAKING_LOOP.length]);
        idx++;
      }, 120);
    }

    return () => {
      if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);
    };
  }, [isSpeaking, effectiveViseme]);

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

// â”€â”€ BotBody â€” full body untuk halaman beranda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function BotBody({ size = 200, style }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2200, useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue:  0, duration: 2200, useNativeDriver: false }),
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

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const styles = StyleSheet.create({
  wrapper:   { alignItems: 'center', justifyContent: 'center' },
  container: { alignItems: 'center', justifyContent: 'center' },
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
