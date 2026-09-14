import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import { supabase } from '@/lib/supabase';

export const REMINDER_LEAD_OPTIONS = [60, 120, 180, 240] as const;
export type ReminderLeadMinutes = (typeof REMINDER_LEAD_OPTIONS)[number];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId ||
    undefined
  );
}

export function leadLabel(minutes: number) {
  const hours = Math.max(1, Math.round(minutes / 60));
  return hours === 1 ? '1h' : `${hours}h`;
}

export async function getReminderPrefs() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('users')
    .select('reminders_enabled, reminder_lead_minutes')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    if (error.code === '42703' || error.message.includes('reminder_')) {
      return { enabled: false, leadMinutes: 120 as ReminderLeadMinutes };
    }
    throw new Error(error.message);
  }

  const lead = Number(data?.reminder_lead_minutes);
  return {
    enabled: data?.reminders_enabled === true,
    leadMinutes: (REMINDER_LEAD_OPTIONS.includes(lead as ReminderLeadMinutes)
      ? lead
      : 120) as ReminderLeadMinutes,
  };
}

export async function saveReminderPrefs(input: {
  enabled: boolean;
  leadMinutes: ReminderLeadMinutes;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('users')
    .update({
      reminders_enabled: input.enabled,
      reminder_lead_minutes: input.leadMinutes,
    })
    .eq('id', user.id);

  if (error) {
    throw new Error(
      error.message.includes('reminder_') || error.code === '42703'
        ? 'Reminders are not enabled on the server yet. Run supabase/reminder_prefs.sql.'
        : error.message,
    );
  }
}

async function ensurePermission() {
  if (!Device.isDevice) {
    throw new Error('Push reminders need a physical device.');
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') {
    throw new Error('Notifications were blocked. Enable them in system Settings.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('match-reminders', {
      name: 'Match reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function registerExpoPushToken() {
  await ensurePermission();
  const id = projectId();
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    id ? { projectId: id } : undefined,
  );
  const token = tokenResponse.data;
  if (!token) throw new Error('Could not get push token');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const { error } = await supabase.from('expo_push_tokens').upsert(
    {
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );

  if (error) {
    throw new Error(
      error.message.includes('expo_push_tokens') || error.code === '42P01'
        ? 'Reminders are not enabled on the server yet. Run supabase/reminder_prefs.sql.'
        : error.message,
    );
  }

  return token;
}

export async function unregisterExpoPushToken() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const id = projectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      id ? { projectId: id } : undefined,
    );
    if (tokenResponse.data) {
      await supabase.from('expo_push_tokens').delete().eq('token', tokenResponse.data);
    }
  } catch {
    // Fall through — clear all tokens for this user.
  }

  await supabase.from('expo_push_tokens').delete().eq('user_id', user.id);
}

/** Enable reminders: persist opt-in first, then register the Expo token. */
export async function enableMatchReminders(leadMinutes: ReminderLeadMinutes) {
  await saveReminderPrefs({ enabled: true, leadMinutes });
  try {
    await registerExpoPushToken();
  } catch (error) {
    // Keep prefs enabled so the Profile toggle stays on; surface token error to the UI.
    throw error instanceof Error
      ? error
      : new Error('Could not register push token');
  }
}

/** Disable reminders: prefs off + drop tokens. */
export async function disableMatchReminders(leadMinutes: ReminderLeadMinutes) {
  await saveReminderPrefs({ enabled: false, leadMinutes });
  await unregisterExpoPushToken();
}
