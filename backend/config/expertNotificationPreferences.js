export const DEFAULT_EXPERT_NOTIFICATION_PREFERENCES = Object.freeze({
  sessionRequests: { push: true, email: true, sms: true },
  reminders: { push: true, email: true, sms: false },
  messages: { push: true, email: true, sms: false },
  payouts: { push: true, email: true, sms: true },
});

export function normalizeExpertNotificationPreferences(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.keys(DEFAULT_EXPERT_NOTIFICATION_PREFERENCES).map((category) => [category,
    Object.fromEntries(['push', 'email', 'sms'].map((channel) => [channel,
      typeof source[category]?.[channel] === 'boolean'
        ? source[category][channel]
        : DEFAULT_EXPERT_NOTIFICATION_PREFERENCES[category][channel],
    ])),
  ]));
}
