import { Alert } from 'react-native';

import { blockUser, reportContent } from '@/lib/account-api';

type Translate = (key: string) => string;

/** Shared Report / Block alerts for Messages list + thread. */
export function promptMessageSafety(opts: {
  t: Translate;
  kind: 'message' | 'reply';
  targetId: string;
  targetUserId: string;
  onBlocked: () => void;
  onError: (message: string) => void;
}) {
  const { t, kind, targetId, targetUserId, onBlocked, onError } = opts;

  const submitReport = (reason: string) => {
    const text = reason.trim();
    if (text.length < 3) {
      onError(t('Report details are required.'));
      return;
    }
    void reportContent({ kind, targetId, targetUserId, reason: text })
      .then(() => Alert.alert(t('Report'), t('Thanks. We will review this report.')))
      .catch((err) => onError(err instanceof Error ? err.message : t('Request failed')));
  };

  const onReport = () => {
    if (typeof Alert.prompt === 'function') {
      Alert.prompt(
        t('Report'),
        t('Tell us what is wrong with this content.'),
        [
          { text: t('Cancel'), style: 'cancel' },
          { text: t('Submit report'), onPress: (reason?: string) => submitReport(reason || '') },
        ],
        'plain-text',
      );
      return;
    }
    Alert.alert(t('Report'), t('Report this content as inappropriate?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Submit report'),
        style: 'destructive',
        onPress: () => submitReport('Inappropriate or abusive content'),
      },
    ]);
  };

  const onBlock = () => {
    Alert.alert(
      t('Block user'),
      t('Their messages and replies will be hidden from your feed immediately.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Block'),
          style: 'destructive',
          onPress: () => {
            void blockUser(targetUserId)
              .then(() => {
                Alert.alert(
                  t('Blocked'),
                  t('This user is blocked. You can unblock them from Profile.'),
                );
                onBlocked();
              })
              .catch((err) =>
                onError(err instanceof Error ? err.message : t('Request failed')),
              );
          },
        },
      ],
    );
  };

  Alert.alert(t('Safety'), t('Report or block this user.'), [
    { text: t('Cancel'), style: 'cancel' },
    { text: t('Report'), onPress: onReport },
    { text: t('Block user'), style: 'destructive', onPress: onBlock },
  ]);
}
