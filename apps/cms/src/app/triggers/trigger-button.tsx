'use client';

import { useState, useTransition } from 'react';

type Status = { ok: boolean; message: string };

export function TriggerButton({ endpoint }: { endpoint: string }) {
  const [status, setStatus] = useState<Status | undefined>(undefined);
  const [isRunning, startRunning] = useTransition();

  const run = () => {
    setStatus(undefined);
    startRunning(async () => {
      try {
        const response = await fetch(endpoint, { method: 'POST' });
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
    <div className="flex shrink-0 items-center gap-3">
      {status && (
        <span
          role="status"
          className={`text-sm ${status.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {status.message}
        </span>
      )}
      <button
        type="button"
        onClick={run}
        disabled={isRunning}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isRunning ? 'Kör…' : 'Kör'}
      </button>
    </div>
  );
}
