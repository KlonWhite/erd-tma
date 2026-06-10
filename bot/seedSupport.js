import { assertConfig } from './config.js';
import { seedDemoSupport } from './support.js';

assertConfig();

const { dialogue, text } = await seedDemoSupport('Ошибка');
console.log(`[seed-support] диалог #${dialogue.id}: «${text}»`);
