import { Notification } from '../models/Notification.js';
import { Customer } from '../models/Customer.js';
import { sendEmail } from '../utils/mailer.js';
import { getSmsProvider } from './otp/providerRegistry.js';
import { logger } from '../config/logger.js';
import { NOTIFICATION_CHANNELS } from '../constants/enums.js';

/**
 * Fires a notification event to a customer, respecting their channel
 * preferences (rule: "respect customer notification preferences, do not
 * spam"). Always writes an IN_APP record regardless of channel prefs, so
 * the event is visible in the dashboard even if email/SMS are disabled.
 * Delivery failures are logged, never thrown — a notification bug must
 * never roll back the business operation that triggered it.
 */
export async function notifyCustomer({ storeId, customerId, event, title, message, relatedEntityType, relatedEntityId }) {
  try {
    const customer = await Customer.findById(customerId);
    if (!customer) return;

    const prefs = customer.notificationPreferences || {};
    const jobs = [
      { channel: NOTIFICATION_CHANNELS.IN_APP, enabled: true },
      { channel: NOTIFICATION_CHANNELS.EMAIL, enabled: prefs.email && !!customer.email },
      { channel: NOTIFICATION_CHANNELS.SMS, enabled: prefs.sms && !!customer.phone },
    ];

    for (const job of jobs) {
      if (!job.enabled) continue;
      let status = 'SENT';
      try {
        if (job.channel === NOTIFICATION_CHANNELS.EMAIL) {
          await sendEmail({ to: customer.email, subject: title, html: `<p>${message}</p>` });
        } else if (job.channel === NOTIFICATION_CHANNELS.SMS) {
          await getSmsProvider().send({ to: customer.phone, message: `${title}: ${message}` });
        }
      } catch (err) {
        status = 'FAILED';
        logger.error('Notification delivery failed', { channel: job.channel, event, error: err.message });
      }

      await Notification.create({
        storeId,
        customerId,
        channel: job.channel,
        event,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        status,
      });
    }
  } catch (err) {
    logger.error('notifyCustomer failed', { event, error: err.message });
  }
}

export async function notifyStaff({ storeId, userId, event, title, message, relatedEntityType, relatedEntityId }) {
  try {
    await Notification.create({
      storeId,
      userId,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      event,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      status: 'SENT',
    });
  } catch (err) {
    logger.error('notifyStaff failed', { event, error: err.message });
  }
}

export async function listNotificationsForCustomer({ storeId, customerId, page = 1, limit = 20 }) {
  const filter = { storeId, customerId };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function listNotificationsForUser({ storeId, userId, page = 1, limit = 20 }) {
  const filter = { storeId, userId };
  const [items, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function markNotificationRead({ storeId, notificationId }) {
  await Notification.updateOne({ _id: notificationId, storeId }, { isRead: true });
}
