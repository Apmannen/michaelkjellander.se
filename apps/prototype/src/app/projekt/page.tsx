import type { Metadata } from 'next';
import { PageTitle } from '@/components/PageTitle';

export const metadata: Metadata = { title: 'Projekt' };

const projects = [
  { name: 'michaelkjellander.se', description: 'Den här sajten. Next.js, Payload CMS och Supabase.', status: 'Pågående' },
  { name: 'Ludde', description: 'Samlarspel i Unity 3D.', status: 'Släppt 2023' },
  { name: 'Pixelpussel', description: 'Pusselspel i TypeScript för webben.', status: 'Släppt 2025' },
];

export default function Page() {
  return (
    <>
      <PageTitle title='Projekt' intro='Saker jag bygger, har byggt eller borde bygga klart.' />
      <ul className='divide-y divide-line border-y border-line'>
        {projects.map((project) => (
          <li key={project.name} className='flex flex-wrap items-baseline justify-between gap-2 py-5'>
            <div>
              <p className='text-[22px] font-bold'>{project.name}</p>
              <p className='text-muted'>{project.description}</p>
            </div>
            <span className='text-[14px] font-semibold uppercase tracking-[0.12em] text-accent-800'>{project.status}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
