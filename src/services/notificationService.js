// Browser Web Push & Periodic Notification Service for MyCalCount

const NOTIF_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours cooldown per notification type

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    sendNotification('MyCalCount AI 🔔', {
      body: 'התראות פוש הופעלו בהצלחה! תקבל תזכורות חכמות למים, חלבון וקלוריות.',
      tag: 'welcome_notif'
    });
  }
  return permission;
};

export const sendNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;
  try {
    const notif = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      ...options
    });
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('Failed to dispatch browser notification:', err);
    return false;
  }
};

const shouldSendType = (typeKey) => {
  const lastSentStr = localStorage.getItem(`mycalcount_notif_last_${typeKey}`);
  if (!lastSentStr) return true;
  const lastSent = Number(lastSentStr);
  return Date.now() - lastSent > NOTIF_COOLDOWN_MS;
};

const markTypeSent = (typeKey) => {
  localStorage.setItem(`mycalcount_notif_last_${typeKey}`, String(Date.now()));
};

export const checkAndSendReminders = (storeState) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const { waterMl = 0, getDailyTotals, dailyTargets = {} } = storeState;
  const totals = getDailyTotals ? getDailyTotals() : { calories: 0, protein: 0 };
  const targetCalories = dailyTargets.targetCalories || 2000;
  const targetProtein = dailyTargets.proteinGrams || 150;
  const nowHour = new Date().getHours();

  // 1. Water Reminder (if under 1500ml after 11am)
  if (nowHour >= 11 && waterMl < 1500 && shouldSendType('water')) {
    const sent = sendNotification('תזכורת שתיית מים 💧', {
      body: `שתית ${waterMl} מ"ל מים היום. זכור לשתות עוד 2-3 כוסות לשמירה על המאזן!`,
      tag: 'water_reminder'
    });
    if (sent) markTypeSent('water');
    return;
  }

  // 2. Meal Logging Reminder (if no calories logged by 14:00)
  if (nowHour >= 14 && totals.calories === 0 && shouldSendType('meal_logging')) {
    const sent = sendNotification('עדיין לא רשמת ארוחות היום 🥗', {
      body: 'אל תשכח לתעד את ארוחת הצהריים כדי לשמור על רצף התזונה שלך!',
      tag: 'meal_reminder'
    });
    if (sent) markTypeSent('meal_logging');
    return;
  }

  // 3. Protein Target Reminder (if protein is low after 18:00)
  const remProtein = Math.max(0, targetProtein - totals.protein);
  if (nowHour >= 18 && remProtein > 40 && shouldSendType('protein')) {
    const sent = sendNotification(`יעד חלבון לערב: נותרו ${remProtein}ג' 🥩`, {
      body: `הגעת ל-${totals.protein}ג' חלבון. הוסף מנת חלבון לארוחת הערב כדי להגיע ליעד!`,
      tag: 'protein_reminder'
    });
    if (sent) markTypeSent('protein');
    return;
  }
};
