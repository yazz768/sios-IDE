import * as db from '../db/database';

let timer = null;
const OFFSET_KEY = 'sios_tg_offset';

export function startTelegramPolling(config, onNewIdea) {
  stopTelegramPolling();
  if (!config?.token?.trim() || !config?.active) return;

  const poll = async () => {
    const offset = parseInt(localStorage.getItem(OFFSET_KEY) || '0');
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${config.token.trim()}/getUpdates?offset=${offset}&timeout=0`
      );
      const data = await res.json();
      if (!data.ok || !data.result?.length) return;

      for (const update of data.result) {
        // Advance offset so we never process this update again
        localStorage.setItem(OFFSET_KEY, update.update_id + 1);

        const text = (update.message?.text || '').trim();
        if (!text) continue;

        const prefix = (config.prefix || '').trim();
        if (prefix && !text.startsWith(prefix)) continue;

        const content = prefix ? text.slice(prefix.length).trim() : text;
        if (!content) continue;

        await db.createIdea({ content, source: 'telegram', column_id: 'inbox' });
        onNewIdea?.();
      }
    } catch (err) {
      console.warn('[Telegram polling error]', err.message);
    }
  };

  // Run once immediately, then on the configured interval
  poll();
  timer = setInterval(poll, Math.max(10, config.polling_interval || 30) * 1000);
  console.log(`[Telegram] polling started — every ${config.polling_interval || 30}s, prefix: "${config.prefix || '(none)'}"`);}

export function stopTelegramPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[Telegram] polling stopped');
  }
}
