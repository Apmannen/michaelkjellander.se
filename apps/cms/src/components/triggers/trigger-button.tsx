'use client';

import { useId, useState, useTransition } from 'react';

import type { TriggerInput } from '@/lib/triggers';

import { runTrigger } from './actions';

type Status = { ok: boolean; message: string };

export function TriggerButton({
  triggerId,
  input,
}: {
  triggerId: string;
  input?: TriggerInput;
}) {
  const inputId = useId();
  const suggestionsId = useId();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status | undefined>(undefined);
  const [isRunning, startRunning] = useTransition();

  const trimmedValue = value.trim();
  const canRun = !isRunning && (!input || trimmedValue !== '');

  const run = () => {
    setStatus(undefined);
    startRunning(async () => {
      try {
        const result = await runTrigger(triggerId, input && trimmedValue);
        setStatus(
          result.ok
            ? { ok: true, message: 'Klart' }
            : { ok: false, message: result.error },
        );
      } catch {
        setStatus({ ok: false, message: 'Misslyckades' });
      }
    });
  };

  return (
    <form
      className="flex shrink-0 items-center gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (canRun) {
          run();
        }
      }}
    >
      {status && (
        <span
          role="status"
          className={`text-sm ${status.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {status.message}
        </span>
      )}
      {input && (
        <>
          <label htmlFor={inputId} className="sr-only">
            {input.label}
          </label>
          <input
            id={inputId}
            type="text"
            list={suggestionsId}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setStatus(undefined);
            }}
            placeholder={input.label}
            autoComplete="off"
            className="w-48 rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <datalist id={suggestionsId}>
            {input.suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </>
      )}
      <button
        type="submit"
        disabled={!canRun}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRunning ? 'Kör…' : 'Kör'}
      </button>
    </form>
  );
}
