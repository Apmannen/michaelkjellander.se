import Link from 'next/link';

const sections = [
  {
    href: '/articles',
    title: 'Artiklar',
    description: 'Skapa och redigera artiklar.',
  },
  {
    href: '/tags',
    title: 'Taggar',
    description: 'Skapa och redigera taggar som artiklar kan kopplas till.',
  },
  {
    href: '/triggers',
    title: 'Triggers',
    description: 'Kör åtgärder på sajten, t.ex. rensa cache.',
  },
] as const;

export default function Home() {
  return (
    <main className="flex-1 overflow-y-auto">
      <ul className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-8">
        {sections.map((section) => (
          <li key={section.href}>
            <Link
              href={section.href}
              className="flex flex-col gap-0.5 rounded-md border border-zinc-200 px-4 py-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <span className="text-sm font-semibold">{section.title}</span>
              <span className="text-xs text-zinc-500">
                {section.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
