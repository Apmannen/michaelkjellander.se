'use client';

import { useId, useState, useTransition } from 'react';

type Status = { ok: boolean; message: string };

export type TriggerInput = {
  name: string;
  label: string;
  suggestions: readonly string[];
};

export function TriggerButton({
  endpoint,
  input,
}: {
  endpoint: string;
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
        const response = await fetch(endpoint, {
          method: 'POST',
          ...(input && {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [input.name]: trimmedValue }),
          }),
        });
        if (!response.ok) {
          setStatus({ ok: false, message: `Misslyckades (${response.status})` });
          return;
        }
        setStatus({ ok: true, message: 'Klart' });
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
