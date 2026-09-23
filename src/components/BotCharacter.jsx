/**
 * BotCharacter.jsx — FASE 9: Avatar React Native Animated
 * SVG dari kak_cadas_rive_package_v2, animasi via Animated API (tanpa Rive).
 * Gamification: companion growth, level-up celebration, welcome-back.
 *
 * FIX web v2: tambah resolveRequest di metro.config.js agar react-native-svg
 * pakai ReactNativeSVG.web.js di browser. SvgComp pakai error guard.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Animated, StyleSheet, View, Text, Platform } from 'react-native';
import { useStore } from '../store/useStore';

// Import SVG sebagai React component (web + native via SVGR transformer)
import BodyBase   from '../assets/bot/body/body_base.svg';
import ExprIdle   from '../assets/bot/expr/idle.svg';
import ExprListen from '../assets/bot/expr/listening.svg';
import ExprThink  from '../assets/bot/expr/thinking.svg';
import ExprHype   from '../assets/bot/expr/hype.svg';
import ExprCelebr from '../assets/bot/expr/celebrating.svg';
import ExprDisap  from '../assets/bot/expr/disappointed.svg';

import VA from '../assets/bot/viseme/a.svg';
import VB from '../assets/bot/viseme/b.svg';
import VC from '../assets/bot/viseme/c.svg';
import VD from '../assets/bot/viseme/d.svg';
import VE from '../assets/bot/viseme/e.svg';
import VF from '../assets/bot/viseme/f.svg';
import VG from '../assets/bot/viseme/G.svg';
import VH from '../assets/bot/viseme/H.svg';
import VX from '../assets/bot/viseme/x.svg';

// Lookup tables
const EXPR_MAP = {
  idle:              ExprIdle,
  listening:         ExprListen,
  thinking:          ExprThink,
  speaking_calm:     ExprIdle,
  speaking_hype:     ExprHype,
  celebrating:       ExprCelebr,
  disappointed_mild: ExprDisap,
  sleeping:          ExprIdle,
  welcome_back:      ExprHype,
  level_up:          ExprCelebr,
  fast_track:        ExprCelebr,
};

const VISEME_MAP = {
  X: VX, A: VA, B: VB, C: VC, D: VD, E: VE, F: VF, G: VG, H: VH,
  x: VX, a: VA, b: VB, c: VC, d: VD, e: VE, f: VF, g: VG, h: VH,
  M: VA, P: VA, O: VE, U: VE, K: VG, N: VD, L: VD, V: VH,
};

const SPEAKING_LOOP = ['X', 'A', 'G', 'D', 'G', 'B', 'C', 'D', 'A', 'E'];

// Helper render SVG — resolve default export, guard null & typeof
function SvgComp({ Svg, size, style }) {
  if (!Svg) return null;
  // SVGR bisa return component langsung atau { default: Comp }
  const Comp = (Svg && typeof Svg === 'object' && typeof Svg.default === 'function')
    ? Svg.default
    : Svg;
  if (typeof Comp !== 'function') return null;
  try {
    return <Comp width={size} height={size} style={style} />;
  } catch (e) {
    if (__DEV__) console.warn('[SvgComp] render error:', e?.message);
    return null;
  }
}

// Komponen utama
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
  const [prevExpr, setPrevExpr]           = useState(ExprIdle);
  const [currExpr, setCurrExpr]           = useState(ExprIdle);
  const visemeTimerRef = useRef(null);

  const isSpeaking  = botState === 'speaking_calm' || botState === 'speaking_hype';
  const exprAsset   = EXPR_MAP[botState] ?? ExprIdle;
  const visemeAsset = VISEME_MAP[currentViseme] ?? VX;

  // Crossfade saat ekspresi berubah
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

  // Float idle
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

  // Animasi per state
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

  // Lip-sync viseme
  useEffect(() => {
    if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);
    if (!isSpeaking) { setCurrentViseme('X'); return; }

    const cues = effectiveViseme?.mouthCues || effectiveViseme?.cues;
    if (cues?.length > 0) {
      const startTime = Date.now();
      const tick = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const cue = cues.find((c) => elapsed >= c.start && elapsed < c.end);
        setCurrentViseme(cue ? cue.value : 'X');
      };
      visemeTimerRef.current = setInterval(tick, 40);
    } else {
      let idx = 0;
      visemeTimerRef.current = setInterval(() => {
        setCurrentViseme(SPEAKING_LOOP[idx % SPEAKING_LOOP.length]);
        idx++;
      }, 120);
    }
    return () => { if (visemeTimerRef.current) clearInterval(visemeTimerRef.current); };
  }, [isSpeaking, effectiveViseme]);

  // Companion badge
  const companionBadge = useMemo(() => {
    if (!showCompanion) return null;
    if (companionLevel >= 5) return { icon: '👑', label: 'Master' };
    if (companionLevel >= 3) return { icon: '⭐', label: 'Streak Pro' };
    if (streak >= 5)         return { icon: '🔥', label: `Streak ${streak}` };
    return null;
  }, [showCompanion, companionLevel, streak]);

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[styles.container, {
          width: size,
          height: size,
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
          <SvgComp Svg={prevExpr} size={size} />
        </Animated.View>

        {/* Current expression (crossfade in) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossfadeAnim }]}>
          <SvgComp Svg={currExpr} size={size} />
        </Animated.View>

        {/* Viseme overlay saat speaking */}
        {isSpeaking && (
          <View style={StyleSheet.absoluteFill}>
            <SvgComp Svg={visemeAsset} size={size} />
          </View>
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

// BotBody
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
      <BodyBase width={size} height={size} />
    </Animated.View>
  );
}

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