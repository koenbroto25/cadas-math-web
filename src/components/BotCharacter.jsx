/**
 * BotCharacter.jsx — FASE 9: Avatar React Native Animated
 * SVG dari kak_cadas_rive_package_v2, animasi via Animated API (tanpa Rive).
 * Gamification: companion growth, level-up celebration, welcome-back.
 *
 * FIX web v3: SVG di-serve sebagai file statis dari VM/server, diakses via URI.
 * - Web: <Image source={{ uri: BASE_URL + '/assets/bot/...' }}> — render via browser
 * - Native: sama, via network (atau bisa fallback ke require jika offline)
 * - Tidak bergantung react-native-svg-transformer yang tidak support web
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, StyleSheet, Image, View, Text } from 'react-native';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

// ── Base URL untuk SVG statis ─────────────────────────────────────────────────
// Di web: https://cadasmatematika.web.id/assets/bot/...
// Di native: sama (network request)
const BOT_BASE = `${API_BASE}/assets/bot`;

// ── URI helper ────────────────────────────────────────────────────────────────
const EXPR_URI = {
  idle:         { uri: `${BOT_BASE}/expr/idle.svg` },
  listening:    { uri: `${BOT_BASE}/expr/listening.svg` },
  thinking:     { uri: `${BOT_BASE}/expr/thinking.svg` },
  hype:         { uri: `${BOT_BASE}/expr/hype.svg` },
  celebrating:  { uri: `${BOT_BASE}/expr/celebrating.svg` },
  disappointed: { uri: `${BOT_BASE}/expr/disappointed.svg` },
};

const BODY_URI = { uri: `${BOT_BASE}/body/body_base.svg` };

const V_URI = {
  a: { uri: `${BOT_BASE}/viseme/a.svg` },
  b: { uri: `${BOT_BASE}/viseme/b.svg` },
  c: { uri: `${BOT_BASE}/viseme/c.svg` },
  d: { uri: `${BOT_BASE}/viseme/d.svg` },
  e: { uri: `${BOT_BASE}/viseme/e.svg` },
  f: { uri: `${BOT_BASE}/viseme/f.svg` },
  G: { uri: `${BOT_BASE}/viseme/G.svg` },
  H: { uri: `${BOT_BASE}/viseme/H.svg` },
  x: { uri: `${BOT_BASE}/viseme/x.svg` },
};

// ── VISEME lookup — mapping bahasa Indonesia ────────────────────────────────────
// Rhubarb A–H + X → bentuk visual yang stabil untuk bahasa Indonesia.
// Konsonan singkat dipetakan ke netral/vokal terdekat agar tidak menambah
// shape baru atau transisi visual yang tidak perceived oleh pengguna.
const VISEME_MAP = {
  A: V_URI.x, B: V_URI.x, C: V_URI.c, D: V_URI.d,
  E: V_URI.e, F: V_URI.e, G: V_URI.G, H: V_URI.H, X: V_URI.x,
  x: V_URI.x, a: V_URI.x, b: V_URI.x, c: V_URI.c, d: V_URI.d,
  e: V_URI.e, f: V_URI.e, g: V_URI.G, h: V_URI.H,
  M: V_URI.x, P: V_URI.x, O: V_URI.e, U: V_URI.e,
};

// ── Fallback loop saat speaking tanpa viseme data ─────────────────────────────
// Hanya shape vokal Indonesia + netral; tidak memakai a/b/f sebagai shape konsonan.
const SPEAKING_LOOP = ['X', 'D', 'C', 'E', 'G', 'H'];

// ── Map botState → expression ─────────────────────────────────────────────────
const EXPR_MAP = {
  idle:              EXPR_URI.idle,
  listening:         EXPR_URI.listening,
  thinking:          EXPR_URI.thinking,
  speaking_calm:     EXPR_URI.idle,
  speaking_hype:     EXPR_URI.hype,
  celebrating:       EXPR_URI.celebrating,
  disappointed_mild: EXPR_URI.disappointed,
  sleeping:          EXPR_URI.idle,
  welcome_back:      EXPR_URI.hype,
  level_up:          EXPR_URI.celebrating,
  fast_track:        EXPR_URI.celebrating,
};

// ── Komponen utama ────────────────────────────────────────────────────────────
export default function BotCharacter({
  size = 120,
  style,
  visemeData = null,
  showCompanion = false,
}) {
  const storeViseme     = useStore((s) => s.visemeData);
  const effectiveViseme = visemeData ?? storeViseme;
  const botState        = useStore((s) => s.botState);
  const streak          = useStore((s) => s.streak);
  const companionLevel  = useStore((s) => s.companionLevel);

  const floatAnim     = useRef(new Animated.Value(0)).current;
  const shakeAnim     = useRef(new Animated.Value(0)).current;
  const bounceAnim    = useRef(new Animated.Value(1)).current;
  const opacityAnim   = useRef(new Animated.Value(1)).current;
  const rotateAnim    = useRef(new Animated.Value(0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const crossfadeAnim = useRef(new Animated.Value(1)).current;

  const [currentViseme, setCurrentViseme] = useState('X');
  const [prevExpr, setPrevExpr]           = useState(EXPR_URI.idle);
  const [currExpr, setCurrExpr]           = useState(EXPR_URI.idle);
  const visemeTimerRef = useRef(null);

  const isSpeaking  = botState === 'speaking_calm' || botState === 'speaking_hype';
  const exprSource  = EXPR_MAP[botState] ?? EXPR_URI.idle;
  const visemeSrc   = VISEME_MAP[currentViseme] ?? V_URI.x;

  // ── Crossfade saat ekspresi berubah ──────────────────────────────────────────
  useEffect(() => {
    if (exprSource !== currExpr) {
      setPrevExpr(currExpr);
      setCurrExpr(exprSource);
      crossfadeAnim.setValue(0);
      Animated.timing(crossfadeAnim, {
        toValue: 1, duration: 200, useNativeDriver: false,
      }).start();
    }
  }, [exprSource]);

  // ── Float idle ────────────────────────────────────────────────────────────────
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

  // ── Animasi per botState ──────────────────────────────────────────────────────
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

  // ── Lip-sync viseme ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);

    if (!isSpeaking) {
      setCurrentViseme('X');
      return;
    }

    const cues = effectiveViseme?.mouthCues || effectiveViseme?.cues;
    if (cues?.length > 0) {
      const startTime = Date.now();
      visemeTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const cue     = cues.find((c) => elapsed >= c.start && elapsed < c.end);
        setCurrentViseme(cue ? cue.value : 'X');
      }, 40);
    } else {
      let idx = 0;
      visemeTimerRef.current = setInterval(() => {
        setCurrentViseme(SPEAKING_LOOP[idx % SPEAKING_LOOP.length]);
        idx++;
      }, 120);
    }

    return () => { if (visemeTimerRef.current) clearInterval(visemeTimerRef.current); };
  }, [isSpeaking, effectiveViseme]);

  // ── Companion badge ───────────────────────────────────────────────────────────
  const companionBadge = useMemo(() => {
    if (!showCompanion) return null;
    if (companionLevel >= 5) return { icon: '👑', label: 'Master' };
    if (companionLevel >= 3) return { icon: '⭐', label: 'Streak Pro' };
    if (streak >= 5)         return { icon: '🔥', label: `Streak ${streak}` };
    return null;
  }, [showCompanion, companionLevel, streak]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[styles.container, {
          width:   size,
          height:  size,
          opacity: opacityAnim,
          transform: [
            { translateY: floatAnim },
            { translateX: shakeAnim },
            { scale: Animated.multiply(bounceAnim, scaleAnim) },
            { rotate: rotateAnim.interpolate({ inputRange: [-2, 2], outputRange: ['-2deg', '2deg'] }) },
          ],
        }]}
      >
        {/* Previous expression — crossfade out */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: Animated.subtract(1, crossfadeAnim) }]}>
          <Image
            source={prevExpr}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Current expression — crossfade in */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossfadeAnim }]}>
          <Image
            source={currExpr}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Viseme overlay saat speaking */}
        {isSpeaking && (
          <Image
            source={visemeSrc}
            style={[StyleSheet.absoluteFill, { width: size, height: size }]}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      {companionBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>{companionBadge.icon}</Text>
          <Text style={styles.badgeLabel}>{companionBadge.label}</Text>
        </View>
      )}
    </View>
  );
}

// ── BotBody ───────────────────────────────────────────────────────────────────
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
      <Image
        source={BODY_URI}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper:   { alignItems: 'center', justifyContent: 'center' },
  container: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position:         'absolute',
    bottom:           -8,
    backgroundColor:  '#1A1A2E',
    borderRadius:     12,
    paddingHorizontal: 8,
    paddingVertical:  3,
    flexDirection:    'row',
    alignItems:       'center',
    borderWidth:      1,
    borderColor:      '#FFD700',
  },
  badgeIcon:  { fontSize: 12, marginRight: 3 },
  badgeLabel: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
});
