import Notification from '../models/Notification.js';
import adminDb from '../config/db/admin.js';
Notification.sync().then(() => console.log('Notifications table migrated successfully.')).catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => adminDb.close());
