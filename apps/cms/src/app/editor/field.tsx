// Shared by the editors of all document types.

export const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900';

export const secondaryButtonClass =
  'shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800';

export function Field({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <div>
        <label htmlFor={htmlFor} className='text-sm font-semibold'>
          {label}
        </label>
        {description && <p className='text-xs text-zinc-500'>{description}</p>}
      </div>
      {children}
    </div>
  );
}
