import { supabase } from './supabase';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  severity: NotificationSeverity;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS = {
  welcome: true,
  campaign_finished: true,
  generation_finished: true,
  email_skipped: true,
  email_failed: true,
  new_reply: true,
  low_credits: true,
  mailbox_error: true,
  product_updates: true,
};

export type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS;
export type NotificationSettingKey = keyof NotificationSettings;

export const NOTIFICATION_SETTING_GROUPS: Array<{
  title: string;
  items: Array<{ key: NotificationSettingKey; label: string; description: string }>;
}> = [
  {
    title: 'Kampanie',
    items: [
      {
        key: 'generation_finished',
        label: 'Generowanie gotowe',
        description: 'Gdy AI zakończy tworzenie maili do review',
      },
      {
        key: 'campaign_finished',
        label: 'Wysyłka zakończona',
        description: 'Gdy kampania wyśle wszystkie zaplanowane maile',
      },
      {
        key: 'email_skipped',
        label: 'Mail pominięty',
        description: 'Gdy wiadomość zostanie odrzucona w review',
      },
      {
        key: 'email_failed',
        label: 'Błąd wysyłki lub odbicie',
        description: 'Gdy SMTP nie wyśle maila albo odbiorca go odrzuci',
      },
      {
        key: 'new_reply',
        label: 'Nowa odpowiedź',
        description: 'Gdy lead odpowie na wiadomość z kampanii',
      },
    ],
  },
  {
    title: 'Konto i system',
    items: [
      {
        key: 'welcome',
        label: 'Powitanie nowego konta',
        description: 'Krótki startowy komunikat po utworzeniu profilu',
      },
      {
        key: 'low_credits',
        label: 'Niski stan tokenów',
        description: 'Gdy zostanie mniej niż 10% bieżącego limitu',
      },
      {
        key: 'mailbox_error',
        label: 'Problem ze skrzynką',
        description: 'Gdy skrzynka przejdzie w status błędu',
      },
      {
        key: 'product_updates',
        label: 'Aktualizacje produktu',
        description: 'Ważne zmiany i nowe możliwości platformy',
      },
    ],
  },
];

function normalizeSettings(row: Partial<NotificationSettings> | null | undefined): NotificationSettings {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(row || {}),
  };
}

export async function fetchNotifications(limit = 10): Promise<AppNotification[]> {
  const { data, error } = await (supabase as any)
    .from('app_notifications')
    .select('id, type, title, body, severity, entity_type, entity_id, action_url, metadata, read_at, created_at')
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Nie udało się pobrać powiadomień:', error);
    return [];
  }

  return (data || []) as AppNotification[];
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return DEFAULT_NOTIFICATION_SETTINGS;

  const { data, error } = await (supabase as any)
    .from('notification_settings')
    .select('welcome, campaign_finished, generation_finished, email_skipped, email_failed, new_reply, low_credits, mailbox_error, product_updates')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Nie udało się pobrać ustawień powiadomień:', error);
    return DEFAULT_NOTIFICATION_SETTINGS;
  }

  if (!data) {
    await (supabase as any)
      .from('notification_settings')
      .upsert({ user_id: session.user.id, ...DEFAULT_NOTIFICATION_SETTINGS }, { onConflict: 'user_id' });
  }

  return normalizeSettings(data);
}

export async function saveNotificationSettings(settings: NotificationSettings) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: new Error('Brak sesji użytkownika') };

  return (supabase as any)
    .from('notification_settings')
    .upsert(
      { user_id: session.user.id, ...settings },
      { onConflict: 'user_id' }
    );
}

export async function createNotification(params: {
  type: string;
  title: string;
  body?: string | null;
  severity?: NotificationSeverity;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
}) {
  const { error } = await (supabase as any).rpc('zec_notify_user', {
    p_type: params.type,
    p_title: params.title,
    p_body: params.body ?? null,
    p_severity: params.severity ?? 'info',
    p_entity_type: params.entityType ?? null,
    p_entity_id: params.entityId ?? null,
    p_action_url: params.actionUrl ?? null,
    p_metadata: params.metadata ?? {},
    p_dedupe_key: params.dedupeKey ?? null,
  });

  if (error) {
    console.error('Nie udało się utworzyć powiadomienia:', error);
  }
}

export async function markNotificationRead(id: string) {
  const { error } = await (supabase as any).rpc('zec_mark_notification_read', {
    p_notification_id: id,
  });

  if (error) {
    console.error('Nie udało się oznaczyć powiadomienia jako przeczytane:', error);
  }
}

export async function markAllNotificationsRead() {
  const { error } = await (supabase as any).rpc('zec_mark_all_notifications_read');

  if (error) {
    console.error('Nie udało się oznaczyć powiadomień jako przeczytane:', error);
  }
}
