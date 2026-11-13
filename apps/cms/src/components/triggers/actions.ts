'use server';

import { db } from '@/lib/db';
import { getTrigger } from '@/lib/triggers';

export type RunTriggerResult = { ok: true } | { ok: false; error: string };

const logPrefix = '[runTrigger]';

// TODO: verify authentication here once the cms has login.
export async function runTrigger(
  siteId: string,
  id: string,
  value?: string,
): Promise<RunTriggerResult> {
  const trigger = getTrigger(id);
  if (!trigger) {
    return { ok: false, error: 'Okänd trigger.' };
  }

  const site = await db.getSite(siteId);
  if (!site) {
    return { ok: false, error: 'Okänd sajt.' };
  }
  if (!site.url || !site.api_secret) {
    return {
      ok: false,
      error: 'Ange sajtens adress och API-nyckel i sajtinställningarna.',
    };
  }

  const trimmedValue = String(value ?? '').trim();
  if (trigger.input && !trimmedValue) {
    return { ok: false, error: `${trigger.input.label} måste anges.` };
  }

  try {
    const url = new URL(trigger.endpoint, site.url);
    console.log(logPrefix, 'Sending request to:', url.toString());
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${site.api_secret}`,
        ...(trigger.input && { 'Content-Type': 'application/json' }),
      },
      ...(trigger.input && {
        body: JSON.stringify({ [trigger.input.name]: trimmedValue }),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`runTrigger ${id} failed with status ${response.status}`);
      return { ok: false, error: `Misslyckades (${response.status})` };
    }
  } catch (error) {
    console.error(`runTrigger ${id} failed`, error);
    return { ok: false, error: 'Misslyckades' };
  }

  return { ok: true };
}
