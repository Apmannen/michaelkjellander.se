import { triggers } from '@/lib/triggers';

import { TriggerButton } from '../../components/triggers/trigger-button';

export default function TriggersPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <h1 className="text-sm font-medium">Triggers</h1>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ul className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-8">
          {triggers.map((trigger) => (
            <li
              key={trigger.id}
              className="flex items-center justify-between gap-4 rounded-md border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-semibold">{trigger.label}</p>
                <p className="text-xs text-zinc-500">{trigger.description}</p>
              </div>
              <TriggerButton triggerId={trigger.id} input={trigger.input} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
