/**
 * AskKakScreen — FASE 8.7
 * Full rewrite of placeholder. Tier-aware: text input for all, mic button only for premium.
 * Tab variants: GASING | PMRI | Quick
 * FIX v2: ganti expo-av -> expo-audio (useAudioPlayer hook)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { usePracticePlayer } from '../utils/createPlayer';
import { useStore } from '../store/useStore';
import BotCharacter from '../components/BotCharacter';
import { api, API_BASE } from '../services/api';
import { useGameAudio } from '../hooks/useGameAudio';

const VARIANTS = [
  { id: 'gasing', label: 'GASING', icon: '⚡' },
  { id: 'pmri',   label: 'PMRI',   icon: '🌱' },
  { id: 'quick',  label: 'Quick',  icon: '🚀' },
];

export default function AskKakScreen({ navigation }) {
  const student      = useStore((s) => s.student);
  const currentLevel = useStore((s) => s.currentLevel);
  const levelAccess  = useStore((s) => s.levelAccess);
  const setBotState  = useStore((s) => s.setBotState);
  const visemeData   = useStore((s) => s.visemeData);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);

  const [question,       setQuestion]       = useState('');
  const [messages,       setMessages]       = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [activeVariant,  setActiveVariant]  = useState('gasing');
  const [playingId,      setPlayingId]      = useState(null);

  const scrollRef    = useRef(null);
  const cancelledRef = useRef(false);

  // usePracticePlayer: single player instance, replace source saat ganti audio
  const player = usePracticePlayer();
  const finishRef = useRef(null);
  finishRef.current = () => {
    setPlayingId(null);
    stopSpeaking();
    setBotState('idle');
  };
  const { botSpeaking } = useGameAudio();
  const botSpeakingRef = useRef(botSpeaking);
  botSpeakingRef.current = botSpeaking;

  // addListener('ended'): stop lip-sync + kembalikan BGM (paritas PracticeScreen)
  useEffect(() => {
    if (!player?.addListener) return undefined;
    const sub = player.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        finishRef.current?.();
        botSpeakingRef.current?.(false);
      }
    });
    return () => { try { sub.remove(); } catch (_) {} };
  }, [player]);

  const isPremium = levelAccess === 'premium';

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: `Halo! Aku Kak Cadas\nTanya apa saja tentang matematika Level ${currentLevel || 1}!`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  // Cleanup audio + bot state saat keluar layar
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      try { player.pause(); } catch (_) {}
      stopSpeaking();
      setBotState('idle');
    };
  }, []);

  const sendMessage = async () => {
    if (!question.trim() || loading) return;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: question.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);
    setBotState('thinking');

    try {
      const response = await fetch(`${API_BASE}/api/rag/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id:    student?.id,
          question_text: userMsg.text,
          level:         currentLevel || 1,
        }),
      });
      const data = await response.json();

      if (response.status === 403) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: data.message || 'Level ini belum dibeli.',
          isPaywall: true,
        }]);
        setBotState('idle');
      } else if (data.answer) {
        const botId  = (Date.now() + 1).toString();
        const botMsg = {
          id:             botId,
          role:           'bot',
          text:           data.answer,
          audioUrl:       data.audioUrl  || null,
          visemes:        data.visemes   || null,
          source:         data.source,
          tier:           data.tier,
          upgradeMessage: data.upgradeMessage,
        };
        setMessages(prev => [...prev, botMsg]);
        if (botMsg.audioUrl) {
          playBotAudio(botId, botMsg.audioUrl, botMsg.visemes);
        } else {
          setBotState('speaking_calm');
          setTimeout(() => setBotState('idle'), 2000);
        }
      } else {
        setMessages(prev => [...prev, {
          id:   (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Maaf, Kak Cadas belum bisa menjawab. Coba tanya dengan kata lain ya!',
        }]);
        setBotState('idle');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id:      (Date.now() + 1).toString(),
        role:    'bot',
        text:    'Yah, koneksi error. Coba lagi nanti ya!',
        isError: true,
      }]);
      setBotState('idle');
    } finally {
      setLoading(false);
    }
  };

  // Sprint G.1 — playback audio bot + lip-sync (completion via addListener)
  const playAudio = useCallback(async (msgId, audioUrl, visemes = null) => {
    if (!audioUrl) return;
    const raw = String(audioUrl);
    const url = raw.startsWith("http") ? raw : (API_BASE + (raw.startsWith("/") ? raw : ("/" + raw)));
    let vData = visemes;
    if (!vData && url.includes("/api/tts/")) {
      try {
        const m = url.match(/\/api\/tts\/([^?]+)/);
        const t = url.match(/type=(hint|trick)/);
        if (m) {
          const vRes = await fetch(api.visemeUrl(m[1], t ? t[1] : "hint"));
          if (vRes.ok) vData = await vRes.json();
        }
      } catch (_) {}
    }
    const cues = (vData && (vData.mouthCues || vData.cues)) || null;
    const vOk = Array.isArray(cues) && cues.length > 0 ? { mouthCues: cues.filter((c) => c && typeof c.start === "number" && typeof c.end === "number") } : null;
    setPlayingId(msgId);
    startSpeaking(vOk, false);
    botSpeakingRef.current?.(true);
    try {
      player.replace({ uri: url });
      player.play();
    } catch (err) {
      console.warn("[AskKak] playAudio error:", err?.message || err);
      stopSpeaking();
      botSpeakingRef.current?.(false);
      setPlayingId(null);
    }
  }, [player, startSpeaking, stopSpeaking]);
  const playBotAudio = playAudio;

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.avatarContainer}>
        <BotCharacter size={104} visemeData={visemeData} />
        <Text style={s.botName}>Kak Cadas</Text>
        {!isPremium && <Text style={s.tierBadge}>Basic — Audio terbatas</Text>}
        {isPremium  && <Text style={s.tierBadgePremium}>✨ Premium — Audio Lengkap</Text>}
      </View>

      <View style={s.variantTabs}>
        {VARIANTS.map(v => (
          <TouchableOpacity
            key={v.id}
            style={[s.variantTab, activeVariant === v.id && s.variantTabActive]}
            onPress={() => setActiveVariant(v.id)}
          >
            <Text style={s.variantIcon}>{v.icon}</Text>
            <Text style={[s.variantLabel, activeVariant === v.id && s.variantLabelActive]}>
              {v.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.messagesContainer}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[s.messageBubble, msg.role === 'user' ? s.messageUser : s.messageBot]}
          >
            <Text style={msg.role === 'user' ? s.messageUserText : s.messageBotText}>
              {msg.text}
            </Text>
            {msg.audioUrl && (
              <TouchableOpacity
                style={s.playButton}
                onPress={() => playBotAudio(msg.id, msg.audioUrl, msg.visemes)}
              >
                <Text style={s.playButtonText}>
                  {playingId === msg.id ? '🔈 Memutar...' : '🔊 Putar'}
                </Text>
              </TouchableOpacity>
            )}
            {msg.upgradeMessage && (
              <Text style={s.upgradeMessage}>{msg.upgradeMessage}</Text>
            )}
            {msg.isPaywall && (
              <TouchableOpacity
                style={s.upgradeButton}
                onPress={() => navigation.navigate('UpgradePaywall')}
              >
                <Text style={s.upgradeButtonText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {loading && (
          <View style={s.loadingContainer}>
            <ActivityIndicator color="#00F0FF" />
            <Text style={s.loadingText}>Kak Cadas sedang berpikir...</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.inputContainer}>
        <TextInput
          style={s.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Tanya Kak Cadas..."
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        {isPremium && (
          <TouchableOpacity style={s.micButton} onPress={() => {}}>
            <Text style={s.micIcon}>🎤</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.sendButton, !question.trim() && s.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!question.trim() || loading}
        >
          <Text style={s.sendButtonText}>Kirim</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#0A0A12' },
  avatarContainer:    { alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A2E' },
  botName:            { color: '#00F0FF', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  tierBadge:          { color: '#888', fontSize: 11, marginTop: 2 },
  tierBadgePremium:   { color: '#FFD700', fontSize: 11, marginTop: 2 },
  variantTabs:        { flexDirection: 'row', justifyContent: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1A1A2E' },
  variantTab:         { flex: 1, alignItems: 'center', paddingVertical: 6, marginHorizontal: 4, borderRadius: 8 },
  variantTabActive:   { backgroundColor: '#1A1A2E' },
  variantIcon:        { fontSize: 18 },
  variantLabel:       { color: '#888', fontSize: 11, marginTop: 2 },
  variantLabelActive: { color: '#00F0FF', fontWeight: 'bold' },
  messagesContainer:  { flex: 1 },
  messagesContent:    { padding: 12 },
  messageBubble:      { maxWidth: '80%', padding: 10, borderRadius: 14, marginBottom: 6 },
  messageUser:        { alignSelf: 'flex-end', backgroundColor: '#00F0FF' },
  messageBot:         { alignSelf: 'flex-start', backgroundColor: '#1A1A2E' },
  messageUserText:    { color: '#0A0A12', fontSize: 14 },
  messageBotText:     { color: '#E0E0E0', fontSize: 14, lineHeight: 20 },
  playButton:         { marginTop: 6, padding: 4, backgroundColor: '#2A2A3E', borderRadius: 6, alignSelf: 'flex-start' },
  playButtonText:     { color: '#00F0FF', fontSize: 12 },
  upgradeMessage:     { marginTop: 4, color: '#FFD700', fontSize: 12, fontStyle: 'italic' },
  upgradeButton:      { marginTop: 6, padding: 6, backgroundColor: '#FFD700', borderRadius: 6, alignSelf: 'flex-start' },
  upgradeButtonText:  { color: '#0A0A12', fontSize: 12, fontWeight: 'bold' },
  loadingContainer:   { flexDirection: 'row', alignItems: 'center', padding: 10 },
  loadingText:        { color: '#888', marginLeft: 8, fontSize: 13 },
  inputContainer:     { flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1, borderTopColor: '#1A1A2E', backgroundColor: '#0F0F1A' },
  input:              { flex: 1, backgroundColor: '#1A1A2E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, color: '#E0E0E0', fontSize: 14, maxHeight: 80 },
  micButton:          { marginLeft: 6, width: 40, height: 40, borderRadius: 20, backgroundColor: '#00F0FF', alignItems: 'center', justifyContent: 'center' },
  micIcon:            { fontSize: 18 },
  sendButton:         { marginLeft: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#00F0FF', borderRadius: 20 },
  sendButtonDisabled: { opacity: 0.4 },
  sendButtonText:     { color: '#0A0A12', fontWeight: 'bold', fontSize: 14 },
});
