/**
 * utils/fcmToken.js - Registrasi FCM device token ke backend
 *
 * Dipanggil setelah login/register parent berhasil (dari finalize()).
 * Mendukung native (iOS/Android) via expo-notifications.
 * Web (PWA) skip — FCM web push butuh service worker terpisah.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from '../services/api';

/**
 * Minta permission notifikasi dan ambil FCM/APNS push token.
 * Return token string atau null jika gagal/tidak didukung.
 */
export async function getExpoPushToken() {
  // Hanya di device fisik (bukan emulator/web)
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.log('[fcmToken] Bukan device fisik, skip registrasi token');
    return null;
  }

  // Minta permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[fcmToken] Permission notifikasi ditolak');
    return null;
  }

  // Ambil native device push token (FCM token untuk Android, APNS untuk iOS)
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    return tokenData.data || null;
  } catch (err) {
    console.warn('[fcmToken] Gagal ambil push token:', err?.message);
    return null;
  }
}

/**
 * Daftarkan FCM token ke backend setelah login parent.
 * Non-blocking — tidak throw, tidak mengganggu flow login.
 */
export async function registerFcmToken(authToken) {
  try {
    const pushToken = await getExpoPushToken();
    if (!pushToken) return;

    const platform = Platform.OS === 'ios' ? 'ios'
      : Platform.OS === 'android' ? 'android'
      : 'web';

    await api.registerDeviceToken({
      token:    pushToken,
      platform,
    }, authToken);

    console.log('[fcmToken] Token terdaftar:', pushToken.slice(0, 20) + '...');
  } catch (err) {
    console.warn('[fcmToken] Gagal daftarkan token:', err?.message);
  }
}