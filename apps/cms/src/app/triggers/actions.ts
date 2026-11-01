'use server';

import { getTrigger } from '@/lib/triggers';

export type RunTriggerResult = { ok: true } | { ok: false; error: string };

const logPrefix = '[runTrigger]';

// TODO: verify authentication here once the cms has login.
export async function runTrigger(
  id: string,
  value?: string,
): Promise<RunTriggerResult> {
  const trigger = getTrigger(id);
  if (!trigger) {
    return { ok: false, error: 'Okänd trigger.' };
  }

  const siteUrl = process.env.SITE_URL;
  const secret = process.env.CMS_SITE_API_SECRET;
  if (!siteUrl || !secret) {
    console.error('runTrigger: SITE_URL or CMS_SITE_API_SECRET is missing');
    return { ok: false, error: 'CMS:et saknar konfiguration för sajten.' };
  }

  const trimmedValue = String(value ?? '').trim();
  if (trigger.input && !trimmedValue) {
    return { ok: false, error: `${trigger.input.label} måste anges.` };
  }

  try {
    const url = new URL(trigger.endpoint, siteUrl);
    console.log(logPrefix, 'Sending request to:', url.toString());
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
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
