import cron from 'node-cron';
import { Warranty } from '../models/Warranty.js';
import { notifyCustomer } from '../services/notificationService.js';
import { logger } from '../config/logger.js';

const REMINDER_WINDOWS = [30, 7, 1]; // days before expiry, per spec §16

function dayRange(daysFromNow) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Runs once a day. For each reminder window (30/7/1 days out), finds
 * warranties expiring in exactly that day-window and sends one reminder —
 * never re-notifies the same warranty/window twice, since the date match
 * only fires on that single calendar day.
 */
export async function runWarrantyExpiryReminders() {
  for (const days of REMINDER_WINDOWS) {
    const { start, end } = dayRange(days);
    const warranties = await Warranty.find({ endDate: { $gte: start, $lt: end }, manualStatus: null }).populate('productId', 'name');

    for (const warranty of warranties) {
      await notifyCustomer({
        storeId: warranty.storeId,
        customerId: warranty.customerId,
        event: 'WARRANTY_EXPIRING',
        title: 'Warranty expiring soon',
        message: `Your warranty for ${warranty.productId?.name || 'your product'} expires in ${days} day${days === 1 ? '' : 's'}.`,
        relatedEntityType: 'Warranty',
        relatedEntityId: warranty._id,
      });
    }

    if (warranties.length) logger.info(`Sent ${warranties.length} warranty expiry reminder(s) for the ${days}-day window`);
  }
}

export function scheduleWarrantyReminders() {
  // Runs daily at 09:00 server time.
  cron.schedule('0 9 * * *', () => {
    runWarrantyExpiryReminders().catch((err) => logger.error('Warranty reminder job failed', { error: err.message }));
  });
  logger.info('Warranty expiry reminder job scheduled (daily 09:00)');
}
