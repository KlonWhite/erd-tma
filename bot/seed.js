import { assertConfig } from './config.js';
import { seedDemoOrders } from './orders.js';

assertConfig();

const result = await seedDemoOrders();
if (result.skipped) {
  console.log('[seed] пропуск: уже есть pending-заказы');
} else {
  console.log(`[seed] создано заказов: ${result.created}`);
}
