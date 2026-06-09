import { getSupabase } from './supabaseClient.js';

export async function getDialogue(id) {
  const { data, error } = await getSupabase()
    .from('support_dialogues')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getOpenDialogueForClient(telegramId) {
  const { data, error } = await getSupabase()
    .from('support_dialogues')
    .select('*')
    .eq('client_telegram_id', telegramId)
    .eq('status', 'open')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createDialogue(from) {
  const { data, error } = await getSupabase()
    .from('support_dialogues')
    .insert({
      client_telegram_id: from.id,
      client_name: from.first_name ?? null,
      client_username: from.username ?? null,
      status: 'open',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateOpenDialogue(from) {
  const existing = await getOpenDialogueForClient(from.id);
  if (existing) return existing;
  return createDialogue(from);
}

export async function addClientMessage(dialogueId, from, text) {
  const { error: msgError } = await getSupabase()
    .from('support_messages')
    .insert({
      dialogue_id: dialogueId,
      from_role: 'client',
      from_telegram_id: from.id,
      text,
    });

  if (msgError) throw msgError;

  await getSupabase()
    .from('support_dialogues')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', dialogueId);

  return getDialogueMessages(dialogueId);
}

export async function addAdminMessage(dialogueId, adminId, text) {
  const { error } = await getSupabase()
    .from('support_messages')
    .insert({
      dialogue_id: dialogueId,
      from_role: 'admin',
      from_telegram_id: adminId,
      text,
    });

  if (error) throw error;

  await getSupabase()
    .from('support_dialogues')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', dialogueId);
}

export async function getDialogueMessages(dialogueId) {
  const { data, error } = await getSupabase()
    .from('support_messages')
    .select('*')
    .eq('dialogue_id', dialogueId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function closeDialogueById(dialogueId) {
  const { data, error } = await getSupabase()
    .from('support_dialogues')
    .update({ status: 'closed' })
    .eq('id', dialogueId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export function formatUserLine(dialogue) {
  const name = dialogue.client_name || dialogue.client_username || 'Пользователь';
  const un = dialogue.client_username ? ` (@${dialogue.client_username})` : '';
  return `👤 ${name}${un}`;
}

/** Демо-клиент как на макете техподдержки. */
export const DEMO_SUPPORT_CLIENT = {
  id: 807841250,
  first_name: 'Арсений',
  username: 'klonwhite',
};

export async function seedDemoSupport(messageText = 'Ошибка') {
  const dialogue = await getOrCreateOpenDialogue(DEMO_SUPPORT_CLIENT);
  await addClientMessage(dialogue.id, DEMO_SUPPORT_CLIENT, messageText);
  return { dialogue, text: messageText };
}
